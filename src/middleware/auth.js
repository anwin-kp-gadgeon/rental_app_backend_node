const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
	try {
		// Get token from header
		const authHeader = req.header('Authorization');

		if (!authHeader) {
			return res.status(401).json({
				success: false,
				message: 'No authorization header provided',
			});
		}

		// Check if it's a Bearer token
		if (!authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				success: false,
				message: 'Invalid token format. Use: Bearer <token>',
			});
		}

		const token = authHeader.replace('Bearer ', '');

		if (!token) {
			return res.status(401).json({
				success: false,
				message: 'No token provided',
			});
		}

		// Verify token
		const decoded = jwt.verify(token, config.jwt.secret);

		// Find user
		const user = await User.findById(decoded.userId).select('-password');

		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'User not found',
			});
		}

		if (!user.isActive) {
			return res.status(401).json({
				success: false,
				message: 'User account is deactivated',
			});
		}

		// Attach user and token to request
		req.user = user;
		req.token = token;

		next();
	} catch (error) {
		if (error.name === 'JsonWebTokenError') {
			return res.status(401).json({
				success: false,
				message: 'Invalid token',
			});
		}

		if (error.name === 'TokenExpiredError') {
			return res.status(401).json({
				success: false,
				message: 'Token has expired',
			});
		}

		console.error('Auth middleware error:', error);
		return res.status(500).json({
			success: false,
			message: 'Authentication error',
		});
	}
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
	try {
		const authHeader = req.header('Authorization');

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return next();
		}

		const token = authHeader.replace('Bearer ', '');

		if (!token) {
			return next();
		}

		const decoded = jwt.verify(token, config.jwt.secret);
		const user = await User.findById(decoded.userId).select('-password');

		if (user && user.isActive) {
			req.user = user;
			req.token = token;
		}

		next();
	} catch (error) {
		// Just continue without user if token is invalid
		next();
	}
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'Authentication required',
			});
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: 'Access denied. Insufficient permissions',
			});
		}

		next();
	};
};

module.exports = {
	auth,
	optionalAuth,
	authorize,
};
