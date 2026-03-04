/**
 * SHA-256 hash of a plain-text password.
 * Returns a lowercase hex string (64 chars).
 * Uses the built-in Web Crypto API — no extra libraries needed.
 *
 * The same algorithm is used by PostgreSQL's pgcrypto:
 *   encode(digest('yourpassword', 'sha256'), 'hex')
 * so hashes generated here and in the SQL migration are identical.
 */
export const hashPassword = async (pwd: string): Promise<string> => {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(pwd),
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
