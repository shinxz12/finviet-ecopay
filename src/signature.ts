import { createHmac } from 'node:crypto';

/**
 * Computes an HMAC-SHA256 signature for EcoPay API requests.
 *
 * Algorithm (from official docs):
 * 1. Exclude keys named "signature" and entries with null/undefined values
 * 2. Sort remaining keys alphabetically
 * 3. Concatenate values (as strings) with no separator
 * 4. HMAC-SHA256 the result with secretKey → lowercase hex
 */
export function createSignature(
  params: Record<string, unknown>,
  secretKey: string,
): string {
  const input = Object.keys(params)
    .filter((k) => k !== 'signature' && params[k] !== null && params[k] !== undefined)
    .sort()
    .map((k) => String(params[k]))
    .join('');

  return createHmac('sha256', secretKey).update(input).digest('hex');
}

export function verifySignature(
  params: Record<string, unknown>,
  receivedSignature: string,
  secretKey: string,
): boolean {
  return createSignature(params, secretKey) === receivedSignature;
}
