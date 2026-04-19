// ─── Primitives ──────────────────────────────────────────────────────────────

export type Platform = 'app' | 'web' | 'desktop';
export type PaymentChannel = 'atm' | 'qrcode' | 'eco';
export type BankType = 'domestic' | 'international';
export type TransactionStatus =
  | 'initial'
  | 'success'
  | 'failed'
  | 'processing'
  | 'cancelled'
  | 'timeout'
  | 'paid_processing'
  | 'paid';
export type TokenizationStatus = 'active' | 'inactive';
export type CardType = '001' | '002' | '003'; // VISA | MasterCard | JCB

export type MessageKey =
  | 'SUCCESS'
  | 'FAILED'
  | 'INVALID_SIGNATURE'
  | 'INVALID_MERCHANT'
  | 'TRANSACTION_NOTFOUND'
  | 'ORDER_EXISTED'
  | 'INVALID_BANK_CODE'
  | 'INVALID_REQ_TIME'
  | 'INVALID_STORE'
  | 'INVALID_TERMINAL'
  | 'ACCOUNT_NOT_FOUND'
  | 'ORDER_EXPIRED'
  | 'ORDER_SUCCESS'
  | 'ORDER_FAILED'
  | 'ORDER_CANCELLED'
  | 'INVALID_INPUT'
  | 'INACTIVE_MERCHANT'
  | 'INACTIVE_STORE'
  | 'DEFAULT_PAYMENT_METHOD_NOT_FOUND'
  | 'MERCHANT_PAYMENT_METHOD_NOT_FOUND'
  | 'MERCHANT_QRCODE_PAYMENT_METHOD_NOT_FOUND'
  | 'MERCHANT_ATM_PAYMENT_METHOD_NOT_FOUND'
  | 'PAYMENT_METHOD_NOT_FOUND'
  | 'UNKNOWN';

// ─── Config ───────────────────────────────────────────────────────────────────

export interface EcoPayClientConfig {
  merchantCode: string;
  secretKey: string;
  environment?: 'sandbox' | 'production';
  /** HTTP timeout in milliseconds. Default: 30 000 */
  timeout?: number;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface EcoPayBaseResponse {
  result_code: string;
  message_key: MessageKey;
  message: string;
  signature?: string;
}

export interface DisplayDataItem {
  key: string;
  display_name: string;
  value: string;
}

export interface ExtraData {
  display_data?: DisplayDataItem[];
  promotion_data?: DisplayDataItem[];
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface CreatePaymentParams {
  platform: Platform;
  payment_channel: PaymentChannel;
  store_code: string;
  terminal_code: string;
  merchant_order_id: string;
  amount: number;
  description: string;
  redirect_url: string;
  /** Defaults to "VND" */
  currency?: string;
  bank_code?: string;
  bank_type?: BankType;
  extra_data?: ExtraData;
  /** Required when payment_channel is "qrcode". "01" = dynamic QR */
  payment_type?: '01';
  store_label?: string;
  terminal_label?: string;
  expires_date?: string;
  purpose_of_transaction?: string;
  customer_mobile_number?: string;
  customer_account?: string;
  customer_name?: string;
  customer_address?: string;
  payment_link_transid?: string;
  merchant_user_id?: string;
  create_payment_token?: boolean;
  payment_token?: string;
}

export interface PaymentData {
  payment_url: string;
  transid: string;
  status: TransactionStatus;
  expired_time: number;
  expired_at: number;
  qrcode?: string;
}

export interface CreatePaymentResponse extends EcoPayBaseResponse {
  data?: PaymentData;
}

export interface CheckTransParams {
  merchant_order_id: string;
}

export interface TransactionData {
  fv_transid: string;
  merchant_order_id: string;
  platform: Platform;
  merchant_code: string;
  payment_channel: PaymentChannel;
  bank_code?: string;
  status: TransactionStatus;
  amount: number;
  description: string;
  created_at: number;
  refunded_amt?: number;
  total_fee?: number;
  total_refund_fee?: number;
  transaction_fee_snapshot?: unknown;
  refunded_request_amt?: number;
  extra_data?: unknown;
}

export interface CheckTransResponse extends EcoPayBaseResponse {
  data?: TransactionData;
}

// ─── Tokenizations ────────────────────────────────────────────────────────────

export interface CreateTokenizationParams {
  platform: Platform;
  merchant_transid: string;
  store_code: string;
  description: string;
  redirect_url: string;
  merchant_user_id: string;
  bank_type?: BankType;
}

export interface TokenizationTransactionData {
  payment_url: string;
  transid: string;
  status: TransactionStatus;
  expired_time: number;
  expired_at: number;
}

export interface CreateTokenizationResponse extends EcoPayBaseResponse {
  data?: TokenizationTransactionData;
}

export interface ListTokenizationsParams {
  bank_type: BankType;
  merchant_user_id: string;
  status?: TokenizationStatus;
}

export interface TokenizationRecord {
  merchant_token_id: string;
  merchant_code: string;
  merchant_user_id: string;
  payment_token: string;
  card_number?: string;
  card_type?: CardType;
  customer_account?: string;
  customer_name?: string;
  card_type_name?: string;
  store_code?: string;
  status: TokenizationStatus;
  created_at: string;
  updated_at: string;
}

export interface ListTokenizationsResponse extends EcoPayBaseResponse {
  data?: TokenizationRecord;
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface RetrieveTokenizationParams {
  bank_type: BankType;
  merchant_user_id: string;
}

export interface RetrieveTokenizationResponse extends EcoPayBaseResponse {
  data?: TokenizationRecord;
  currentPage: number;
}

export interface UpdateTokenizationParams {
  bank_type: BankType;
  merchant_user_id: string;
  status: TokenizationStatus;
}

export interface UpdateTokenizationResponse extends EcoPayBaseResponse {
  data?: TokenizationRecord;
  currentPage: number;
}

// ─── Banks ────────────────────────────────────────────────────────────────────

export interface ListBanksParams {
  disabled_paging?: boolean;
  page_size?: number;
  page?: number;
  code?: string;
  status?: 'active' | 'inactive';
}

export interface BankRecord {
  name: string;
  code: string;
  type: BankType;
  partner_code: string;
  status: 'active' | 'inactive';
}

export interface ListBanksResponse extends EcoPayBaseResponse {
  count?: number;
  data?: BankRecord[];
}

// ─── Webhooks / IPN ───────────────────────────────────────────────────────────

export interface IPNPaymentEvent {
  fv_transid: string;
  merchant_order_id: string;
  platform: Platform;
  merchant_code: string;
  payment_channel: PaymentChannel;
  bank_code?: string;
  status: TransactionStatus;
  amount: number;
  description: string;
  created_at: number;
  store_code: string;
  payment_type?: string;
  partner_payment_at?: number;
  total_fee?: number;
  transaction_fee_snapshot?: unknown;
  extra_data?: unknown;
  bill_info?: unknown;
  merchant_user_id?: string;
  payment_token?: string;
  message?: string;
  signature: string;
}

export interface IPNTokenizationEvent {
  fv_transid: string;
  created_at: number;
  status: TransactionStatus;
  platform: Platform;
  payment_channel: PaymentChannel;
  bank_code?: string;
  merchant_code: string;
  store_code: string;
  description: string;
  extra_data?: unknown;
  merchant_user_id: string;
  payment_token: string;
  message?: string;
  signature: string;
}

export interface RedirectResult {
  order_id: string;
  fv_payment_transid: string;
  status: TransactionStatus | 'cancelled';
  ts: string;
  signature: string;
}
