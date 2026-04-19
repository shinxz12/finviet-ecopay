import { EcoPayAPIError, EcoPayError } from './errors.js';
import type { EcoPayBaseResponse } from './types.js';

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeout: number,
  ) {}

  async post<T extends EcoPayBaseResponse>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const res = await this.request('POST', path, {
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(res);
  }

  async get<T extends EcoPayBaseResponse>(
    path: string,
    params: Record<string, unknown>,
  ): Promise<T> {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    const res = await this.request('GET', qs ? `${path}?${qs}` : path, {});
    return this.parseResponse<T>(res);
  }

  async put<T extends EcoPayBaseResponse>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const res = await this.request('PUT', path, {
      body: JSON.stringify(body),
    });
    return this.parseResponse<T>(res);
  }

  private async request(
    method: string,
    path: string,
    init: RequestInit,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
        ...init,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private async parseResponse<T extends EcoPayBaseResponse>(res: Response): Promise<T> {
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      throw new EcoPayError(`HTTP ${res.status}: failed to parse JSON response`);
    }

    if (!res.ok) {
      const body = json as Record<string, unknown>;
      const msg = Array.isArray(body.message)
        ? (body.message as string[]).join(', ')
        : String(body.message ?? res.statusText);
      throw new EcoPayError(`HTTP ${res.status}: ${msg}`);
    }

    const typed = json as T;
    if (typed.message_key && typed.message_key !== 'SUCCESS') {
      throw new EcoPayAPIError(typed.message, typed.result_code, typed.message_key);
    }
    return typed;
  }
}
