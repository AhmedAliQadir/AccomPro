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

  // SECURITY: Require organizationId for all users EXCEPT platform admins (ADMIN role)
  // Platform admins can access data across all organizations for management purposes
  const isPlatformAdmin = req.user?.role === 'ADMIN';
  
  if (!req.organizationId && !isPlatformAdmin) {
    console.error('🚨 SECURITY: Request without organization context:', req.path, 'Role:', req.user?.role);
    return res.status(403).json({ 
      error: 'Organization context required. User account must be associated with an organization.' 
    });
  }

  // Log when platform admin accesses cross-organization data
  if (isPlatformAdmin && !req.organizationId) {
    console.log('🔓 Platform Admin accessing cross-organization data:', req.path);
  }

  next();
}

/**
 * Helper function to add organizationId to Prisma queries
 * 
 * SECURITY: This function enforces tenant isolation by adding organizationId filter.
 * - For regular users (OPS, ORG_ADMIN, SUPPORT, etc.): Requires organizationId
 * - For platform admins (ADMIN role): Optional - allows cross-organization queries
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
  // Platform admins (ADMIN role) can access data across all organizations
  const isPlatformAdmin = req.user?.role === 'ADMIN';
  
  if (!req.organizationId && !isPlatformAdmin) {
    throw new Error('CRITICAL: withTenantScope called without organizationId - this should never happen if tenantContext middleware is properly applied');
  }
  
  // If organizationId exists, add it to the filter
  // If platform admin without organizationId, return unfiltered (cross-org access)
  if (req.organizationId) {
    return {
      ...where,
      organizationId: req.organizationId,
    } as T & { organizationId: string };
  }
  
  // Platform admin without organizationId - no organization filter (cross-org access)
  return where as T & { organizationId?: string };
}

/**
 * Validates that a resource belongs to the current organization
 * 
 * Use this after fetching a single resource to ensure cross-tenant access is prevented
 * even if future code bypasses withTenantScope.
 * 
 * @throws TenantAccessError with appropriate HTTP status code (404 or 403)
 */
export class TenantAccessError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'TenantAccessError';
    this.statusCode = statusCode;
  }
}

export function validateTenantAccess(
  req: TenantRequest,
  resource: { organizationId?: string } | null
): void {
  if (!resource) {
    // Return 404 for not found (don't reveal whether it exists in another org)
    throw new TenantAccessError('Resource not found', 404);
  }

  if (req.organizationId && resource.organizationId !== req.organizationId) {
    // Return 404 (not 403) to avoid leaking information about other orgs' data
    throw new TenantAccessError('Resource not found', 404);
  }
}
