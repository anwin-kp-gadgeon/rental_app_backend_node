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

const validateViewing = [
	body('propertyId')
		.notEmpty()
		.withMessage('Property ID is required')
		.isMongoId()
		.withMessage('Invalid property ID'),
	body('date')
		.notEmpty()
		.withMessage('Date is required')
		.isISO8601()
		.withMessage('Invalid date format')
		.custom((value) => {
			const viewingDate = new Date(value);
			const now = new Date();
			if (viewingDate < now) {
				throw new Error('Viewing date must be in the future');
			}
			return true;
		}),
	body('note')
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage('Note cannot exceed 500 characters'),
	handleValidationErrors,
];

const validateViewingStatus = [
	body('status')
		.isIn(['pending', 'confirmed', 'cancelled', 'completed', 'rejected'])
		.withMessage('Invalid status'),
	body('cancelReason')
		.optional()
		.trim()
		.isLength({ max: 500 })
		.withMessage('Cancel reason cannot exceed 500 characters'),
	handleValidationErrors,
];

module.exports = {
	validateViewing,
	validateViewingStatus,
};
