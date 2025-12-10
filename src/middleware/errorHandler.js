/**
 * Custom API Error class
 */
class ApiError extends Error {
	constructor(statusCode, message, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Not Found Error Handler
 */
const notFound = (req, res, next) => {
	const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
	next(error);
};

/**
 * Global Error Handler
 */
const errorHandler = (err, req, res, next) => {
	let statusCode = err.statusCode || 500;
	let message = err.message || 'Internal Server Error';

	// Log error in development
	if (process.env.NODE_ENV === 'development') {
		console.error('Error:', err);
	}

	// Mongoose bad ObjectId
	if (err.name === 'CastError' && err.kind === 'ObjectId') {
		statusCode = 400;
		message = 'Invalid ID format';
	}

	// Mongoose duplicate key error
	if (err.code === 11000) {
		statusCode = 400;
		const field = Object.keys(err.keyValue)[0];
		message = `${field} already exists`;
	}

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		statusCode = 400;
		const errors = Object.values(err.errors).map((val) => val.message);
		message = errors.join(', ');
	}

	// JWT errors
	if (err.name === 'JsonWebTokenError') {
		statusCode = 401;
		message = 'Invalid token';
	}

	if (err.name === 'TokenExpiredError') {
		statusCode = 401;
		message = 'Token has expired';
	}

	// Express-validator errors
	if (Array.isArray(err) && err[0]?.msg) {
		statusCode = 400;
		message = err.map((e) => e.msg).join(', ');
	}

	res.status(statusCode).json({
		success: false,
		message,
		...(process.env.NODE_ENV === 'development' && {
			stack: err.stack,
			error: err,
		}),
	});
};

/**
 * Async handler wrapper to catch errors in async routes
 */
const asyncHandler = (fn) => (req, res, next) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
	ApiError,
	notFound,
	errorHandler,
	asyncHandler,
};
