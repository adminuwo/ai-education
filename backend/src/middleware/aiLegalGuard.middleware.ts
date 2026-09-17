import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { logger } from '../utils/logger';

export interface AiLegalRequest extends Request {
  aiLegalOrg?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}

/**
 * Strict Guardrail Middleware:
 * Ensures that the requesting user's organization has the 'AI_LEGAL' add-on explicitly enabled.
 * If the add-on is missing or inactive, halts request immediately with HTTP 403 Forbidden.
 */
export async function requireAiLegalAddon(req: AiLegalRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Determine target orgId from params, query, body, or header
    let orgId = (req.params.orgId || req.query.orgId || req.body?.orgId || req.headers['x-org-id']) as string | undefined;

    // If orgId is not explicitly specified in the request, resolve from active membership
    if (!orgId) {
      const activeMembership = await prisma.membership.findFirst({
        where: { userId, isActive: true },
        select: { orgId: true },
      });
      orgId = activeMembership?.orgId;
    }

    if (!orgId) {
      return res.status(400).json({
        error: 'ORGANIZATION_REQUIRED',
        message: 'A valid organization context is required to access AI-Legal capabilities.',
      });
    }

    // Fetch organization and check add-ons
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true, description: true },
    });

    if (!org) {
      return res.status(404).json({
        error: 'ORGANIZATION_NOT_FOUND',
        message: 'The requested organization was not found.',
      });
    }

    const desc = org.description || '';
    const hasAiLegal = /\[ADDONS:[^\]]*AI_LEGAL[^\]]*\]/i.test(desc) || desc.toUpperCase().includes('AI_LEGAL');

    // SuperAdmin exception for testing & support
    const isSuperAdmin = req.user?.systemRole === 'SUPER_ADMIN';

    if (!hasAiLegal && !isSuperAdmin) {
      logger.warn(`[AI-Legal Guardrail Blocked] Org "${org.name}" (${org.id}) attempted to access AI-Legal feature without active license.`);
      return res.status(403).json({
        error: 'AI_LEGAL_ADDON_REQUIRED',
        message: 'The AI-Legal Suite (Legal Scraper Agent, Judicial & ADP preparation) is an institutional add-on not active for your organization.',
        orgName: org.name,
      });
    }

    req.aiLegalOrg = org;
    next();
  } catch (err: any) {
    logger.error({ err: err?.message }, '[AI-Legal Guardrail] Error validating AI-Legal addon status.');
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to verify AI-Legal subscription permissions.',
    });
  }
}
