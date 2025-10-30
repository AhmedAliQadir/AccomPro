import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../prisma';

export interface AuditableRequest extends AuthRequest {
  auditLog?: {
    action: string;
    entityType: string;
    entityId?: string;
    changes?: any;
  };
}

export function createAuditLog() {
  return async (req: AuditableRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (req.auditLog && req.user && res.statusCode < 400) {
        prisma.auditLog
          .create({
            data: {
              userId: req.user.userId,
              organizationId: req.user.organizationId,
              action: req.auditLog.action,
              entityType: req.auditLog.entityType,
              entityId: req.auditLog.entityId,
              changes: req.auditLog.changes,
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            },
          })
          .catch((err) => {
            console.error('Failed to create audit log:', err);
          });
      }

      return originalJson(body);
    };

    next();
  };
}
