const { Notification } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
	const { page = 1, limit = 50 } = req.query;
	const skip = (Number(page) - 1) * Number(limit);

	const [notifications, total] = await Promise.all([
		Notification.find({ userId: req.user._id })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit)),
		Notification.countDocuments({ userId: req.user._id }),
	]);

	res.json({
		success: true,
		data: {
			notifications,
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
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
	const count = await Notification.countDocuments({
		userId: req.user._id,
		isRead: false,
	});

	res.json({
		success: true,
		data: {
			unreadCount: count,
		},
	});
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
	const notification = await Notification.findById(req.params.id);

	if (!notification) {
		throw new ApiError(404, 'Notification not found');
	}

	if (notification.userId.toString() !== req.user._id.toString()) {
		throw new ApiError(403, 'Not authorized');
	}

	notification.isRead = true;
	await notification.save();

	res.json({
		success: true,
		message: 'Notification marked as read',
	});
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
	await Notification.updateMany(
		{ userId: req.user._id, isRead: false },
		{ isRead: true }
	);

	res.json({
		success: true,
		message: 'All notifications marked as read',
	});
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
	const notification = await Notification.findById(req.params.id);

	if (!notification) {
		throw new ApiError(404, 'Notification not found');
	}

	if (notification.userId.toString() !== req.user._id.toString()) {
		throw new ApiError(403, 'Not authorized');
	}

	await Notification.findByIdAndDelete(req.params.id);

	res.json({
		success: true,
		message: 'Notification deleted',
	});
});

/**
 * @desc    Delete all notifications
 * @route   DELETE /api/notifications
 * @access  Private
 */
const deleteAllNotifications = asyncHandler(async (req, res) => {
	await Notification.deleteMany({ userId: req.user._id });

	res.json({
		success: true,
		message: 'All notifications deleted',
	});
});

/**
 * @desc    Create a notification (internal use / admin)
 * @route   POST /api/notifications
 * @access  Private (admin)
 */
const createNotification = asyncHandler(async (req, res) => {
	const { userId, type, title, body, data } = req.body;

	const notification = await Notification.create({
		userId,
		type,
		title,
		body,
		data,
	});

	res.status(201).json({
		success: true,
		data: {
			notification,
		},
	});
});

module.exports = {
	getNotifications,
	getUnreadCount,
	markAsRead,
	markAllAsRead,
	deleteNotification,
	deleteAllNotifications,
	createNotification,
};
