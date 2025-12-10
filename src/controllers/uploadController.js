const { asyncHandler, ApiError } = require('../middleware');
const {
	uploadToCloudinary,
	uploadMultipleToCloudinary,
	deleteFromCloudinary,
} = require('../middleware/upload');

/**
 * @desc    Upload a single image
 * @route   POST /api/upload/image
 * @access  Private
 */
const uploadSingleImage = asyncHandler(async (req, res) => {
	if (!req.file) {
		throw new ApiError(400, 'No image file provided');
	}

	const folder = req.body.folder || 'rental_app/general';
	const result = await uploadToCloudinary(req.file.buffer, folder);

	res.status(201).json({
		success: true,
		message: 'Image uploaded successfully',
		data: {
			url: result.secure_url,
			publicId: result.public_id,
			width: result.width,
			height: result.height,
			format: result.format,
		},
	});
});

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload/images
 * @access  Private
 */
const uploadMultipleImages = asyncHandler(async (req, res) => {
	if (!req.files || req.files.length === 0) {
		throw new ApiError(400, 'No image files provided');
	}

	const folder = req.body.folder || 'rental_app/properties';
	const urls = await uploadMultipleToCloudinary(req.files, folder);

	res.status(201).json({
		success: true,
		message: `${urls.length} image(s) uploaded successfully`,
		data: {
			urls,
			count: urls.length,
		},
	});
});

/**
 * @desc    Upload profile photo
 * @route   POST /api/upload/profile-photo
 * @access  Private
 */
const uploadProfilePhoto = asyncHandler(async (req, res) => {
	if (!req.file) {
		throw new ApiError(400, 'No image file provided');
	}

	const folder = 'rental_app/profiles';
	const result = await uploadToCloudinary(req.file.buffer, folder);

	// Update user's photoUrl
	req.user.photoUrl = result.secure_url;
	await req.user.save();

	res.status(201).json({
		success: true,
		message: 'Profile photo uploaded successfully',
		data: {
			url: result.secure_url,
			user: req.user.toSafeObject(),
		},
	});
});

/**
 * @desc    Upload property images
 * @route   POST /api/upload/property/:propertyId
 * @access  Private (owner of property)
 */
const uploadPropertyImages = asyncHandler(async (req, res) => {
	const { Property } = require('../models');

	if (!req.files || req.files.length === 0) {
		throw new ApiError(400, 'No image files provided');
	}

	const property = await Property.findById(req.params.propertyId);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	// Check ownership
	if (
		property.ownerId.toString() !== req.user._id.toString() &&
		req.user.role !== 'admin'
	) {
		throw new ApiError(403, 'Not authorized to upload images for this property');
	}

	const folder = `rental_app/properties/${req.params.propertyId}`;
	const urls = await uploadMultipleToCloudinary(req.files, folder);

	// Add new URLs to existing images
	property.images = [...property.images, ...urls];
	await property.save();

	res.status(201).json({
		success: true,
		message: `${urls.length} image(s) uploaded successfully`,
		data: {
			urls,
			allImages: property.images,
		},
	});
});

/**
 * @desc    Delete an image
 * @route   DELETE /api/upload/image
 * @access  Private
 */
const deleteImage = asyncHandler(async (req, res) => {
	const { imageUrl } = req.body;

	if (!imageUrl) {
		throw new ApiError(400, 'Image URL is required');
	}

	await deleteFromCloudinary(imageUrl);

	res.json({
		success: true,
		message: 'Image deleted successfully',
	});
});

/**
 * @desc    Delete property image
 * @route   DELETE /api/upload/property/:propertyId/image
 * @access  Private (owner of property)
 */
const deletePropertyImage = asyncHandler(async (req, res) => {
	const { Property } = require('../models');
	const { imageUrl } = req.body;

	if (!imageUrl) {
		throw new ApiError(400, 'Image URL is required');
	}

	const property = await Property.findById(req.params.propertyId);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	// Check ownership
	if (
		property.ownerId.toString() !== req.user._id.toString() &&
		req.user.role !== 'admin'
	) {
		throw new ApiError(403, 'Not authorized to delete images for this property');
	}

	// Remove URL from property images array
	property.images = property.images.filter((img) => img !== imageUrl);
	await property.save();

	// Delete from Cloudinary
	await deleteFromCloudinary(imageUrl);

	res.json({
		success: true,
		message: 'Image deleted successfully',
		data: {
			remainingImages: property.images,
		},
	});
});

module.exports = {
	uploadSingleImage,
	uploadMultipleImages,
	uploadProfilePhoto,
	uploadPropertyImages,
	deleteImage,
	deletePropertyImage,
};
