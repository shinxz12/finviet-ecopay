import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenizationsResource } from '../src/resources/tokenizations.js';
import type { HttpClient } from '../src/http.js';

const MERCHANT_CODE = 'MERCHANTA';
const SECRET_KEY = 'MERCHANTA_SECRET_KEY';

const mockHttp = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
} as unknown as HttpClient;

const SUCCESS_BASE = { result_code: '00', message_key: 'SUCCESS' as const, message: 'OK' };

describe('TokenizationsResource.create', () => {
  let tokenizations: TokenizationsResource;

  beforeEach(() => {
    tokenizations = new TokenizationsResource(mockHttp, MERCHANT_CODE, SECRET_KEY);
    vi.clearAllMocks();
  });

  it('POSTs to /api/v1/tokenizations with merchant_code, req_time, signature', async () => {
    vi.mocked(mockHttp.post).mockResolvedValueOnce({
      ...SUCCESS_BASE,
      data: { payment_url: 'https://pay.ecopay.vn/tok/1', transid: 'TOK001', status: 'initial', expired_time: 900, expired_at: 9999 },
    });

    await tokenizations.create({
      platform: 'web',
      merchant_transid: 'MT001',
      store_code: 'MERCHANTA_1',
      description: 'Card registration',
      redirect_url: 'https://example.com/tok-callback',
      merchant_user_id: 'USER001',
    });

    const [path, body] = vi.mocked(mockHttp.post).mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/v1/tokenizations');
    expect(body.merchant_code).toBe('MERCHANTA');
    expect(typeof body.req_time).toBe('number');
    expect(typeof body.signature).toBe('string');
  });
});

describe('TokenizationsResource.list', () => {
  let tokenizations: TokenizationsResource;

  beforeEach(() => {
    tokenizations = new TokenizationsResource(mockHttp, MERCHANT_CODE, SECRET_KEY);
    vi.clearAllMocks();
  });

  it('GETs /api/v1/tokenizations with merchant_code and signature as query params', async () => {
    vi.mocked(mockHttp.get).mockResolvedValueOnce({
      ...SUCCESS_BASE,
      currentPage: 1,
      perPage: 10,
      totalItems: 1,
      totalPages: 1,
    });

    await tokenizations.list({ bank_type: 'international', merchant_user_id: 'USER001' });

    const [path, query] = vi.mocked(mockHttp.get).mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/v1/tokenizations');
    expect(query.merchant_code).toBe('MERCHANTA');
    expect(query.bank_type).toBe('international');
    expect(query.merchant_user_id).toBe('USER001');
    expect(typeof query.signature).toBe('string');
  });
});

describe('TokenizationsResource.retrieve', () => {
  let tokenizations: TokenizationsResource;

  beforeEach(() => {
    tokenizations = new TokenizationsResource(mockHttp, MERCHANT_CODE, SECRET_KEY);
    vi.clearAllMocks();
  });

  it('GETs /api/v1/tokenizations/:id with correct path and query', async () => {
    vi.mocked(mockHttp.get).mockResolvedValueOnce({ ...SUCCESS_BASE, currentPage: 1 });

    await tokenizations.retrieve('TOKEN_ID_1', {
      bank_type: 'international',
      merchant_user_id: 'USER001',
    });

    const [path] = vi.mocked(mockHttp.get).mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/v1/tokenizations/TOKEN_ID_1');
  });
});

describe('TokenizationsResource.update', () => {
  let tokenizations: TokenizationsResource;

  beforeEach(() => {
    tokenizations = new TokenizationsResource(mockHttp, MERCHANT_CODE, SECRET_KEY);
    vi.clearAllMocks();
  });

  it('PUTs /api/v1/tokenizations/:id with merchant_code and signature', async () => {
    vi.mocked(mockHttp.put).mockResolvedValueOnce({ ...SUCCESS_BASE, currentPage: 1 });

    await tokenizations.update('TOKEN_ID_1', {
      bank_type: 'international',
      merchant_user_id: 'USER001',
      status: 'inactive',
    });

    const [path, body] = vi.mocked(mockHttp.put).mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/v1/tokenizations/TOKEN_ID_1');
    expect(body.merchant_code).toBe('MERCHANTA');
    expect(body.status).toBe('inactive');
    expect(typeof body.signature).toBe('string');
  });
});
