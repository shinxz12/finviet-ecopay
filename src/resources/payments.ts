import { createSignature, verifySignature } from '../signature.js';
import { EcoPaySignatureError } from '../errors.js';
import type { HttpClient } from '../http.js';
import type {
  CreatePaymentParams,
  CreatePaymentResponse,
  CheckTransParams,
  CheckTransResponse,
} from '../types.js';

export class PaymentsResource {
  constructor(
    private readonly http: HttpClient,
    private readonly merchantCode: string,
    private readonly secretKey: string,
  ) {}

  async create(params: CreatePaymentParams): Promise<CreatePaymentResponse> {
    const body: Record<string, unknown> = {
      ...params,
      merchant_code: this.merchantCode,
      currency: params.currency ?? 'VND',
      req_time: Date.now(),
    };
    body.signature = createSignature(body, this.secretKey);

    const response = await this.http.post<CreatePaymentResponse>(
      '/api/v1/payment/init',
      body,
    );

    if (response.signature && response.data) {
      if (
        !verifySignature(
          response.data as unknown as Record<string, unknown>,
          response.signature,
          this.secretKey,
        )
      ) {
        throw new EcoPaySignatureError();
      }
    }

    return response;
  }

  async check(params: CheckTransParams): Promise<CheckTransResponse> {
    const body: Record<string, unknown> = {
      ...params,
      merchant_code: this.merchantCode,
      req_time: Date.now(),
    };
    body.signature = createSignature(body, this.secretKey);

    const response = await this.http.post<CheckTransResponse>(
      '/api/v1/payment/checktrans',
      body,
    );

    if (response.signature && response.data) {
      if (
        !verifySignature(
          response.data as unknown as Record<string, unknown>,
          response.signature,
          this.secretKey,
        )
      ) {
        throw new EcoPaySignatureError();
      }
    }

    return response;
  }
}
