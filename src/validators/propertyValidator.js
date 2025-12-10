const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			success: false,
			errors: errors.array().map((err) => ({
				field: err.path,
				message: err.msg,
			})),
		});
	}
	next();
};

const validateProperty = [
	body('title')
		.trim()
		.notEmpty()
		.withMessage('Title is required')
		.isLength({ max: 200 })
		.withMessage('Title cannot exceed 200 characters'),
	body('description')
		.trim()
		.notEmpty()
		.withMessage('Description is required')
		.isLength({ max: 5000 })
		.withMessage('Description cannot exceed 5000 characters'),
	body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
	body('location').trim().notEmpty().withMessage('Location is required'),
	body('propertyType')
		.isIn(['apartment', 'house', 'condo', 'townhouse', 'studio', 'room', 'other'])
		.withMessage('Invalid property type'),
	body('bedrooms')
		.optional()
		.isInt({ min: 0 })
		.withMessage('Bedrooms must be a non-negative integer'),
	body('bathrooms')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Bathrooms must be a non-negative number'),
	body('squareFeet')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Square feet must be a positive number'),
	body('amenities').optional().isArray().withMessage('Amenities must be an array'),
	body('images').optional().isArray().withMessage('Images must be an array'),
	handleValidationErrors,
];

const validatePropertyUpdate = [
	body('title')
		.optional()
		.trim()
		.isLength({ max: 200 })
		.withMessage('Title cannot exceed 200 characters'),
	body('description')
		.optional()
		.trim()
		.isLength({ max: 5000 })
		.withMessage('Description cannot exceed 5000 characters'),
	body('price')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Price must be a positive number'),
	body('propertyType')
		.optional()
		.isIn(['apartment', 'house', 'condo', 'townhouse', 'studio', 'room', 'other'])
		.withMessage('Invalid property type'),
	body('bedrooms')
		.optional()
		.isInt({ min: 0 })
		.withMessage('Bedrooms must be a non-negative integer'),
	body('bathrooms')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Bathrooms must be a non-negative number'),
	body('squareFeet')
		.optional()
		.isFloat({ min: 0 })
		.withMessage('Square feet must be a positive number'),
	body('amenities').optional().isArray().withMessage('Amenities must be an array'),
	body('images').optional().isArray().withMessage('Images must be an array'),
	handleValidationErrors,
];

module.exports = {
	validateProperty,
	validatePropertyUpdate,
};
