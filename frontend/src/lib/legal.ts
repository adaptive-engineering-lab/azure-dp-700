/**
 * Operator details shown on the Privacy Policy and Terms pages.
 *
 * Kept in one place so the legal pages never hard-code an identity again —
 * previously the operator's personal name and personal email address were
 * inlined in eight separate spots across the two pages.
 *
 * CONTACT_EMAIL is deliberately an example.com address. That domain is
 * reserved by RFC 2606 and can never belong to anyone, so a placeholder left
 * in by accident bounces instead of mailing a stranger.
 *
 * Before any public deployment, replace CONTACT_EMAIL with a real address you
 * monitor. The privacy policy promises a route for access, correction, and
 * deletion requests, and under GDPR that route has to actually work — a role
 * address such as privacy@yourdomain is enough, and avoids publishing a
 * personal one.
 */
export const OPERATOR_NAME = 'Adaptive Engineering Lab';

/** Governing law for the Terms, and the operator's establishment for GDPR. */
export const OPERATOR_JURISDICTION = 'Belgium';

/** TODO: replace before going public. See the note above. */
export const CONTACT_EMAIL = 'contact@example.com';
