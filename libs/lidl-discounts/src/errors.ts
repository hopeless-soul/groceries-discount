export class LidlAPIError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "LidlAPIError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export class LidlStoreNotFoundError extends LidlAPIError {
  constructor(message: string) {
    super(message);
    this.name = "LidlStoreNotFoundError";
  }
}
