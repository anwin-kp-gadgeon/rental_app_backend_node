const { User } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get all users (admin)
 * @route   GET /api/users
 * @access  Private (admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
	const { role, page = 1, limit = 50, search } = req.query;

	const query = {};
	if (role) {
		query.role = role;
	}
	if (search) {
		query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
	}

	const skip = (Number(page) - 1) * Number(limit);

	const [users, total] = await Promise.all([
		User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
		User.countDocuments(query),
	]);

	res.json({
		success: true,
		data: {
			users: users.map((u) => u.toSafeObject()),
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
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	res.json({
		success: true,
		data: {
			user: user.toSafeObject(),
		},
	});
});

/**
 * @desc    Update user (admin)
 * @route   PUT /api/users/:id
 * @access  Private (admin)
 */
const updateUser = asyncHandler(async (req, res) => {
	const { name, role, isActive, phoneNumber, bio } = req.body;

	const user = await User.findById(req.params.id);

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	if (name !== undefined) user.name = name;
	if (role !== undefined) user.role = role;
	if (isActive !== undefined) user.isActive = isActive;
	if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
	if (bio !== undefined) user.bio = bio;

	await user.save();

	res.json({
		success: true,
		message: 'User updated successfully',
		data: {
			user: user.toSafeObject(),
		},
	});
});

/**
 * @desc    Delete user (admin)
 * @route   DELETE /api/users/:id
 * @access  Private (admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	// Prevent deleting yourself
	if (user._id.toString() === req.user._id.toString()) {
		throw new ApiError(400, 'Cannot delete your own account');
	}

	await User.findByIdAndDelete(req.params.id);

	res.json({
		success: true,
		message: 'User deleted successfully',
	});
});

/**
 * @desc    Toggle user active status (admin)
 * @route   PATCH /api/users/:id/toggle-active
 * @access  Private (admin)
 */
const toggleUserActive = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	if (user._id.toString() === req.user._id.toString()) {
		throw new ApiError(400, 'Cannot deactivate your own account');
	}

	user.isActive = !user.isActive;
	await user.save();

	res.json({
		success: true,
		message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
		data: {
			user: user.toSafeObject(),
		},
	});
});

/**
 * @desc    Get user stats (admin)
 * @route   GET /api/users/stats
 * @access  Private (admin)
 */
const getUserStats = asyncHandler(async (req, res) => {
	const [totalUsers, owners, admins, activeUsers] = await Promise.all([
		User.countDocuments(),
		User.countDocuments({ role: 'owner' }),
		User.countDocuments({ role: 'admin' }),
		User.countDocuments({ isActive: true }),
	]);

	res.json({
		success: true,
		data: {
			totalUsers,
			owners,
			admins,
			regularUsers: totalUsers - owners - admins,
			activeUsers,
			inactiveUsers: totalUsers - activeUsers,
		},
	});
});

module.exports = {
	getAllUsers,
	getUserById,
	updateUser,
	deleteUser,
	toggleUserActive,
	getUserStats,
};
