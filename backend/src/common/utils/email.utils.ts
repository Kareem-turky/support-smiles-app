/**
 * Normalizes an email address by trimming whitespace and converting to lowercase.
 * This is the single source of truth for email normalization in the system.
 */
export function normalizeEmail(emailLine: string): string {
  if (!emailLine) return '';
  return emailLine.trim().toLowerCase();
}
