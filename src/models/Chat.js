const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
	{
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
				required: true,
			},
		],
		isAdminSupport: {
			type: Boolean,
			default: false,
		},
		lastMessage: {
			type: String,
			default: '',
		},
		lastMessageTime: {
			type: Date,
			default: Date.now,
		},
		lastMessages: {
			type: Map,
			of: String,
			default: {},
		},
		lastMessageTimes: {
			type: Map,
			of: Date,
			default: {},
		},
		unreadCounts: {
			type: Map,
			of: Number,
			default: {},
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ isAdminSupport: 1 });
chatSchema.index({ lastMessageTime: -1 });

// Static method to find or create chat between two users
chatSchema.statics.findOrCreateChat = async function (
	user1Id,
	user2Id,
	isAdminSupport = false
) {
	// Check if chat already exists
	let chat = await this.findOne({
		participants: { $all: [user1Id, user2Id] },
		isAdminSupport,
	});

	if (!chat) {
		chat = await this.create({
			participants: [user1Id, user2Id],
			isAdminSupport,
		});
	}

	return chat;
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
