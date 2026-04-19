# finviet-ecopay

TypeScript SDK for the [Finviet EcoPay](https://finviet.com.vn) payment gateway.

[![CI](https://github.com/shinxz12/finviet-ecopay/actions/workflows/ci.yml/badge.svg)](https://github.com/shinxz12/finviet-ecopay/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/finviet-ecopay)](https://www.npmjs.com/package/finviet-ecopay)

## Features

- Full TypeScript support with strict types
- Auto-signs every request with HMAC-SHA256
- Sandbox and production environments
- IPN / redirect signature verification
- ESM + CJS dual build (Node ≥ 18)

## Installation

```bash
npm install finviet-ecopay
# or
pnpm add finviet-ecopay
# or
yarn add finviet-ecopay
```

## Quick Start

```typescript
import { EcoPayClient } from 'finviet-ecopay';

const client = new EcoPayClient({
  merchantCode: 'YOUR_MERCHANT_CODE',
  secretKey: 'YOUR_SECRET_KEY',
  environment: 'sandbox', // 'sandbox' | 'production' — defaults to 'sandbox'
});

// Create a payment
const payment = await client.payments.create({
  platform: 'web',
  payment_channel: 'atm',
  store_code: 'STORE_01',
  terminal_code: 'TERMINAL_01',
  merchant_order_id: 'ORDER-001',
  amount: 100000,
  description: 'Order #001',
  redirect_url: 'https://your-site.com/payment/callback',
});

console.log(payment.data?.payment_url); // redirect user here
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `merchantCode` | `string` | required | Your EcoPay merchant code |
| `secretKey` | `string` | required | Your HMAC secret key |
| `environment` | `'sandbox' \| 'production'` | `'sandbox'` | API environment |
| `timeout` | `number` | `30000` | HTTP timeout in milliseconds |

## API Reference

### Payments

#### `client.payments.create(params)`

Creates a new payment session and returns a `payment_url` to redirect the customer to.

```typescript
const payment = await client.payments.create({
  platform: 'web',           // 'app' | 'web' | 'desktop'
  payment_channel: 'atm',    // 'atm' | 'qrcode' | 'eco'
  store_code: 'STORE_01',
  terminal_code: 'TERM_01',
  merchant_order_id: 'ORDER-001',
  amount: 100000,            // in VND
  description: 'Order description',
  redirect_url: 'https://your-site.com/callback',

  // Optional
  currency: 'VND',           // defaults to 'VND'
  bank_code: 'VCB',
  payment_type: '01',        // required for qrcode channel
  create_payment_token: true, // save card for future payments
});

console.log(payment.data?.payment_url);
console.log(payment.data?.transid);
console.log(payment.data?.qrcode); // present when payment_channel is 'qrcode'
```

#### `client.payments.check(params)`

Checks the status of an existing payment.

```typescript
const result = await client.payments.check({
  merchant_order_id: 'ORDER-001',
});

console.log(result.data?.status); // 'initial' | 'success' | 'failed' | ...
console.log(result.data?.amount);
```

---

### Tokenizations

Tokenize a customer's card for future one-click payments.

#### `client.tokenizations.create(params)`

Starts a card registration flow and returns a `payment_url` to redirect the customer to.

```typescript
const tok = await client.tokenizations.create({
  platform: 'web',
  merchant_transid: 'TOK-001',
  store_code: 'STORE_01',
  description: 'Card registration',
  redirect_url: 'https://your-site.com/tokenization/callback',
  merchant_user_id: 'USER-123',
  bank_type: 'international', // 'domestic' | 'international'
});

console.log(tok.data?.payment_url);
```

#### `client.tokenizations.list(params)`

Lists all saved tokens for a user.

```typescript
const list = await client.tokenizations.list({
  bank_type: 'international',
  merchant_user_id: 'USER-123',
  status: 'active', // optional filter
});
```

#### `client.tokenizations.retrieve(merchantTokenId, params)`

Retrieves a single token by its ID.

```typescript
const token = await client.tokenizations.retrieve('MERCHANT_TOKEN_ID', {
  bank_type: 'international',
  merchant_user_id: 'USER-123',
});
```

#### `client.tokenizations.update(merchantTokenId, params)`

Activates or deactivates a token.

```typescript
await client.tokenizations.update('MERCHANT_TOKEN_ID', {
  bank_type: 'international',
  merchant_user_id: 'USER-123',
  status: 'inactive',
});
```

---

### Banks

#### `client.banks.list(params?)`

Returns the list of supported banks.

```typescript
const banks = await client.banks.list();
console.log(banks.data); // BankRecord[]

// With filters
const domestic = await client.banks.list({
  status: 'active',
  disabled_paging: true, // return all results without pagination
});
```

---

### Webhooks (IPN)

EcoPay sends an HTTP POST to your server when a payment or tokenization completes. Use `EcoPayClient.webhooks` (static) to verify the signature and parse the payload.

#### Payment IPN

```typescript
import { EcoPayClient } from 'finviet-ecopay';

// Express example
app.post('/webhooks/payment', (req, res) => {
  try {
    const event = EcoPayClient.webhooks.verifyPaymentIPN(
      req.body,
      process.env.ECOPAY_SECRET_KEY,
    );

    if (event.status === 'success') {
      // fulfil the order
      await fulfillOrder(event.merchant_order_id, event.amount);
    }

    res.json({ result_code: '00' });
  } catch (err) {
    // EcoPaySignatureError — reject tampered payloads
    res.status(400).json({ error: 'invalid signature' });
  }
});
```

#### Tokenization IPN

```typescript
app.post('/webhooks/tokenization', (req, res) => {
  try {
    const event = EcoPayClient.webhooks.verifyTokenizationIPN(
      req.body,
      process.env.ECOPAY_SECRET_KEY,
    );

    // Save event.payment_token for future payments
    await saveToken(event.merchant_user_id, event.payment_token);

    res.json({ result_code: '00' });
  } catch {
    res.status(400).json({ error: 'invalid signature' });
  }
});
```

#### Redirect URL verification

After payment, EcoPay redirects the customer to your `redirect_url` with query params. Verify them before trusting the result:

```typescript
// Express example
app.get('/payment/callback', (req, res) => {
  try {
    const result = EcoPayClient.webhooks.parseRedirectResult(
      req.query as Record<string, string>,
      process.env.ECOPAY_SECRET_KEY,
    );

    // result.status is verified — safe to use
    if (result.status === 'success') {
      res.redirect('/orders/success');
    } else {
      res.redirect('/orders/failed');
    }
  } catch {
    res.status(400).send('Invalid signature');
  }
});
```

---

## Error Handling

All errors extend `EcoPayError`.

| Class | When thrown |
|---|---|
| `EcoPayError` | Base class for all SDK errors |
| `EcoPayAPIError` | API returned a non-`SUCCESS` `message_key` |
| `EcoPaySignatureError` | Response or IPN signature verification failed |

```typescript
import { EcoPayAPIError, EcoPaySignatureError } from 'finviet-ecopay';

try {
  await client.payments.create({ ... });
} catch (err) {
  if (err instanceof EcoPayAPIError) {
    console.log(err.message_key); // e.g. 'ORDER_EXISTED'
    console.log(err.result_code); // e.g. '01'
  } else if (err instanceof EcoPaySignatureError) {
    // Response was tampered
  }
}
```

## License

MIT
