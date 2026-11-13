import dotenv from 'dotenv';

dotenv.config();

function parseTrustProxy(value: string | undefined): number {
  if (value === 'true') return 1;
  const hops = Number(value);
  return Number.isInteger(hops) && hops > 0 ? hops : 0;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/tilak_industries',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET ?? '',
  /** Only send the session cookie over HTTPS. Enable when served behind HTTPS. */
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  /**
   * Number of proxies in front of the app, so the real visitor IP is used for login limits.
   * "true" means 1. On Render behind a Vercel rewrite use 2 (Vercel edge + Render load balancer).
   */
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  /**
   * Public URL the server pings to stay awake on hosts that sleep when idle (Render's free plan
   * sleeps after 15 minutes without traffic). Render sets RENDER_EXTERNAL_URL automatically;
   * KEEP_ALIVE_URL overrides it. With neither set (local development) the ping is off.
   */
  keepAliveUrl: process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || '',
  /** Minutes between pings; 0 turns it off. Must stay under the host's idle timeout. */
  keepAliveMinutes: process.env.KEEP_ALIVE_MINUTES === undefined ? 10 : Number(process.env.KEEP_ALIVE_MINUTES),
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
