const { auth, optionalAuth, authorize } = require('./auth');
const { ApiError, notFound, errorHandler, asyncHandler } = require('./errorHandler');
const {
	upload,
	uploadToCloudinary,
	uploadMultipleToCloudinary,
	deleteFromCloudinary,
	deleteMultipleFromCloudinary,
} = require('./upload');

module.exports = {
	auth,
	optionalAuth,
	authorize,
	ApiError,
	notFound,
	errorHandler,
	asyncHandler,
	upload,
	uploadToCloudinary,
	uploadMultipleToCloudinary,
	deleteFromCloudinary,
	deleteMultipleFromCloudinary,
};
