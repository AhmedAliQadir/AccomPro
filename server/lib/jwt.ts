import jwt from 'jsonwebtoken';

const isDevelopment = process.env.NODE_ENV === 'development';

if (!process.env.JWT_SECRET) {
  if (!isDevelopment) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('⚠️  WARNING: Using development fallback for JWT_SECRET. Set JWT_SECRET environment variable for production!');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = '7d';
const DOWNLOAD_TOKEN_EXPIRY = '15m';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
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
