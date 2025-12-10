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

const validateReview = [
	body('propertyId')
		.notEmpty()
		.withMessage('Property ID is required')
		.isMongoId()
		.withMessage('Invalid property ID'),
	body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
	body('reviewText')
		.trim()
		.notEmpty()
		.withMessage('Review text is required')
		.isLength({ max: 2000 })
		.withMessage('Review cannot exceed 2000 characters'),
	handleValidationErrors,
];

const validateReviewUpdate = [
	body('rating')
		.optional()
		.isInt({ min: 1, max: 5 })
		.withMessage('Rating must be between 1 and 5'),
	body('reviewText')
		.optional()
		.trim()
		.isLength({ max: 2000 })
		.withMessage('Review cannot exceed 2000 characters'),
	handleValidationErrors,
];

module.exports = {
	validateReview,
	validateReviewUpdate,
};
