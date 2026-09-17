import { Router } from 'express';
import multer from 'multer';
import prisma from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { requireAiLegalAddon, AiLegalRequest } from '../middleware/aiLegalGuard.middleware';
import { LegalScraperService } from '../services/legalScraper.service';
import { LegalStudyAIService } from '../services/legalStudyAI.service';
import { GuardrailService } from '../services/guardrail.service';
import { logger } from '../utils/logger';

const router = Router();

// Memory storage for direct streaming to Google Cloud Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Guardrails: All routes require authentication AND active AI_LEGAL addon
router.use(authenticate);
router.use(requireAiLegalAddon);

/**
 * GET /api/v1/legal/library
 * Lists all legal documents, Bare Acts, books, and PYQs for the organization.
 * Automatically seeds foundational statutes if library is empty.
 */
router.get('/library', async (req: AiLegalRequest, res, next) => {
  try {
    const orgId = req.aiLegalOrg!.id;
    const { category, targetExams, state, search } = req.query as {
      category?: string;
      targetExams?: string;
      state?: string;
      search?: string;
    };

    // Auto-seed if library is empty
    const count = await prisma.legalDocumentAsset.count({ where: { orgId } });
    if (count === 0) {
      await LegalScraperService.seedEssentialLegalStatutes(orgId, req.user!.id);
    }

    const where: any = { orgId };
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (targetExams && targetExams !== 'ALL') {
      where.targetExams = { in: [targetExams, 'BOTH'] };
    }
    if (state && state !== 'ALL') {
      where.state = { in: [state, 'ALL'] };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { actName: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    const assets = await prisma.legalDocumentAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({
      organization: req.aiLegalOrg!.name,
      total: assets.length,
      assets,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/library/upload
 * BYOD (Bring Your Own Book/PDF) upload pipeline into Google Cloud Storage.
 */
router.post('/library/upload', upload.single('file'), async (req: AiLegalRequest, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const orgId = req.aiLegalOrg!.id;
    const { title, actName, category, targetExams, state, summary } = req.body;

    const asset = await LegalScraperService.uploadLegalBook({
      orgId,
      uploaderId: req.user!.id,
      fileBuffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      title: title || file.originalname,
      actName,
      category: category || 'BOOK_COMMENTARY',
      targetExams: targetExams || 'BOTH',
      state: state || 'ALL',
      summary,
    });

    res.status(201).json({
      message: 'Legal document successfully ingested into private cloud storage.',
      asset,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/legal/library/:id/download
 * Generates fresh presigned download URL for instant client-side preview/download.
 */
router.get('/library/:id/download', async (req: AiLegalRequest, res, next) => {
  try {
    const orgId = req.aiLegalOrg!.id;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const downloadUrl = await LegalScraperService.getFreshDownloadUrl(String(id), orgId);
    res.json({ downloadUrl });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/scraper/run
 * Triggers the autonomous discovery & scraping agent in background.
 */
router.post('/scraper/run', async (req: AiLegalRequest, res, next) => {
  try {
    const orgId = req.aiLegalOrg!.id;
    const { searchQuery, targetSource, category, targetExams, state } = req.body;

    if (!searchQuery) {
      return res.status(400).json({ error: 'searchQuery is required' });
    }

    const job = await LegalScraperService.runScraperJob({
      orgId,
      userId: req.user!.id,
      targetSource: targetSource || 'INDIA_CODE',
      searchQuery: String(searchQuery).trim(),
      category,
      targetExams,
      state,
    });

    res.status(202).json({
      message: `Scraper Agent initiated for "${searchQuery}". Assets will be saved to your organization cloud bucket.`,
      job,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/legal/scraper/jobs
 * Retrieves status of scraper agent jobs for the current organization.
 */
router.get('/scraper/jobs', async (req: AiLegalRequest, res, next) => {
  try {
    const orgId = req.aiLegalOrg!.id;
    const jobs = await prisma.legalScraperJob.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ jobs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/pyq/discover
 * Autonomous agent endpoint to search, discover, and ingest past papers for any state, exam, year, and stage.
 */
router.post('/pyq/discover', async (req: AiLegalRequest, res, next) => {
  try {
    const orgId = req.aiLegalOrg!.id;
    const userId = req.user?.id;
    const { state, examType, stage, year, subject, customQuery } = req.body;

    const result = await LegalScraperService.discoverAndIngestPYQPaper(orgId, userId, {
      state: state || 'ALL',
      examType: examType || 'JUDICIARY',
      stage: stage || 'MAINS',
      year: Number(year) || 2023,
      subject,
      customQuery,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/ai/study-plan
 * AI Judicial Services / ADP Exam Roadmap Generator.
 */
router.post('/ai/study-plan', async (req: AiLegalRequest, res, next) => {
  try {
    const { targetExam, targetState, availableMonths, dailyHours, stageFocus } = req.body;

    const plan = await LegalStudyAIService.generateStudyPlan(req.user!.id, {
      targetExam: targetExam || 'JUDICIARY',
      targetState: targetState || 'DELHI',
      availableMonths: Number(availableMonths) || 6,
      dailyHours: Number(dailyHours) || 6,
      stageFocus: stageFocus || 'INTEGRATED',
    });

    res.json(plan);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/ai/evaluate-answer
 * Judicial Mains Subjective Answer Evaluator against judicial grading rubrics.
 */
router.post('/ai/evaluate-answer', async (req: AiLegalRequest, res, next) => {
  try {
    const { question, userAnswer, subject, targetExam, state } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({ error: 'Both question and userAnswer are required for evaluation.' });
    }

    // Evaluate query safety via GuardrailService
    const guardrail = GuardrailService.evaluateLegalQuery(userAnswer, targetExam);
    if (!guardrail.allowed) {
      return res.json({
        evaluation: guardrail.overrideResponse,
        blocked: true,
        reason: guardrail.reason,
      });
    }

    const result = await LegalStudyAIService.evaluateMainsAnswer(req.user!.id, {
      question: String(question).trim(),
      userAnswer: String(userAnswer).trim(),
      subject,
      targetExam,
      state,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/ai/generate-question
 * Generates dynamic, realistic Judicial Mains Problem or Theoretical Questions.
 */
router.post('/ai/generate-question', async (req: AiLegalRequest, res, next) => {
  try {
    const { subject, topic, targetExam, targetState, questionType } = req.body;
    const result = await LegalStudyAIService.generateMainsQuestion(req.user!.id, {
      subject: subject || 'Criminal Law',
      topic,
      targetExam,
      targetState,
      questionType,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/ai/section-drill
 * Generates Bare Act Prelims MCQs and tricky conceptual questions.
 */
router.post('/ai/section-drill', async (req: AiLegalRequest, res, next) => {
  try {
    const { actName, chapterOrTopic, difficulty, count } = req.body;

    if (!actName) {
      return res.status(400).json({ error: 'actName is required (e.g. BNS 2023, BNSS 2023, CPC 1908).' });
    }

    const drill = await LegalStudyAIService.generateSectionDrill(req.user!.id, {
      actName: String(actName).trim(),
      chapterOrTopic,
      difficulty,
      count: Number(count) || 5,
    });

    res.json(drill);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/ai/law-transition
 * New Criminal Laws (BNS, BNSS, BSA) Section comparison and analysis.
 */
router.post('/ai/law-transition', async (req: AiLegalRequest, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'query is required (e.g. "Section 302 IPC" or "Section 438 CrPC")' });
    }

    const comparison = await LegalStudyAIService.compareCriminalLaws(req.user!.id, String(query).trim());
    res.json(comparison);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/legal/ai/solve-pyq
 * Solves a past year paper or specific question with comprehensive model answers.
 */
router.post('/ai/solve-pyq', async (req: AiLegalRequest, res, next) => {
  try {
    const { paperId, paperTitle, year, state, targetExam, stage, paperContent, specificQuestion } = req.body;
    if (!paperTitle && !paperContent && !specificQuestion) {
      return res.status(400).json({ error: 'Paper title, content, or specific question is required.' });
    }

    const result = await LegalStudyAIService.solvePYQPaper(req.user!.id, {
      paperId,
      paperTitle: paperTitle || 'Judicial Services Past Year Paper',
      year,
      state,
      targetExam,
      stage,
      paperContent,
      specificQuestion,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
