import { verifySignature } from './signature.js';
import { EcoPaySignatureError } from './errors.js';
import type { IPNPaymentEvent, IPNTokenizationEvent, RedirectResult } from './types.js';

export class Webhooks {
  /**
   * Verifies the HMAC-SHA256 signature of a payment IPN request from EcoPay
   * and returns a typed event object.
   *
   * Usage in an Express handler:
   *   const event = new Webhooks().verifyPaymentIPN(req.body, secretKey);
   */
  verifyPaymentIPN(body: unknown, secretKey: string): IPNPaymentEvent {
    const payload = body as Record<string, unknown>;
    const { signature, ...rest } = payload;

    if (typeof signature !== 'string') {
      throw new EcoPaySignatureError();
    }

    const primitiveFields = this.extractPrimitiveFields(rest);

    if (!verifySignature(primitiveFields, signature, secretKey)) {
      throw new EcoPaySignatureError();
    }

    return payload as unknown as IPNPaymentEvent;
  }

  /**
   * Verifies the HMAC-SHA256 signature of a tokenization IPN request from EcoPay
   * and returns a typed event object.
   */
  verifyTokenizationIPN(body: unknown, secretKey: string): IPNTokenizationEvent {
    const payload = body as Record<string, unknown>;
    const { signature, ...rest } = payload;

    if (typeof signature !== 'string') {
      throw new EcoPaySignatureError();
    }

    const primitiveFields = this.extractPrimitiveFields(rest);

    if (!verifySignature(primitiveFields, signature, secretKey)) {
      throw new EcoPaySignatureError();
    }

    return payload as unknown as IPNTokenizationEvent;
  }

  /**
   * Parses and verifies the redirect URL query params that EcoPay appends to
   * the merchant's redirect_url after payment. The docs use "Signature"
   * (capital S) in the redirect params.
   *
   * Usage:
   *   const result = webhooks.parseRedirectResult(
   *     Object.fromEntries(new URL(req.url).searchParams),
   *     secretKey,
   *   );
   */
  parseRedirectResult(
    queryParams: Record<string, string>,
    secretKey: string,
  ): RedirectResult {
    // Docs use capital "Signature" in redirect params
    const { Signature, signature: sig, ...rest } = queryParams;
    const receivedSig = Signature ?? sig;

    if (!receivedSig) {
      throw new EcoPaySignatureError();
    }

    if (!verifySignature(rest as unknown as Record<string, unknown>, receivedSig, secretKey)) {
      throw new EcoPaySignatureError();
    }

    return { ...rest, signature: receivedSig } as unknown as RedirectResult;
  }

  private extractPrimitiveFields(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
      ),
    );
  }
}
