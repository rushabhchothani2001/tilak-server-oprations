import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { validateBody } from '../middleware/validate';
import { loginSchema } from '../validators/user';

const router = Router();

// Slow down password guessing: 10 failed attempts per 15 minutes for each IP + username pair.
// Keying by username too means one bad actor can't lock every user out when many people
// share an IP (an office network, or a proxy whose IP isn't forwarded correctly).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    return `${req.ip}|${username.slice(0, 50)}`;
  },
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes and try again.' },
});

router.post('/login', loginLimiter, validateBody(loginSchema), asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
