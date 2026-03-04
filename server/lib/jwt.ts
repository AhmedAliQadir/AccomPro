import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '8h';
const DOWNLOAD_TOKEN_EXPIRY = '15m';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
  isPlatformAdmin: boolean;
}

export interface DownloadTokenPayload {
  documentId: string;
  userId: string;
  exp?: number;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function signDownloadToken(payload: DownloadTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: DOWNLOAD_TOKEN_EXPIRY });
}

export function verifyDownloadToken(token: string): DownloadTokenPayload {
  return jwt.verify(token, JWT_SECRET) as DownloadTokenPayload;
}