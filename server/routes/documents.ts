import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { createAuditLog, AuditableRequest } from '../middleware/audit';
import { encryptFile, decryptFile, computeSHA256 } from '../lib/crypto';
import { signDownloadToken, verifyDownloadToken } from '../lib/jwt';
import { DocumentType, DocumentStatus } from '@prisma/client';
import rateLimit from 'express-rate-limit';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (parseInt(process.env.MAX_UPLOAD_MB || '10', 10)) * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed'));
    }
  },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many uploads, please try again later',
});

router.use(authenticate);
router.use(createAuditLog());

router.post('/:tenantId/upload', uploadLimiter, upload.single('file'), async (req: AuditableRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { tenantId } = req.params;
    const { type, isMandatory } = req.body;

    if (!Object.values(DocumentType).includes(type)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    const sha256Hash = computeSHA256(req.file.buffer);

    const existingDoc = await prisma.document.findFirst({
      where: {
        tenantId,
        sha256Hash,
      },
    });

    if (existingDoc) {
      return res.status(409).json({ error: 'This document has already been uploaded' });
    }

    const { encryptedData, iv, authTag } = encryptFile(req.file.buffer);

    const document = await prisma.document.create({
      data: {
        tenantId,
        type,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        sha256Hash,
        uploadedById: req.user!.userId,
        isMandatory: isMandatory === 'true' || isMandatory === true,
        blob: {
          create: {
            encryptedData,
            iv,
            authTag,
          },
        },
      },
      include: {
        blob: false,
      },
    });

    req.auditLog = {
      action: 'UPLOAD_DOCUMENT',
      entityType: 'Document',
      entityId: document.id,
      changes: {
        fileName: document.fileName,
        type: document.type,
        tenantId,
      },
    };

    res.status(201).json({ document });
  } catch (error: any) {
    console.error('Upload document error:', error);
    if (error.message?.includes('file type')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/:tenantId', async (req: AuthRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { role, userId } = req.user!;

    if (role === 'SUPPORT') {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          tenancies: {
            where: { isActive: true },
            include: { room: true },
          },
        },
      });

      if (!tenant || tenant.tenancies.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const hasAccess = await prisma.assignment.findFirst({
        where: {
          userId,
          propertyId: tenant.tenancies[0].room.propertyId,
          endDate: null,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to tenant documents' });
      }
    }

    const documents = await prisma.document.findMany({
      where: { tenantId },
      select: {
        id: true,
        type: true,
        status: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedAt: true,
        verifiedAt: true,
        verificationNotes: true,
        rejectionReason: true,
        isMandatory: true,
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        verifiedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ documents });
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/:documentId/verify', authorize('ADMIN', 'OPS'), async (req: AuditableRequest, res) => {
  try {
    const { documentId } = req.params;
    const { notes } = req.body;

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'VERIFIED',
        verifiedById: req.user!.userId,
        verifiedAt: new Date(),
        verificationNotes: notes,
      },
    });

    req.auditLog = {
      action: 'VERIFY_DOCUMENT',
      entityType: 'Document',
      entityId: documentId,
      changes: { status: 'VERIFIED', notes },
    };

    res.json({ document });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ error: 'Failed to verify document' });
  }
});

router.post('/:documentId/reject', authorize('ADMIN', 'OPS'), async (req: AuditableRequest, res) => {
  try {
    const { documentId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        verifiedById: req.user!.userId,
        verifiedAt: new Date(),
        rejectionReason: reason,
      },
    });

    req.auditLog = {
      action: 'REJECT_DOCUMENT',
      entityType: 'Document',
      entityId: documentId,
      changes: { status: 'REJECTED', reason },
    };

    res.json({ document });
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({ error: 'Failed to reject document' });
  }
});

router.get('/:documentId/download-token', async (req: AuthRequest, res) => {
  try {
    const { documentId } = req.params;
    const { userId, role } = req.user!;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        tenant: {
          include: {
            tenancies: {
              where: { isActive: true },
              include: { room: true },
            },
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (role === 'SUPPORT') {
      const activeTenancy = document.tenant.tenancies[0];
      if (!activeTenancy) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const hasAccess = await prisma.assignment.findFirst({
        where: {
          userId,
          propertyId: activeTenancy.room.propertyId,
          endDate: null,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this document' });
      }
    }

    const token = signDownloadToken({ documentId, userId });

    res.json({ token });
  } catch (error) {
    console.error('Generate download token error:', error);
    res.status(500).json({ error: 'Failed to generate download token' });
  }
});

router.get('/download/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const payload = verifyDownloadToken(token);

    const document = await prisma.document.findUnique({
      where: { id: payload.documentId },
      include: {
        blob: true,
      },
    });

    if (!document || !document.blob) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const decryptedData = decryptFile(
      Buffer.from(document.blob.encryptedData),
      document.blob.iv,
      document.blob.authTag
    );

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', decryptedData.length);

    res.send(decryptedData);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(401).json({ error: 'Invalid or expired download token' });
  }
});

export default router;
