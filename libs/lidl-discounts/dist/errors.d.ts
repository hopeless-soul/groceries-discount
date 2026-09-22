export declare class LidlAPIError extends Error {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
export declare class LidlStoreNotFoundError extends LidlAPIError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map