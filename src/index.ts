import { createApp } from './app';
import { connectDB } from './config/db';
import { assertAuthConfig, env } from './config/env';
import { runMigrations } from './config/migrations';
import { UserModel } from './models/User';

async function start() {
  assertAuthConfig();
  await connectDB();
  await runMigrations();

  if (!(await UserModel.exists({ role: 'admin', active: true }))) {
    console.warn('\n⚠  No admin account exists yet. Create one with:  npm run create-admin\n');
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API server running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error instanceof Error ? error.message : error);
  process.exit(1);
});
