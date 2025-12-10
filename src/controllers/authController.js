const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
	return jwt.sign({ userId }, config.jwt.secret, {
		expiresIn: config.jwt.expiresIn,
	});
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
	const { name, email, password, phoneNumber, role } = req.body;

	// Check if user already exists
	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new ApiError(400, 'User with this email already exists');
	}

	// Check phone number if provided
	if (phoneNumber) {
		const phoneExists = await User.findOne({ phoneNumber });
		if (phoneExists) {
			throw new ApiError(400, 'Phone number is already registered');
		}
	}

	// Create new user
	const user = await User.create({
		name,
		email,
		password,
		phoneNumber,
		role: role || 'user',
	});

	// Generate token
	const token = generateToken(user._id);

	res.status(201).json({
		success: true,
		message: 'User registered successfully',
		data: {
			user: user.toSafeObject(),
			token,
		},
	});
});

/**
 * @desc    Login with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	const user = await User.findOne({ email }).select('+password');

	if (!user) {
		throw new ApiError(401, 'Invalid email or password');
	}

	if (!user.isActive) {
		throw new ApiError(401, 'Your account has been deactivated');
	}

	if (!user.password) {
		throw new ApiError(401, 'Please login with Google or set a password');
	}

	const isMatch = await user.comparePassword(password);

	if (!isMatch) {
		throw new ApiError(401, 'Invalid email or password');
	}

	const token = generateToken(user._id);

	res.json({
		success: true,
		message: 'Login successful',
		data: {
			user: user.toSafeObject(),
			token,
		},
	});
});

/**
 * @desc    Login with phone number and password
 * @route   POST /api/auth/login-phone
 * @access  Public
 */
const loginWithPhone = asyncHandler(async (req, res) => {
	const { phoneNumber, password } = req.body;

	const user = await User.findOne({ phoneNumber }).select('+password');

	if (!user) {
		throw new ApiError(401, 'No account found with this phone number');
	}

	if (!user.isActive) {
		throw new ApiError(401, 'Your account has been deactivated');
	}

	if (!user.password) {
		throw new ApiError(401, 'Please set a password first');
	}

	const isMatch = await user.comparePassword(password);

	if (!isMatch) {
		throw new ApiError(401, 'Invalid phone number or password');
	}

	const token = generateToken(user._id);

	res.json({
		success: true,
		message: 'Login successful',
		data: {
			user: user.toSafeObject(),
			token,
		},
	});
});

/**
 * @desc    Google OAuth login/register
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = asyncHandler(async (req, res) => {
	const { googleId, email, name, photoUrl } = req.body;

	if (!googleId || !email) {
		throw new ApiError(400, 'Google ID and email are required');
	}

	// Check if user exists with this Google ID
	let user = await User.findOne({ googleId });

	if (!user) {
		// Check if email exists
		user = await User.findOne({ email });

		if (user) {
			// Link Google account to existing user
			user.googleId = googleId;
			if (!user.photoUrl && photoUrl) user.photoUrl = photoUrl;
			await user.save();
		} else {
			// Create new user
			user = await User.create({
				email,
				name: name || 'User',
				googleId,
				photoUrl,
				role: 'user',
			});
		}
	}

	if (!user.isActive) {
		throw new ApiError(401, 'Your account has been deactivated');
	}

	const token = generateToken(user._id);

	res.json({
		success: true,
		message: 'Login successful',
		data: {
			user: user.toSafeObject(),
			token,
		},
	});
});

/**
 * @desc    Set password for OAuth users
 * @route   POST /api/auth/set-password
 * @access  Private
 */
const setPassword = asyncHandler(async (req, res) => {
	const { password } = req.body;

	const user = await User.findById(req.user._id);

	user.password = password;
	await user.save();

	const token = generateToken(user._id);

	res.json({
		success: true,
		message: 'Password set successfully',
		data: {
			token,
		},
	});
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id);

	res.json({
		success: true,
		data: {
			user: user.toSafeObject(),
		},
	});
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
	const { name, phoneNumber, photoUrl, bio, removePhoto } = req.body;

	const user = await User.findById(req.user._id);

	if (name !== undefined) user.name = name;
	if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
	if (bio !== undefined) user.bio = bio;

	if (removePhoto) {
		user.photoUrl = null;
	} else if (photoUrl !== undefined) {
		user.photoUrl = photoUrl;
	}

	await user.save();

	res.json({
		success: true,
		message: 'Profile updated successfully',
		data: {
			user: user.toSafeObject(),
		},
	});
});

/**
 * @desc    Update user preferences (theme, locale)
 * @route   PUT /api/auth/preferences
 * @access  Private
 */
const updatePreferences = asyncHandler(async (req, res) => {
	const { isDarkMode, locale } = req.body;

	const user = await User.findById(req.user._id);

	if (isDarkMode !== undefined) user.isDarkMode = isDarkMode;
	if (locale !== undefined) user.locale = locale;

	await user.save();

	res.json({
		success: true,
		message: 'Preferences updated successfully',
		data: {
			user: user.toSafeObject(),
		},
	});
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
	const { currentPassword, newPassword } = req.body;

	const user = await User.findById(req.user._id).select('+password');

	if (user.password) {
		const isMatch = await user.comparePassword(currentPassword);
		if (!isMatch) {
			throw new ApiError(400, 'Current password is incorrect');
		}
	}

	user.password = newPassword;
	await user.save();

	const token = generateToken(user._id);

	res.json({
		success: true,
		message: 'Password changed successfully',
		data: {
			token,
		},
	});
});

/**
 * @desc    Update FCM token for push notifications
 * @route   PUT /api/auth/fcm-token
 * @access  Private
 */
const updateFcmToken = asyncHandler(async (req, res) => {
	const { fcmToken } = req.body;

	await User.findByIdAndUpdate(req.user._id, { fcmToken });

	res.json({
		success: true,
		message: 'FCM token updated',
	});
});

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Private
 */
const refreshToken = asyncHandler(async (req, res) => {
	const token = generateToken(req.user._id);

	res.json({
		success: true,
		message: 'Token refreshed successfully',
		data: {
			token,
		},
	});
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
	// Clear FCM token on logout
	await User.findByIdAndUpdate(req.user._id, { fcmToken: null });

	res.json({
		success: true,
		message: 'Logged out successfully',
	});
});

module.exports = {
	register,
	login,
	loginWithPhone,
	googleAuth,
	setPassword,
	getProfile,
	updateProfile,
	updatePreferences,
	changePassword,
	updateFcmToken,
	refreshToken,
	logout,
};
