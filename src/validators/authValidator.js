const { body } = require('express-validator');

const registerValidator = [
	body('name')
		.trim()
		.notEmpty()
		.withMessage('Name is required')
		.isLength({ min: 2, max: 100 })
		.withMessage('Name must be between 2 and 100 characters'),

	body('email')
		.trim()
		.notEmpty()
		.withMessage('Email is required')
		.isEmail()
		.withMessage('Please enter a valid email')
		.normalizeEmail(),

	body('password')
		.notEmpty()
		.withMessage('Password is required')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters')
		.matches(/\d/)
		.withMessage('Password must contain at least one number'),

	body('phone')
		.optional()
		.trim()
		.matches(/^[\d\s\-+()]+$/)
		.withMessage('Please enter a valid phone number'),

	body('role')
		.optional()
		.isIn(['user', 'landlord'])
		.withMessage('Role must be either user or landlord'),
];

const loginValidator = [
	body('email')
		.trim()
		.notEmpty()
		.withMessage('Email is required')
		.isEmail()
		.withMessage('Please enter a valid email')
		.normalizeEmail(),

	body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileValidator = [
	body('name')
		.optional()
		.trim()
		.isLength({ min: 2, max: 100 })
		.withMessage('Name must be between 2 and 100 characters'),

	body('phone')
		.optional()
		.trim()
		.matches(/^[\d\s\-+()]+$/)
		.withMessage('Please enter a valid phone number'),

	body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
];

const changePasswordValidator = [
	body('currentPassword').notEmpty().withMessage('Current password is required'),

	body('newPassword')
		.notEmpty()
		.withMessage('New password is required')
		.isLength({ min: 6 })
		.withMessage('New password must be at least 6 characters')
		.matches(/\d/)
		.withMessage('New password must contain at least one number'),
];

module.exports = {
	registerValidator,
	loginValidator,
	updateProfileValidator,
	changePasswordValidator,
};
