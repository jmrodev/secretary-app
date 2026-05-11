class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}

class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
    }
}

class AuthRequiredError extends AppError {
    constructor(message) {
        super(message, 403);
        this.type = 'AUTH_REQUIRED';
    }
}

module.exports = {
    AppError,
    ValidationError,
    ConflictError,
    NotFoundError,
    AuthRequiredError
};
