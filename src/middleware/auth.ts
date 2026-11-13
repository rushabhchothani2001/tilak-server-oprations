import { CookieOptions, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, UserRole } from '../constants/auth';
import { UserModel } from '../models/User';
import { asyncHandler, HttpError } from './error';
import { isObjectId } from './validate';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface SessionPayload {
  sub: string;
  tv: number;
}

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.cookieSecure,
  path: '/',
});

/** Signs a session token and sets it as an httpOnly cookie. */
export function startSession(res: Response, user: { _id: unknown; tokenVersion: number }): void {
  const token = jwt.sign({ tv: user.tokenVersion } satisfies Omit<SessionPayload, 'sub'>, env.jwtSecret, {
    subject: String(user._id),
    expiresIn: SESSION_TTL_SECONDS,
    algorithm: 'HS256',
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_SECONDS * 1000 });
}

export function endSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

const SESSION_EXPIRED = 'Your session has expired. Please log in again.';

/**
 * Verifies the session cookie and loads the user from the database on every request,
 * so deactivating a user or resetting their password takes effect immediately.
 */
export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string' || !token) throw new HttpError(401, 'Please log in to continue.');

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as unknown as SessionPayload;
  } catch {
    throw new HttpError(401, SESSION_EXPIRED);
  }
  if (!isObjectId(payload.sub ?? '')) throw new HttpError(401, SESSION_EXPIRED);

  const user = await UserModel.findById(payload.sub).select('name username role active tokenVersion').lean();
  if (!user || !user.active || user.tokenVersion !== payload.tv) throw new HttpError(401, SESSION_EXPIRED);

  req.user = { id: String(user._id), name: user.name, username: user.username, role: user.role };
  next();
});

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'Please log in to continue.'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have access to this section.'));
    next();
  };
