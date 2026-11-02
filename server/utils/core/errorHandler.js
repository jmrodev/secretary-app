const logger = require('./logger');
const { AppError } = require('./errors');

/**
 * Centralized Error Handling Middleware (Express).
 * Formats errors consistently, maps status codes, and prevents leaking stack traces in production.
 */
const errorHandler = (err, req, res, _next) => {
    let statusCode = err.statusCode || (err instanceof AppError ? err.statusCode : 500);
    let message = err.message || 'Internal Server Error';

    // Log unexpected errors (5xx)
    if (statusCode >= 500) {
        logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
    } else {
        logger.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}:`, message);
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(err.type ? { type: err.type } : {}),
        ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {})
    });
};

module.exports = errorHandler;
