import { HttpClient } from './http.js';
import { PaymentsResource } from './resources/payments.js';
import { TokenizationsResource } from './resources/tokenizations.js';
import { BanksResource } from './resources/banks.js';
import { Webhooks } from './webhooks.js';
import type { EcoPayClientConfig } from './types.js';

const BASE_URLS: Record<'sandbox' | 'production', string> = {
  sandbox: 'https://mgw-test.finviet.com.vn:6868',
  production: 'https://mgw.finviet.com.vn:6868',
};

export class EcoPayClient {
  readonly payments: PaymentsResource;
  readonly tokenizations: TokenizationsResource;
  readonly banks: BanksResource;

  /** Static webhooks helper — does not need an instance */
  static readonly webhooks = new Webhooks();

  constructor(config: EcoPayClientConfig) {
    const baseUrl = BASE_URLS[config.environment ?? 'sandbox'];
    const http = new HttpClient(baseUrl, config.timeout ?? 30_000);

    this.payments = new PaymentsResource(http, config.merchantCode, config.secretKey);
    this.tokenizations = new TokenizationsResource(
      http,
      config.merchantCode,
      config.secretKey,
    );
    this.banks = new BanksResource(http);
  }
}
