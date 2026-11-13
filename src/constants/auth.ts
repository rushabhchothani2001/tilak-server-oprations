export const USER_ROLES = ['admin', 'worker'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** App languages: English, Hindi, Gujarati. */
export const LANGUAGES = ['en', 'hi', 'gu'] as const;
export type Language = (typeof LANGUAGES)[number];

export const SESSION_COOKIE = 'ti_session';
/** How long a login lasts (one long shift). */
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
