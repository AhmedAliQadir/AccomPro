import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/jwt';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Platform Admin authorization middleware
 * Only allows Orbixio LTD staff (users with isPlatformAdmin flag set in database)
 * This provides cross-organization access for platform management
 * Security: Uses database-backed flag instead of email check to prevent privilege escalation
 */
export function authorizePlatformAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user has Platform Admin flag (set in database, embedded in JWT)
  if (!req.user.isPlatformAdmin) {
    return res.status(403).json({ 
      error: 'Platform admin access required. This endpoint is restricted to Orbixio LTD staff only.' 
    });
  }

  next();
}
