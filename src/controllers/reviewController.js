const { Review, Property, Notification } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get reviews for a property
 * @route   GET /api/reviews/property/:propertyId
 * @access  Public
 */
const getPropertyReviews = asyncHandler(async (req, res) => {
	const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

	const skip = (Number(page) - 1) * Number(limit);
	const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

	const [reviews, total] = await Promise.all([
		Review.find({ propertyId: req.params.propertyId })
			.populate('userId', 'name photoUrl')
			.sort(sortOptions)
			.skip(skip)
			.limit(Number(limit)),
		Review.countDocuments({ propertyId: req.params.propertyId }),
	]);

	res.json({
		success: true,
		data: {
			reviews,
			pagination: {
				page: Number(page),
				limit: Number(limit),
				total,
				pages: Math.ceil(total / Number(limit)),
			},
		},
	});
});

/**
 * @desc    Get user's reviews
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
const getUserReviews = asyncHandler(async (req, res) => {
	const { page = 1, limit = 20 } = req.query;
	const skip = (Number(page) - 1) * Number(limit);

	const [reviews, total] = await Promise.all([
		Review.find({ userId: req.params.userId })
			.populate('propertyId', 'title images location')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit)),
		Review.countDocuments({ userId: req.params.userId }),
	]);

	res.json({
		success: true,
		data: {
			reviews,
			pagination: {
				page: Number(page),
				limit: Number(limit),
				total,
				pages: Math.ceil(total / Number(limit)),
			},
		},
	});
});

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = asyncHandler(async (req, res) => {
	const { propertyId, rating, reviewText } = req.body;

	// Check if property exists
	const property = await Property.findById(propertyId);
	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	// Check if user already reviewed this property
	const existingReview = await Review.findOne({
		propertyId,
		userId: req.user._id,
	});

	if (existingReview) {
		throw new ApiError(400, 'You have already reviewed this property');
	}

	// Prevent owners from reviewing their own properties
	if (property.ownerId.toString() === req.user._id.toString()) {
		throw new ApiError(400, 'You cannot review your own property');
	}

	const review = await Review.create({
		propertyId,
		userId: req.user._id,
		userName: req.user.name,
		userPhotoUrl: req.user.photoUrl,
		rating,
		reviewText,
	});

	// Notify property owner
	await Notification.create({
		userId: property.ownerId,
		type: 'review',
		title: 'New Review',
		body: `${req.user.name} left a ${rating}-star review on "${property.title}".`,
		data: { propertyId, reviewId: review._id },
	});

	res.status(201).json({
		success: true,
		message: 'Review created successfully',
		data: {
			review,
		},
	});
});

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = asyncHandler(async (req, res) => {
	const { rating, reviewText } = req.body;

	let review = await Review.findById(req.params.id);

	if (!review) {
		throw new ApiError(404, 'Review not found');
	}

	if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
		throw new ApiError(403, 'Not authorized to update this review');
	}

	review = await Review.findByIdAndUpdate(
		req.params.id,
		{
			rating: rating || review.rating,
			reviewText: reviewText || review.reviewText,
		},
		{ new: true, runValidators: true }
	);

	res.json({
		success: true,
		message: 'Review updated successfully',
		data: {
			review,
		},
	});
});

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
	const review = await Review.findById(req.params.id);

	if (!review) {
		throw new ApiError(404, 'Review not found');
	}

	if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
		throw new ApiError(403, 'Not authorized to delete this review');
	}

	await Review.findByIdAndDelete(req.params.id);

	res.json({
		success: true,
		message: 'Review deleted successfully',
	});
});

/**
 * @desc    Mark review as helpful
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
const markHelpful = asyncHandler(async (req, res) => {
	const review = await Review.findById(req.params.id);

	if (!review) {
		throw new ApiError(404, 'Review not found');
	}

	const userId = req.user._id;

	// Check if user already marked as helpful
	if (review.helpfulUserIds.includes(userId)) {
		// Remove helpful vote
		review.helpfulUserIds = review.helpfulUserIds.filter(
			(id) => id.toString() !== userId.toString()
		);
		review.helpfulCount = Math.max(0, review.helpfulCount - 1);
	} else {
		// Add helpful vote
		review.helpfulUserIds.push(userId);
		review.helpfulCount += 1;
	}

	await review.save();

	res.json({
		success: true,
		data: {
			helpfulCount: review.helpfulCount,
			isHelpful: review.helpfulUserIds.includes(userId),
		},
	});
});

module.exports = {
	getPropertyReviews,
	getUserReviews,
	createReview,
	updateReview,
	deleteReview,
	markHelpful,
};
