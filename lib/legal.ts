export const LEGAL_UPDATED = "November 17, 2026";

/** Public contact address for legal and privacy requests. Set CONTACT_EMAIL in the host's env. */
export function contactEmail() {
  return process.env.CONTACT_EMAIL || null;
}
