import fs from 'fs';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env';
import { requireAuth, requireRole } from './middleware/auth';
import { errorHandler, notFound } from './middleware/error';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import manufacturingRoutes from './routes/manufacturing.routes';
import orderRoutes from './routes/order.routes';
import userRoutes from './routes/user.routes';
import { KEEP_ALIVE_USER_AGENT } from './utils/keepAlive';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.trustProxy > 0) app.set('trust proxy', env.trustProxy);
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(
    morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
      // Don't fill the logs with the server's own keep-alive pings.
      skip: (req) => req.headers['user-agent'] === KEEP_ALIVE_USER_AGENT,
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);

  // Admin-only modules
  app.use('/api/customers', requireAuth, requireRole('admin'), customerRoutes);
  app.use('/api/orders', requireAuth, requireRole('admin'), orderRoutes);
  app.use('/api/users', requireAuth, requireRole('admin'), userRoutes);

  // Workers and admins
  app.use('/api/manufacturing', requireAuth, requireRole('admin', 'worker'), manufacturingRoutes);

  app.use('/api', notFound);

  // In production, serve the built React app from the same server.
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (env.nodeEnv === 'production' && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
