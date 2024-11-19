export class GLSPServerError extends Error {
    constructor(
        message: string,
        readonly cause?: unknown
    ) {
        super(message);
    }
}

export function getOrThrow<T>(optional: undefined | T, errorMsg: string): T {
    if (optional !== undefined) {
        return optional;
    }
    throw new GLSPServerError(errorMsg);
}
