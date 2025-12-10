const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { auth, authorize } = require('../middleware');
const { upload } = require('../middleware/upload');

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/upload/image
 * @desc    Upload a single image
 * @access  Private
 */
router.post('/image', upload.single('image'), uploadController.uploadSingleImage);

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images (max 10)
 * @access  Private
 */
router.post('/images', upload.array('images', 10), uploadController.uploadMultipleImages);

/**
 * @route   POST /api/upload/profile-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
	'/profile-photo',
	upload.single('image'),
	uploadController.uploadProfilePhoto
);

/**
 * @route   POST /api/upload/property/:propertyId
 * @desc    Upload property images
 * @access  Private (owner/admin)
 */
router.post(
	'/property/:propertyId',
	authorize('owner', 'admin'),
	upload.array('images', 10),
	uploadController.uploadPropertyImages
);

/**
 * @route   DELETE /api/upload/image
 * @desc    Delete an image from cloud storage
 * @access  Private
 */
router.delete('/image', uploadController.deleteImage);

/**
 * @route   DELETE /api/upload/property/:propertyId/image
 * @desc    Delete a property image
 * @access  Private (owner/admin)
 */
router.delete(
	'/property/:propertyId/image',
	authorize('owner', 'admin'),
	uploadController.deletePropertyImage
);

module.exports = router;
