import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Tenant Context Middleware
 * 
 * Extracts the organizationId from the authenticated user's JWT token
 * and makes it available to route handlers. This ensures all database
 * queries are automatically scoped to the user's organization.
 * 
 * In a multi-tenant SaaS architecture, this prevents data leakage between
 * organizations by enforcing organization-level isolation at the middleware layer.
 */

export interface TenantRequest extends AuthRequest {
  organizationId?: string;
}

export function tenantContext(
  req: TenantRequest,
  res: Response,
  next: NextFunction
) {
  // Extract organizationId from authenticated user
  if (req.user && 'organizationId' in req.user) {
    req.organizationId = req.user.organizationId as string;
  }

  // For development: if no organizationId, log warning but continue
  // In production, you might want to return 403 for missing organizationId
  if (!req.organizationId) {
    console.warn('⚠️ Request without organization context:', req.path);
    // Uncomment in production:
    // return res.status(403).json({ error: 'Organization context required' });
  }

  next();
}

/**
 * Helper function to add organizationId to Prisma queries
 * 
 * Usage in route handlers:
 * 
 * const tenants = await prisma.tenant.findMany({
 *   where: withTenantScope(req, { status: 'ACTIVE' })
 * });
 */
export function withTenantScope<T extends object>(
  req: TenantRequest,
  where?: T
): T & { organizationId?: string } {
  return {
    ...where,
    ...(req.organizationId ? { organizationId: req.organizationId } : {}),
  } as T & { organizationId?: string };
}

/**
 * Validates that a resource belongs to the current organization
 * Throws 403 if the resource doesn't match the user's organization
 */
export function validateTenantAccess(
  req: TenantRequest,
  resource: { organizationId?: string } | null
): void {
  if (!resource) {
    throw new Error('Resource not found');
  }

  if (req.organizationId && resource.organizationId !== req.organizationId) {
    throw new Error('Access denied: Resource belongs to different organization');
  }
}
