const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { auth } = require('../middleware');
const {
	validate,
	registerValidator,
	loginValidator,
	updateProfileValidator,
	changePasswordValidator,
} = require('../validators');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidator, validate, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidator, validate, authController.login);

/**
 * @route   POST /api/auth/login/phone
 * @desc    Login with phone number
 * @access  Public
 */
router.post('/login/phone', authController.loginWithPhone);

/**
 * @route   POST /api/auth/google
 * @desc    Login/Register with Google
 * @access  Public
 */
router.post('/google', authController.googleAuth);

/**
 * @route   POST /api/auth/set-password
 * @desc    Set password for OAuth users
 * @access  Private
 */
router.post('/set-password', auth, authController.setPassword);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
	'/profile',
	auth,
	updateProfileValidator,
	validate,
	authController.updateProfile
);

/**
 * @route   PUT /api/auth/preferences
 * @desc    Update user preferences (theme, locale)
 * @access  Private
 */
router.put('/preferences', auth, authController.updatePreferences);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put(
	'/change-password',
	auth,
	changePasswordValidator,
	validate,
	authController.changePassword
);

/**
 * @route   PUT /api/auth/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
router.put('/fcm-token', auth, authController.updateFcmToken);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh-token', auth, authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth, authController.logout);

module.exports = router;
