const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { ApiError } = require('./errorHandler');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
	const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new ApiError(400, 'Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
	}
};

// Multer upload configuration
const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB max file size
	},
});

/**
 * Upload a single image to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - The folder name in Cloudinary
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder = 'rental_app') => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				resource_type: 'image',
				transformation: [
					{ width: 1200, height: 800, crop: 'limit' }, // Resize large images
					{ quality: 'auto' }, // Auto optimize quality
					{ fetch_format: 'auto' }, // Auto format (webp for supported browsers)
				],
			},
			(error, result) => {
				if (error) {
					reject(new ApiError(500, 'Failed to upload image to cloud storage'));
				} else {
					resolve(result);
				}
			}
		);

		uploadStream.end(fileBuffer);
	});
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of file objects from multer
 * @param {string} folder - The folder name in Cloudinary
 * @returns {Promise<Array>} - Array of Cloudinary URLs
 */
const uploadMultipleToCloudinary = async (files, folder = 'rental_app') => {
	const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, folder));
	const results = await Promise.all(uploadPromises);
	return results.map((result) => result.secure_url);
};

/**
 * Delete an image from Cloudinary
 * @param {string} imageUrl - The Cloudinary image URL
 * @returns {Promise<object>} - Cloudinary deletion result
 */
const deleteFromCloudinary = async (imageUrl) => {
	try {
		// Extract public_id from URL
		const urlParts = imageUrl.split('/');
		const folderAndFile = urlParts.slice(-2).join('/');
		const publicId = folderAndFile.replace(/\.[^/.]+$/, ''); // Remove file extension

		const result = await cloudinary.uploader.destroy(publicId);
		return result;
	} catch (error) {
		console.error('Error deleting from Cloudinary:', error);
		// Don't throw error - deletion failure shouldn't break the app
		return null;
	}
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array<string>} imageUrls - Array of Cloudinary image URLs
 * @returns {Promise<Array>} - Array of deletion results
 */
const deleteMultipleFromCloudinary = async (imageUrls) => {
	const deletePromises = imageUrls.map((url) => deleteFromCloudinary(url));
	return Promise.all(deletePromises);
};

module.exports = {
	upload,
	uploadToCloudinary,
	uploadMultipleToCloudinary,
	deleteFromCloudinary,
	deleteMultipleFromCloudinary,
};
