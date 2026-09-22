export class LidlAPIError extends Error {
    constructor(message, options) {
        super(message);
        this.name = "LidlAPIError";
        if (options?.cause !== undefined) {
            this.cause = options.cause;
        }
    }
}
export class LidlStoreNotFoundError extends LidlAPIError {
    constructor(message) {
        super(message);
        this.name = "LidlStoreNotFoundError";
    }
}
//# sourceMappingURL=errors.js.map