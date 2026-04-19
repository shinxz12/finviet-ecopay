export class EcoPayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EcoPayError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EcoPayAPIError extends EcoPayError {
  constructor(
    message: string,
    public readonly result_code: string,
    public readonly message_key: string,
  ) {
    super(message);
    this.name = 'EcoPayAPIError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EcoPaySignatureError extends EcoPayError {
  constructor() {
    super('Signature verification failed');
    this.name = 'EcoPaySignatureError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
