import { describe, it, expect } from 'vitest';
import { createSignature, verifySignature } from '../src/signature.js';

describe('createSignature', () => {
  it('matches the official EcoPay docs example', () => {
    const params = {
      order_id: 'OD0001',
      req_time: 1638774137697,
      merchant_code: 'MERCHANTA',
    };
    expect(createSignature(params, 'MERCHANTA_SECRET_KEY')).toBe(
      'a4df3cd1665493777bc2c53eaccaeb9477e1574f1114a599d89d8317e047fea5',
    );
  });

  it('excludes the signature key itself from input', () => {
    const withSig = {
      order_id: 'OD0001',
      req_time: 1638774137697,
      merchant_code: 'MERCHANTA',
      signature: 'ignored',
    };
    expect(createSignature(withSig, 'MERCHANTA_SECRET_KEY')).toBe(
      'a4df3cd1665493777bc2c53eaccaeb9477e1574f1114a599d89d8317e047fea5',
    );
  });

  it('excludes null and undefined values', () => {
    const base = { merchant_code: 'MC', amount: 1000 };
    const withNull = { merchant_code: 'MC', amount: 1000, bank_code: null as unknown as string };
    const withUndef = { merchant_code: 'MC', amount: 1000, bank_code: undefined };
    expect(createSignature(base, 'KEY')).toBe(createSignature(withNull, 'KEY'));
    expect(createSignature(base, 'KEY')).toBe(createSignature(withUndef, 'KEY'));
  });

  it('sorts keys alphabetically before concatenating', () => {
    const params = { z_key: 'Z', a_key: 'A', m_key: 'M' };
    // Sorted: a_key, m_key, z_key → "AMZ"
    const sig1 = createSignature(params, 'SECRET');
    const params2 = { a_key: 'A', m_key: 'M', z_key: 'Z' };
    expect(sig1).toBe(createSignature(params2, 'SECRET'));
  });
});

describe('verifySignature', () => {
  it('returns true for a valid signature', () => {
    const params = { order_id: 'OD0001', req_time: 1638774137697, merchant_code: 'MERCHANTA' };
    const sig = createSignature(params, 'MERCHANTA_SECRET_KEY');
    expect(verifySignature(params, sig, 'MERCHANTA_SECRET_KEY')).toBe(true);
  });

  it('returns false for a tampered signature', () => {
    const params = { order_id: 'OD0001', req_time: 1638774137697, merchant_code: 'MERCHANTA' };
    expect(verifySignature(params, 'tampered', 'MERCHANTA_SECRET_KEY')).toBe(false);
  });

  it('returns false for a wrong secret key', () => {
    const params = { order_id: 'OD0001', req_time: 1638774137697, merchant_code: 'MERCHANTA' };
    const sig = createSignature(params, 'CORRECT_KEY');
    expect(verifySignature(params, sig, 'WRONG_KEY')).toBe(false);
  });
});
