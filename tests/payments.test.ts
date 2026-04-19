import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsResource } from '../src/resources/payments.js';
import { EcoPaySignatureError } from '../src/errors.js';
import type { HttpClient } from '../src/http.js';

const MERCHANT_CODE = 'MERCHANTA';
const SECRET_KEY = 'MERCHANTA_SECRET_KEY';

const mockHttp = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
} as unknown as HttpClient;

describe('PaymentsResource.create', () => {
  let payments: PaymentsResource;

  beforeEach(() => {
    payments = new PaymentsResource(mockHttp, MERCHANT_CODE, SECRET_KEY);
    vi.clearAllMocks();
  });

  it('POSTs to /api/v1/payment/init and auto-injects merchant_code, req_time, currency, signature', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      result_code: '00',
      message_key: 'SUCCESS',
      message: 'OK',
      data: {
        payment_url: 'https://pay.ecopay.vn/123',
        transid: 'TXN001',
        status: 'initial',
        expired_time: 900,
        expired_at: 9999999999,
      },
    });

    const result = await payments.create({
      platform: 'web',
      payment_channel: 'atm',
      store_code: 'MERCHANTA_1',
      terminal_code: 'MERCHANTA_1',
      merchant_order_id: 'OD0001',
      amount: 100000,
      description: 'Test order',
      redirect_url: 'https://example.com/callback',
    });

    expect(mockHttp.post).toHaveBeenCalledOnce();
    const [path, body] = vi.mocked(mockHttp.post).mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/v1/payment/init');
    expect(body.merchant_code).toBe('MERCHANTA');
    expect(typeof body.req_time).toBe('number');
    expect(body.currency).toBe('VND');
    expect(typeof body.signature).toBe('string');
    expect(body.signature).toHaveLength(64); // sha256 hex
    expect(result.data?.payment_url).toBe('https://pay.ecopay.vn/123');
  });

  it('respects a custom currency when provided', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      result_code: '00',
      message_key: 'SUCCESS',
      message: 'OK',
    });

    await payments.create({
      platform: 'web',
      payment_channel: 'atm',
      store_code: 'S1',
      terminal_code: 'T1',
      merchant_order_id: 'OD0002',
      amount: 50000,
      description: 'Test',
      redirect_url: 'https://example.com/cb',
      currency: 'USD',
    });

    const [, body] = vi.mocked(mockHttp.post).mock.calls[0] as [string, Record<string, unknown>];
    expect(body.currency).toBe('USD');
  });

  it('throws EcoPaySignatureError when response signature is invalid', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      result_code: '00',
      message_key: 'SUCCESS',
      message: 'OK',
      data: { payment_url: 'https://pay.ecopay.vn/456', transid: 'TXN002', status: 'initial', expired_time: 900, expired_at: 1 },
      signature: 'bad-signature',
    });

    await expect(
      payments.create({
        platform: 'web',
        payment_channel: 'atm',
        store_code: 'S1',
        terminal_code: 'T1',
        merchant_order_id: 'OD0003',
        amount: 10000,
        description: 'Bad sig',
        redirect_url: 'https://example.com/cb',
      }),
    ).rejects.toThrow(EcoPaySignatureError);
  });
});

describe('PaymentsResource.check', () => {
  let payments: PaymentsResource;

  beforeEach(() => {
    payments = new PaymentsResource(mockHttp, MERCHANT_CODE, SECRET_KEY);
    vi.clearAllMocks();
  });

  it('POSTs to /api/v1/payment/checktrans with merchant_code, req_time, signature', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      result_code: '00',
      message_key: 'SUCCESS',
      message: 'OK',
      data: {
        fv_transid: 'TXN001',
        merchant_order_id: 'OD0001',
        platform: 'web',
        merchant_code: 'MERCHANTA',
        payment_channel: 'atm',
        status: 'success',
        amount: 100000,
        description: 'Test',
        created_at: 1234567890,
      },
    });

    await payments.check({ merchant_order_id: 'OD0001' });

    const [path, body] = vi.mocked(mockHttp.post).mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/v1/payment/checktrans');
    expect(body.merchant_order_id).toBe('OD0001');
    expect(body.merchant_code).toBe('MERCHANTA');
    expect(typeof body.req_time).toBe('number');
    expect(typeof body.signature).toBe('string');
  });
});
