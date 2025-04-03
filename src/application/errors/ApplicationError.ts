/**
 * Base class for custom application-level errors.
 * Allows distinguishing application errors from unexpected system errors.
 */
export class ApplicationError extends Error {
    /**
     * Creates an instance of ApplicationError.
     * @param message The error message.
     * @param code An optional application-specific error code (e.g., 'INVALID_INPUT', 'WAREHOUSE_NOT_FOUND').
     * @param httpStatusCode An optional HTTP status code to associate with this error (e.g., 400, 404).
     */
    constructor(message: string, public readonly code?: string, public readonly httpStatusCode?: number) {
        super(message);
        this.name = this.constructor.name; // Set the error name to the class name
    }
} 