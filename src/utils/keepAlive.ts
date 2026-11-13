import { env } from '../config/env';

export const KEEP_ALIVE_USER_AGENT = 'tilak-keep-alive';

/**
 * Keeps the server from sleeping on hosts that stop idle services (Render's free plan sleeps after
 * 15 minutes with no incoming traffic). Every few minutes the server requests its own public
 * /api/health URL; that request comes in through the host's router, so it counts as traffic.
 */
export function startKeepAlive(): void {
  const minutes = env.keepAliveMinutes;
  if (!env.keepAliveUrl || !(minutes > 0)) {
    return;
  }

  let url: string;
  try {
    url = new URL('/api/health', env.keepAliveUrl).toString();
  } catch {
    console.warn(`Keep-alive disabled: "${env.keepAliveUrl}" is not a valid URL`);
    return;
  }

  const ping = async () => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': KEEP_ALIVE_USER_AGENT },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) console.warn(`Keep-alive ping returned ${res.status}`);
    } catch (error) {
      console.warn('Keep-alive ping failed:', error instanceof Error ? error.message : error);
    }
  };

  setInterval(ping, minutes * 60_000);
  console.log(`Keep-alive: pinging ${url} every ${minutes} min`);
}
