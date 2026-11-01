// backend/src/utils/secret.ts
import crypto from 'crypto';

/**
 * Generate a cryptographically secure app secret.
 * Format: sk_{appId_prefix}_{random_hex}
 */
export function generateAppSecret(): string {
  const randomPart = crypto.randomBytes(32).toString('hex');
  return `sk_${randomPart}`;
}

/**
 * Generate a webhook signing secret.
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}