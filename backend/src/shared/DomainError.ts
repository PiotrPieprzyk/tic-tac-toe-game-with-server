export abstract class DomainError extends Error {
    abstract readonly status: number;

    constructor(message: string) {
        super(message);
    }
}

export class ValidationError extends DomainError {
    readonly status = 400;
}

export class ForbiddenError extends DomainError {
    readonly status = 400;
}

export class NotFoundError extends DomainError {
    readonly status = 404;
}

export class InvalidStateError extends DomainError {
    readonly status = 500;
}
