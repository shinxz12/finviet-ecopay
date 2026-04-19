import { createSignature, verifySignature } from '../signature.js';
import { EcoPaySignatureError } from '../errors.js';
import type { HttpClient } from '../http.js';
import type {
  CreateTokenizationParams,
  CreateTokenizationResponse,
  ListTokenizationsParams,
  ListTokenizationsResponse,
  RetrieveTokenizationParams,
  RetrieveTokenizationResponse,
  UpdateTokenizationParams,
  UpdateTokenizationResponse,
} from '../types.js';

export class TokenizationsResource {
  constructor(
    private readonly http: HttpClient,
    private readonly merchantCode: string,
    private readonly secretKey: string,
  ) {}

  async create(params: CreateTokenizationParams): Promise<CreateTokenizationResponse> {
    const body: Record<string, unknown> = {
      ...params,
      merchant_code: this.merchantCode,
      req_time: Date.now(),
    };
    body.signature = createSignature(body, this.secretKey);

    const response = await this.http.post<CreateTokenizationResponse>(
      '/api/v1/tokenizations',
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

  async list(params: ListTokenizationsParams): Promise<ListTokenizationsResponse> {
    const query: Record<string, unknown> = {
      ...params,
      merchant_code: this.merchantCode,
    };
    query.signature = createSignature(query, this.secretKey);

    const response = await this.http.get<ListTokenizationsResponse>(
      '/api/v1/tokenizations',
      query,
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

  async retrieve(
    merchantTokenId: string,
    params: RetrieveTokenizationParams,
  ): Promise<RetrieveTokenizationResponse> {
    const query: Record<string, unknown> = {
      ...params,
      merchant_code: this.merchantCode,
    };
    query.signature = createSignature(query, this.secretKey);

    const response = await this.http.get<RetrieveTokenizationResponse>(
      `/api/v1/tokenizations/${merchantTokenId}`,
      query,
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

  async update(
    merchantTokenId: string,
    params: UpdateTokenizationParams,
  ): Promise<UpdateTokenizationResponse> {
    const body: Record<string, unknown> = {
      ...params,
      merchant_code: this.merchantCode,
    };
    body.signature = createSignature(body, this.secretKey);

    const response = await this.http.put<UpdateTokenizationResponse>(
      `/api/v1/tokenizations/${merchantTokenId}`,
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
