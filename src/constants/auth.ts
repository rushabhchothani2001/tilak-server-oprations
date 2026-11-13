export const USER_ROLES = ['admin', 'worker'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SESSION_COOKIE = 'ti_session';
/** How long a login lasts (one long shift). */
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
