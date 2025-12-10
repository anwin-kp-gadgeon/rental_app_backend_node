const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		chatId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Chat',
			required: [true, 'Chat is required'],
		},
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Sender is required'],
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Receiver is required'],
		},
		content: {
			type: String,
			required: [true, 'Message content is required'],
			trim: true,
			maxlength: [2000, 'Message cannot exceed 2000 characters'],
		},
		deletedBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		isRead: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
messageSchema.index({ chatId: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ createdAt: -1 });

// Post-save hook to update chat's last message
messageSchema.post('save', async function () {
	const Chat = mongoose.model('Chat');

	await Chat.findByIdAndUpdate(this.chatId, {
		lastMessage: this.content,
		lastMessageTime: this.createdAt,
		[`lastMessages.${this.senderId}`]: this.content,
		[`lastMessages.${this.receiverId}`]: this.content,
		[`lastMessageTimes.${this.senderId}`]: this.createdAt,
		[`lastMessageTimes.${this.receiverId}`]: this.createdAt,
		$inc: { [`unreadCounts.${this.receiverId}`]: 1 },
	});
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
