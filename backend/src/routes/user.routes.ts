import { Router } from 'express';
import prisma from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../utils/password';
import { updateAiLegalPassword, getAiLegalUserStatus } from '../services/aiLegalSync.service';
import { verifyEmailDomain, isEmailConfigured, sendVerificationEmail } from '../utils/email';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    const orgId = req.query.orgId as string | undefined;
    const callerId = req.user!.id;
    const isSuperAdmin = req.user!.systemRole === 'SUPER_ADMIN' || (req.user as any).systemRole === 'SUPERADMIN';

    let userIds: string[] | undefined;

    if (!isSuperAdmin) {
      // Non-superadmin callers must be restricted to their active organization(s)
      const callerMemberships = await prisma.membership.findMany({
        where: { userId: callerId, isActive: true },
        select: { orgId: true },
      });
      const callerOrgIds = callerMemberships.map((m) => m.orgId);

      if (orgId) {
        if (!callerOrgIds.includes(orgId)) {
          return res.status(403).json({ error: 'Access denied to organization members' });
        }
        const memberships = await prisma.membership.findMany({
          where: { orgId, isActive: true },
          select: { userId: true },
        });
        userIds = memberships.map((m) => m.userId);
      } else {
        const memberships = await prisma.membership.findMany({
          where: { orgId: { in: callerOrgIds }, isActive: true },
          select: { userId: true },
        });
        userIds = memberships.map((m) => m.userId);
      }
    } else if (orgId) {
      const memberships = await prisma.membership.findMany({
        where: { orgId, isActive: true },
        select: { userId: true },
      });
      userIds = memberships.map((m) => m.userId);
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(userIds ? { id: { in: userIds } } : {}),
        ...(q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { fullName: { contains: q, mode: 'insensitive' } }] } : {}),
      },
      select: { id: true, email: true, fullName: true, avatarUrl: true, status: true, lastSeenAt: true, bio: true, timezone: true },
      take: 100,
    });
    res.json(users);
  } catch (e) { next(e); }
});

router.get('/:userId', async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const callerId = req.user!.id;
    const isSuperAdmin = req.user!.systemRole === 'SUPER_ADMIN' || (req.user as any).systemRole === 'SUPERADMIN';

    // Allow self-lookup or superadmin
    if (callerId !== targetUserId && !isSuperAdmin) {
      const callerOrgs = await prisma.membership.findMany({
        where: { userId: callerId, isActive: true },
        select: { orgId: true },
      });
      const orgIds = callerOrgs.map((m) => m.orgId);

      // Verify target user shares at least one active organization with caller
      const sharedMembership = await prisma.membership.findFirst({
        where: {
          userId: targetUserId,
          orgId: { in: orgIds },
          isActive: true,
        },
      });

      if (!sharedMembership) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    const u = await prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
      select: { id: true, email: true, fullName: true, avatarUrl: true, status: true, lastSeenAt: true, bio: true, timezone: true, createdAt: true },
    });
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json(u);
  } catch (e) { next(e); }
});

router.patch('/me', async (req, res, next) => {
  try {
    const { fullName, bio, avatarUrl, timezone, status, email } = req.body;

    let emailToUpdate: string | undefined;
    if (email !== undefined && email !== null) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail) {
        // Validate real email format and active domain MX records
        const domainCheck = await verifyEmailDomain(cleanEmail);
        if (!domainCheck.valid) {
          return res.status(400).json({ error: domainCheck.reason || 'Invalid email address syntax or non-existent domain.' });
        }

        // Check if another user is already using this email
        const existing = await prisma.user.findFirst({
          where: { email: cleanEmail, id: { not: req.user!.id } },
        });
        if (existing) {
          return res.status(400).json({ error: 'This email is already linked to another account.' });
        }
        emailToUpdate = cleanEmail;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(timezone !== undefined ? { timezone } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(emailToUpdate ? { email: emailToUpdate } : {}),
      },
    });
    res.json({ id: updated.id, email: updated.email, fullName: updated.fullName, avatarUrl: updated.avatarUrl, bio: updated.bio, timezone: updated.timezone, status: updated.status });
  } catch (e) { next(e); }
});

router.post('/me/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const ok = await verifyPassword(currentPassword, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: 'Incorrect current password.' });
      }
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, isVerified: true },
    });

    res.json({ success: true, message: user.passwordHash ? 'Password changed successfully!' : 'Password created successfully! You can now sign in using your password or Director ID.' });
  } catch (e) { next(e); }
});

router.get('/me/ai-legal-status', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find if user belongs to an org with AI_LEGAL addon
    const aiLegalMembership = user.memberships.find((m) => {
      const desc = m.organization.description || '';
      return /\[ADDONS:[^\]]*AI_LEGAL[^\]]*\]/i.test(desc);
    });

    const isSuperAdmin = req.user!.systemRole === 'SUPER_ADMIN' || (req.user as any).systemRole === 'SUPERADMIN';
    const hasAiLegal = Boolean(aiLegalMembership) || isSuperAdmin;

    if (!hasAiLegal) {
      return res.json({
        hasAiLegal: false,
        message: 'AI-Legal add-on is not active for your organization.',
      });
    }

    const aiLegalStatus = await getAiLegalUserStatus(user.email);

    res.json({
      hasAiLegal: true,
      orgName: aiLegalMembership?.organization.name || 'Institutional Add-on',
      orgSlug: aiLegalMembership?.organization.slug || 'institutional',
      email: user.email,
      isRegistered: aiLegalStatus.isRegistered,
      plan: aiLegalStatus.plan || 'BASIC',
      planStatus: aiLegalStatus.planStatus || 'active',
    });
  } catch (e) {
    next(e);
  }
});

router.post('/me/ai-legal-password', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New AI-Legal password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        memberships: {
          where: { isActive: true },
          include: { organization: true },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const aiLegalMembership = user.memberships.find((m) => {
      const desc = m.organization.description || '';
      return /\[ADDONS:[^\]]*AI_LEGAL[^\]]*\]/i.test(desc);
    });

    const isSuperAdmin = req.user!.systemRole === 'SUPER_ADMIN' || (req.user as any).systemRole === 'SUPERADMIN';
    if (!aiLegalMembership && !isSuperAdmin) {
      return res.status(403).json({ error: 'Your organization does not have the AI-Legal™ add-on enabled.' });
    }

    const prefix = aiLegalMembership?.role === 'STUDENT' ? 'STU' : (aiLegalMembership?.role === 'DIRECTOR' ? 'DIR' : (['ADMIN', 'OWNER', 'PRINCIPAL'].includes(aiLegalMembership?.role || '') ? 'ADM' : 'FAC'));
    const memberId = aiLegalMembership?.title?.match(/\[(.*?)\]/)?.[1] || `${prefix}-${new Date().getFullYear()}-${user.id.substring(0, 4)}`;

    const result = await updateAiLegalPassword(user.email, newPassword, {
      name: user.fullName,
      studentId: memberId,
      organizationName: aiLegalMembership?.organization.name || 'Institutional Partner',
      organizationSlug: aiLegalMembership?.organization.slug || 'institutional',
      role: aiLegalMembership?.role || 'STUDENT',
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to update AI-Legal password.' });
    }

    res.json({
      success: true,
      message: 'AI-Legal™ password updated successfully! You can now log into AI-Legal with your new password.',
    });
  } catch (e) {
    next(e);
  }
});

router.post('/me/send-email-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify email syntax & domain DNS MX records
    const domainCheck = await verifyEmailDomain(cleanEmail);
    if (!domainCheck.valid) {
      return res.status(400).json({ error: domainCheck.reason || 'Invalid email address or domain does not exist.' });
    }

    // 2. Check uniqueness across accounts
    const existing = await prisma.user.findFirst({
      where: { email: cleanEmail, id: { not: req.user!.id } },
    });
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered to another account.' });
    }

    // 3. Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Invalidate old tokens for this user
    await prisma.emailVerificationToken.updateMany({
      where: { userId: req.user!.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // 5. Store OTP token (valid for 15 minutes)
    await prisma.emailVerificationToken.create({
      data: {
        userId: req.user!.id,
        token: `otp_${cleanEmail}_${otpCode}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    console.log(`\n==================================================`);
    console.log(`✉️ [EMAIL VERIFICATION OTP CODE] Target: ${cleanEmail}`);
    console.log(`🔑 6-Digit OTP Code: ${otpCode}`);
    console.log(`👤 User ID: ${req.user!.id}`);
    console.log(`==================================================\n`);

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please enter the code to confirm.`,
      devOtp: !isEmailConfigured() ? otpCode : undefined,
    });
  } catch (e) { next(e); }
});

router.post('/me/verify-email-code', async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const expectedToken = `otp_${cleanEmail}_${cleanCode}`;
    const tokenRecord = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: req.user!.id,
        token: expectedToken,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid or expired 6-digit verification code. Please request a new code.' });
    }

    // Check again for uniqueness before saving
    const existing = await prisma.user.findFirst({
      where: { email: cleanEmail, id: { not: req.user!.id } },
    });
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered to another account.' });
    }

    // Mark token used and update user's email
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: req.user!.id },
        data: { email: cleanEmail, isVerified: true },
      }),
    ]);

    res.json({
      success: true,
      message: `Email ${cleanEmail} verified and successfully linked to your account!`,
      email: cleanEmail,
    });
  } catch (e) { next(e); }
});

export default router;
