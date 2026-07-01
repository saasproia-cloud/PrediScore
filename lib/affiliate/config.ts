// Constantes d'affiliation partagées (importables partout, y compris middleware
// edge — pas d'import serveur lourd ici).

export const REF_COOKIE = "prediscore.ref";
export const REF_MAX_AGE = 60 * 60 * 24 * 60; // 60 jours
export const DEFAULT_COMMISSION_RATE = 0.3; // 30% du 1er paiement

// Normalise un code d'affiliation (URL-safe, minuscule).
export function sanitizeCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 64);
}

// Admin(s) autorisé(s) à voir le dashboard d'affiliation — via l'env ADMIN_EMAILS
// (emails séparés par des virgules).
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
