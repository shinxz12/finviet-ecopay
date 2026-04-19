import { describe, it, expect } from 'vitest';
import { Webhooks } from '../src/webhooks.js';
import { createSignature } from '../src/signature.js';
import { EcoPaySignatureError } from '../src/errors.js';

const SECRET_KEY = 'MERCHANTA_SECRET_KEY';
const webhooks = new Webhooks();

describe('Webhooks.verifyPaymentIPN', () => {
  it('returns typed event when signature is valid', () => {
    const primitiveFields = {
      fv_transid: 'TXN001',
      merchant_order_id: 'OD0001',
      platform: 'web',
      merchant_code: 'MERCHANTA',
      payment_channel: 'atm',
      status: 'success',
      amount: 100000,
      description: 'Test',
      created_at: 1234567890,
      store_code: 'MERCHANTA_1',
    };
    const signature = createSignature(primitiveFields, SECRET_KEY);
    const body = { ...primitiveFields, signature };

    const event = webhooks.verifyPaymentIPN(body, SECRET_KEY);

    expect(event.fv_transid).toBe('TXN001');
    expect(event.status).toBe('success');
    expect(event.amount).toBe(100000);
  });

  it('throws EcoPaySignatureError when signature is invalid', () => {
    const body = {
      fv_transid: 'TXN001',
      merchant_order_id: 'OD0001',
      status: 'success',
      amount: 100000,
      signature: 'bad-sig',
    };
    expect(() => webhooks.verifyPaymentIPN(body, SECRET_KEY)).toThrow(EcoPaySignatureError);
  });

  it('throws EcoPaySignatureError when signature is missing', () => {
    const body = { fv_transid: 'TXN001', amount: 100000 };
    expect(() => webhooks.verifyPaymentIPN(body, SECRET_KEY)).toThrow(EcoPaySignatureError);
  });
});

describe('Webhooks.verifyTokenizationIPN', () => {
  it('returns typed event when signature is valid', () => {
    const primitiveFields = {
      fv_transid: 'TOK001',
      created_at: 1234567890,
      status: 'success',
      platform: 'web',
      payment_channel: 'atm',
      merchant_code: 'MERCHANTA',
      store_code: 'MERCHANTA_1',
      description: 'Card reg',
      merchant_user_id: 'USER001',
      payment_token: 'TOKEN_XYZ',
    };
    const signature = createSignature(primitiveFields, SECRET_KEY);
    const body = { ...primitiveFields, signature };

    const event = webhooks.verifyTokenizationIPN(body, SECRET_KEY);

    expect(event.payment_token).toBe('TOKEN_XYZ');
  });
});

describe('Webhooks.parseRedirectResult', () => {
  it('parses and verifies redirect query params', () => {
    const params = {
      order_id: 'OD0001',
      fv_payment_transid: 'TXN001',
      status: 'success',
      ts: '1638774137697',
    };
    const Signature = createSignature(params as unknown as Record<string, unknown>, SECRET_KEY);
    const queryParams = { ...params, Signature };

    const result = webhooks.parseRedirectResult(queryParams, SECRET_KEY);

    expect(result.order_id).toBe('OD0001');
    expect(result.status).toBe('success');
  });

  it('throws EcoPaySignatureError for tampered redirect params', () => {
    const params = {
      order_id: 'OD0001',
      fv_payment_transid: 'TXN001',
      status: 'success',
      ts: '1638774137697',
      Signature: 'tampered',
    };
    expect(() => webhooks.parseRedirectResult(params, SECRET_KEY)).toThrow(EcoPaySignatureError);
  });
});
