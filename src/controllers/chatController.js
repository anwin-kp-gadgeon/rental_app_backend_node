const { Chat, Message, User, Notification } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get user's chat rooms
 * @route   GET /api/chats
 * @access  Private
 */
const getChats = asyncHandler(async (req, res) => {
	const chats = await Chat.find({
		participants: req.user._id,
	})
		.populate('participants', 'name email photoUrl role')
		.sort({ lastMessageTime: -1 });

	// Transform to include user-specific data
	const transformedChats = chats.map((chat) => {
		const chatObj = chat.toObject();
		chatObj.lastMessage =
			chat.lastMessages?.get(req.user._id.toString()) || chat.lastMessage;
		chatObj.unreadCount = chat.unreadCounts?.get(req.user._id.toString()) || 0;
		return chatObj;
	});

	res.json({
		success: true,
		data: {
			chats: transformedChats,
		},
	});
});

/**
 * @desc    Get admin support chats (admin only)
 * @route   GET /api/chats/admin/support
 * @access  Private (admin)
 */
const getAdminSupportChats = asyncHandler(async (req, res) => {
	const chats = await Chat.find({
		isAdminSupport: true,
	})
		.populate('participants', 'name email photoUrl role')
		.sort({ lastMessageTime: -1 });

	res.json({
		success: true,
		data: {
			chats,
		},
	});
});

/**
 * @desc    Get or create a chat between two users
 * @route   POST /api/chats
 * @access  Private
 */
const getOrCreateChat = asyncHandler(async (req, res) => {
	const { userId, isAdminSupport = false } = req.body;

	if (!userId) {
		throw new ApiError(400, 'User ID is required');
	}

	// Check if other user exists
	const otherUser = await User.findById(userId);
	if (!otherUser) {
		throw new ApiError(404, 'User not found');
	}

	// Find existing chat
	let chat = await Chat.findOne({
		participants: { $all: [req.user._id, userId] },
		isAdminSupport,
	}).populate('participants', 'name email photoUrl role');

	if (!chat) {
		// Create new chat
		chat = await Chat.create({
			participants: [req.user._id, userId],
			isAdminSupport,
		});
		await chat.populate('participants', 'name email photoUrl role');
	}

	res.json({
		success: true,
		data: {
			chat,
		},
	});
});

/**
 * @desc    Get or create admin support chat
 * @route   POST /api/chats/support
 * @access  Private
 */
const getOrCreateSupportChat = asyncHandler(async (req, res) => {
	// Find an admin user
	const admin = await User.findOne({ role: 'admin', isActive: true });

	if (!admin) {
		throw new ApiError(404, 'No admin available for support');
	}

	// Find existing support chat
	let chat = await Chat.findOne({
		participants: { $all: [req.user._id, admin._id] },
		isAdminSupport: true,
	}).populate('participants', 'name email photoUrl role');

	if (!chat) {
		chat = await Chat.create({
			participants: [req.user._id, admin._id],
			isAdminSupport: true,
		});
		await chat.populate('participants', 'name email photoUrl role');
	}

	res.json({
		success: true,
		data: {
			chat,
		},
	});
});

/**
 * @desc    Get messages for a chat
 * @route   GET /api/chats/:chatId/messages
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
	const { page = 1, limit = 50 } = req.query;

	const chat = await Chat.findById(req.params.chatId);

	if (!chat) {
		throw new ApiError(404, 'Chat not found');
	}

	// Check if user is a participant
	if (!chat.participants.includes(req.user._id)) {
		throw new ApiError(403, 'Not authorized to view this chat');
	}

	const skip = (Number(page) - 1) * Number(limit);

	const [messages, total] = await Promise.all([
		Message.find({
			chatId: req.params.chatId,
			deletedBy: { $ne: req.user._id },
		})
			.populate('senderId', 'name photoUrl')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit)),
		Message.countDocuments({
			chatId: req.params.chatId,
			deletedBy: { $ne: req.user._id },
		}),
	]);

	res.json({
		success: true,
		data: {
			messages: messages.reverse(),
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
 * @desc    Send a message
 * @route   POST /api/chats/:chatId/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
	const { content } = req.body;

	if (!content || !content.trim()) {
		throw new ApiError(400, 'Message content is required');
	}

	const chat = await Chat.findById(req.params.chatId);

	if (!chat) {
		throw new ApiError(404, 'Chat not found');
	}

	if (!chat.participants.includes(req.user._id)) {
		throw new ApiError(403, 'Not authorized to send messages in this chat');
	}

	// Get receiver ID
	const receiverId = chat.participants.find(
		(p) => p.toString() !== req.user._id.toString()
	);

	const message = await Message.create({
		chatId: req.params.chatId,
		senderId: req.user._id,
		receiverId,
		content: content.trim(),
	});

	await message.populate('senderId', 'name photoUrl');

	// Notify receiver
	await Notification.create({
		userId: receiverId,
		type: chat.isAdminSupport ? 'supportMessage' : 'message',
		title: 'New Message',
		body: `${req.user.name}: ${content.substring(0, 100)}`,
		data: { chatId: chat._id, messageId: message._id },
	});

	res.status(201).json({
		success: true,
		data: {
			message,
		},
	});
});

/**
 * @desc    Delete a message (soft delete for user)
 * @route   DELETE /api/chats/:chatId/messages/:messageId
 * @access  Private
 */
const deleteMessage = asyncHandler(async (req, res) => {
	const message = await Message.findById(req.params.messageId);

	if (!message) {
		throw new ApiError(404, 'Message not found');
	}

	if (message.chatId.toString() !== req.params.chatId) {
		throw new ApiError(400, 'Message does not belong to this chat');
	}

	// Add user to deletedBy array
	if (!message.deletedBy.includes(req.user._id)) {
		message.deletedBy.push(req.user._id);
		await message.save();
	}

	// Update last message for user
	const lastMessage = await Message.findOne({
		chatId: req.params.chatId,
		deletedBy: { $ne: req.user._id },
	}).sort({ createdAt: -1 });

	if (lastMessage) {
		await Chat.findByIdAndUpdate(req.params.chatId, {
			[`lastMessages.${req.user._id}`]: lastMessage.content,
			[`lastMessageTimes.${req.user._id}`]: lastMessage.createdAt,
		});
	}

	res.json({
		success: true,
		message: 'Message deleted',
	});
});

/**
 * @desc    Mark messages as read
 * @route   PUT /api/chats/:chatId/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
	const chat = await Chat.findById(req.params.chatId);

	if (!chat) {
		throw new ApiError(404, 'Chat not found');
	}

	if (!chat.participants.includes(req.user._id)) {
		throw new ApiError(403, 'Not authorized');
	}

	// Reset unread count for user
	await Chat.findByIdAndUpdate(req.params.chatId, {
		[`unreadCounts.${req.user._id}`]: 0,
	});

	// Mark messages as read
	await Message.updateMany(
		{
			chatId: req.params.chatId,
			receiverId: req.user._id,
			isRead: false,
		},
		{ isRead: true }
	);

	res.json({
		success: true,
		message: 'Messages marked as read',
	});
});

/**
 * @desc    Get unread message count
 * @route   GET /api/chats/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
	const chats = await Chat.find({ participants: req.user._id });

	let totalUnread = 0;
	for (const chat of chats) {
		totalUnread += chat.unreadCounts?.get(req.user._id.toString()) || 0;
	}

	res.json({
		success: true,
		data: {
			unreadCount: totalUnread,
		},
	});
});

module.exports = {
	getChats,
	getAdminSupportChats,
	getOrCreateChat,
	getOrCreateSupportChat,
	getMessages,
	sendMessage,
	deleteMessage,
	markAsRead,
	getUnreadCount,
};
