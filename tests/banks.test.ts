import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BanksResource } from '../src/resources/banks.js';
import type { HttpClient } from '../src/http.js';

const mockHttp = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
} as unknown as HttpClient;

describe('BanksResource.list', () => {
  let banks: BanksResource;

  beforeEach(() => {
    banks = new BanksResource(mockHttp);
    vi.clearAllMocks();
  });

  it('GETs /api/v1/bank/get-list with no required params', async () => {
    vi.mocked(mockHttp.get).mockResolvedValueOnce({
      result_code: '00',
      message_key: 'SUCCESS' as const,
      message: 'OK',
      count: 2,
      data: [
        { name: 'Vietcombank', code: 'VCB', type: 'domestic', partner_code: 'VCB_P', status: 'active' },
        { name: 'BIDV', code: 'BIDV', type: 'domestic', partner_code: 'BIDV_P', status: 'active' },
      ],
    });

    const result = await banks.list();

    const [path] = vi.mocked(mockHttp.get).mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/v1/bank/get-list');
    expect(result.count).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('passes optional query params when provided', async () => {
    vi.mocked(mockHttp.get).mockResolvedValueOnce({
      result_code: '00',
      message_key: 'SUCCESS' as const,
      message: 'OK',
      count: 40,
    });

    await banks.list({ disabled_paging: true, status: 'active' });

    const [, params] = vi.mocked(mockHttp.get).mock.calls[0] as [string, Record<string, unknown>];
    expect(params.disabled_paging).toBe(true);
    expect(params.status).toBe('active');
  });
});
