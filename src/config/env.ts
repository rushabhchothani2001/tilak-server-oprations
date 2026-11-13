import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/tilak_industries',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? '',
  /** Only send the session cookie over HTTPS. Enable when served behind HTTPS. */
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  /** Set when running behind a reverse proxy (nginx etc.) so client IPs are read correctly. */
  trustProxy: process.env.TRUST_PROXY === 'true',
};

/** Fails fast when the server is started without a usable session secret. */
export function assertAuthConfig(): void {
  if (env.jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short (min 32 characters). Generate one with:\n' +
        `  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"\n` +
        'and add it to server/.env',
    );
  }
}
