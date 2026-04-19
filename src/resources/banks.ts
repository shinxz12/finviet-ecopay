import type { HttpClient } from '../http.js';
import type { ListBanksParams, ListBanksResponse } from '../types.js';

export class BanksResource {
  constructor(private readonly http: HttpClient) {}

  async list(params?: ListBanksParams): Promise<ListBanksResponse> {
    return this.http.get<ListBanksResponse>(
      '/api/v1/bank/get-list',
      (params ?? {}) as Record<string, unknown>,
    );
  }
}
