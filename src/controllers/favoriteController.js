const { Favorite, Property } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get user's favorites
 * @route   GET /api/favorites
 * @access  Private
 */
const getFavorites = asyncHandler(async (req, res) => {
	const { page = 1, limit = 20 } = req.query;
	const skip = (Number(page) - 1) * Number(limit);

	const [favorites, total] = await Promise.all([
		Favorite.find({ userId: req.user._id })
			.populate({
				path: 'propertyId',
				populate: {
					path: 'ownerId',
					select: 'name email phoneNumber photoUrl',
				},
			})
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit)),
		Favorite.countDocuments({ userId: req.user._id }),
	]);

	// Filter out favorites where property no longer exists
	const validFavorites = favorites.filter((f) => f.propertyId != null);

	res.json({
		success: true,
		data: {
			favorites: validFavorites,
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
 * @desc    Get favorite property IDs for user
 * @route   GET /api/favorites/ids
 * @access  Private
 */
const getFavoriteIds = asyncHandler(async (req, res) => {
	const favorites = await Favorite.find({ userId: req.user._id }).select('propertyId');
	const propertyIds = favorites.map((f) => f.propertyId.toString());

	res.json({
		success: true,
		data: {
			propertyIds,
		},
	});
});

/**
 * @desc    Add property to favorites
 * @route   POST /api/favorites
 * @access  Private
 */
const addFavorite = asyncHandler(async (req, res) => {
	const { propertyId } = req.body;

	// Check if property exists
	const property = await Property.findById(propertyId);
	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	// Check if already favorited
	const existing = await Favorite.findOne({
		userId: req.user._id,
		propertyId,
	});

	if (existing) {
		throw new ApiError(400, 'Property is already in favorites');
	}

	const favorite = await Favorite.create({
		userId: req.user._id,
		propertyId,
	});

	res.status(201).json({
		success: true,
		message: 'Added to favorites',
		data: {
			favorite,
		},
	});
});

/**
 * @desc    Remove property from favorites
 * @route   DELETE /api/favorites/:propertyId
 * @access  Private
 */
const removeFavorite = asyncHandler(async (req, res) => {
	const result = await Favorite.findOneAndDelete({
		userId: req.user._id,
		propertyId: req.params.propertyId,
	});

	if (!result) {
		throw new ApiError(404, 'Favorite not found');
	}

	res.json({
		success: true,
		message: 'Removed from favorites',
	});
});

/**
 * @desc    Check if property is favorited
 * @route   GET /api/favorites/check/:propertyId
 * @access  Private
 */
const checkFavorite = asyncHandler(async (req, res) => {
	const favorite = await Favorite.findOne({
		userId: req.user._id,
		propertyId: req.params.propertyId,
	});

	res.json({
		success: true,
		data: {
			isFavorited: !!favorite,
		},
	});
});

/**
 * @desc    Toggle favorite status
 * @route   POST /api/favorites/toggle/:propertyId
 * @access  Private
 */
const toggleFavorite = asyncHandler(async (req, res) => {
	const { propertyId } = req.params;

	// Check if property exists
	const property = await Property.findById(propertyId);
	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	const existing = await Favorite.findOne({
		userId: req.user._id,
		propertyId,
	});

	let isFavorited;
	if (existing) {
		await Favorite.findByIdAndDelete(existing._id);
		isFavorited = false;
	} else {
		await Favorite.create({
			userId: req.user._id,
			propertyId,
		});
		isFavorited = true;
	}

	res.json({
		success: true,
		message: isFavorited ? 'Added to favorites' : 'Removed from favorites',
		data: {
			isFavorited,
		},
	});
});

module.exports = {
	getFavorites,
	getFavoriteIds,
	addFavorite,
	removeFavorite,
	checkFavorite,
	toggleFavorite,
};
