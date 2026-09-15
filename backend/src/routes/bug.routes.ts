import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import prisma from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadBufferToGcs, deleteFromGcs } from '../services/gcs.service';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// Rate limiter for bug submissions: 20 per 15 mins per IP
const bugReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many bug reports submitted recently. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Memory storage for multer (max 10MB screenshot upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only screenshot image files (PNG, JPEG, WebP, GIF) are allowed for bug reports.'));
    }
  },
});

// Zod validation for updating bug status
const UpdateBugStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  adminNotes: z.string().max(2000).optional(),
});

// =========================================================================
// 1. POST /api/v1/bugs — Submit a Bug or Crash Report (All Roles)
// =========================================================================
router.post('/', bugReportLimiter, upload.single('image'), async (req, res, next) => {
  try {
    // 🛡️ SECURITY GUARDRAIL 1: Anti-Impersonation
    // The reporter identity is strictly locked to req.user (from verified JWT token).
    // Client-supplied userId or userEmail values are intentionally ignored.
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    // Verify user exists and is active
    const userRecord = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!userRecord) {
      return res.status(403).json({ error: 'User account is inactive or not found.' });
    }

    const {
      title,
      description,
      severity = 'MEDIUM',
      category = 'UI_BUG',
      orgId,
      orgName,
      metadata: rawMetadata,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a clear bug title (at least 3 characters).' });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({ error: 'Please describe the issue or crash (at least 5 characters).' });
    }

    // Determine current user role & campus
    const primaryMembership = userRecord.memberships?.[0];
    const userRole = req.user!.systemRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : (primaryMembership?.role || 'USER');
    const finalOrgId = orgId || primaryMembership?.orgId || null;
    const finalOrgName = orgName || primaryMembership?.organization?.name || null;

    // Parse diagnostic metadata
    let parsedMetadata: any = null;
    if (rawMetadata) {
      try {
        parsedMetadata = typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : rawMetadata;
      } catch (e) {
        parsedMetadata = { raw: String(rawMetadata).slice(0, 500) };
      }
    }

    // 📸 Handle Image Upload to Google Cloud Storage (GCS)
    let imageUrl: string | null = null;
    let gcsKey: string | null = null;
    const file = (req as any).file;

    if (file && file.buffer) {
      try {
        const uid = crypto.randomBytes(6).toString('hex');
        const sanitizedExt = path.extname(file.originalname).toLowerCase() || '.png';
        const safeBaseName = path.basename(file.originalname, sanitizedExt).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
        gcsKey = `bug-reports/${Date.now()}-${uid}-${safeBaseName}${sanitizedExt}`;

        const uploadResult = await uploadBufferToGcs(
          file.buffer,
          gcsKey,
          file.mimetype || 'image/png',
          {
            reporterId: userId,
            reporterEmail: userEmail,
            category,
            uploadedAt: new Date().toISOString(),
          }
        );

        imageUrl = uploadResult.signedUrl || uploadResult.publicUrl;
      } catch (uploadErr: any) {
        logger.warn({ err: uploadErr?.message }, '[Bug Report] GCS upload failed, continuing to save bug report record without image');
      }
    }

    // Validated Severity enum
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const finalSeverity = validSeverities.includes(String(severity).toUpperCase())
      ? (String(severity).toUpperCase() as any)
      : 'MEDIUM';

    // Create Bug Report record in DB
    const bugReport = await prisma.bugReport.create({
      data: {
        userId,
        userEmail,
        userName: userRecord.fullName || userEmail,
        userRole,
        orgId: finalOrgId,
        orgName: finalOrgName,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        severity: finalSeverity,
        status: 'OPEN',
        imageUrl,
        gcsKey,
        metadata: parsedMetadata || undefined,
      },
    });

    // Notify Super Admin via real-time WebSocket
    const io = req.app.locals.io;
    if (io) {
      io.emit('bug:new', {
        id: bugReport.id,
        title: bugReport.title,
        severity: bugReport.severity,
        category: bugReport.category,
        userEmail: bugReport.userEmail,
        userName: bugReport.userName,
        orgName: bugReport.orgName,
        createdAt: bugReport.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      bugReport,
      report: bugReport,
    });
  } catch (e) {
    next(e);
  }
});

// =========================================================================
// 2. GET /api/v1/bugs/my — Get Reports Filed by Current User (All Roles)
// =========================================================================
// 🛡️ SECURITY GUARDRAIL 2: Strictly Scoped to Caller's userId
router.get('/my', async (req, res, next) => {
  try {
    const reports = await prisma.bugReport.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        severity: true,
        status: true,
        imageUrl: true,
        adminNotes: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ reports });
  } catch (e) {
    next(e);
  }
});

// =========================================================================
// 3. GET /api/v1/bugs/:id — Get Single Report (Owner or Superadmin ONLY)
// =========================================================================
// 🛡️ SECURITY GUARDRAIL 3: BOLA / IDOR Prevention
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await prisma.bugReport.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ error: 'Bug report not found.' });
    }

    // Restrict access: Only the reporter or a Superadmin can view this report
    const isReporter = report.userId === req.user!.id;
    const isSuperAdmin = req.user!.systemRole === 'SUPER_ADMIN';

    if (!isReporter && !isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to view this bug report.' });
    }

    res.json({ report });
  } catch (e) {
    next(e);
  }
});

// =========================================================================
// 4. GET /api/v1/bugs — Superadmin Global List & Aggregates (Superadmin Only)
// =========================================================================
// 🛡️ SECURITY GUARDRAIL 4: Strict Superadmin Authorization
router.get('/', async (req, res, next) => {
  try {
    if (req.user!.systemRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Superadmin privileges required.' });
    }

    const { status, severity, category, search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const takeNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skipNum = (pageNum - 1) * takeNum;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status as any;
    }
    if (severity && severity !== 'ALL') {
      where.severity = severity as any;
    }
    if (category && category !== 'ALL') {
      where.category = category as string;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { userEmail: { contains: q, mode: 'insensitive' } },
        { userName: { contains: q, mode: 'insensitive' } },
        { orgName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [reports, totalCount, openCount, inProgressCount, criticalCount, resolvedCount] = await Promise.all([
      prisma.bugReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: skipNum,
        take: takeNum,
      }),
      prisma.bugReport.count({ where }),
      prisma.bugReport.count({ where: { status: 'OPEN' } }),
      prisma.bugReport.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.bugReport.count({ where: { severity: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.bugReport.count({ where: { status: 'RESOLVED' } }),
    ]);

    res.json({
      reports,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: takeNum,
        pages: Math.ceil(totalCount / takeNum),
      },
      metrics: {
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        critical: criticalCount,
        resolved: resolvedCount,
      },
    });
  } catch (e) {
    next(e);
  }
});

// =========================================================================
// 5. PATCH /api/v1/bugs/:id — Update Status & Resolution Notes (Superadmin Only)
// =========================================================================
// 🛡️ SECURITY GUARDRAIL 5: Superadmin Only
router.patch('/:id', validate(UpdateBugStatusSchema), async (req, res, next) => {
  try {
    if (req.user!.systemRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Superadmin privileges required.' });
    }

    const id = req.params.id as string;
    const { status, severity, adminNotes } = req.body;

    const existing = await prisma.bugReport.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Bug report not found.' });
    }

    const isResolving = (status === 'RESOLVED' || status === 'CLOSED') && existing.status !== 'RESOLVED' && existing.status !== 'CLOSED';

    const updated = await prisma.bugReport.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(severity ? { severity } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(isResolving ? { resolvedAt: new Date() } : {}),
      },
    });

    res.json({
      success: true,
      message: 'Bug report updated successfully.',
      report: updated,
    });
  } catch (e) {
    next(e);
  }
});

// =========================================================================
// 6. DELETE /api/v1/bugs/:id — Delete Report & GCS Cleanup (Superadmin Only)
// =========================================================================
// 🛡️ SECURITY GUARDRAIL 6: Superadmin Only
router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user!.systemRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Superadmin privileges required.' });
    }

    const id = req.params.id as string;
    const existing = await prisma.bugReport.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Bug report not found.' });
    }

    // Clean up screenshot from GCS bucket if present
    if (existing.gcsKey) {
      try {
        await deleteFromGcs(existing.gcsKey);
      } catch (delErr: any) {
        logger.warn({ err: delErr?.message }, '[Bug Report Delete] Failed to delete GCS object, proceeding with DB delete');
      }
    }

    await prisma.bugReport.delete({ where: { id } });

    res.json({ success: true, message: 'Bug report deleted.' });
  } catch (e) {
    next(e);
  }
});

export default router;
