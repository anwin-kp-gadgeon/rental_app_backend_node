const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'User is required'],
		},
		type: {
			type: String,
			enum: [
				'message',
				'propertyUpdate',
				'review',
				'system',
				'supportMessage',
				'viewing',
				'approval',
			],
			required: [true, 'Notification type is required'],
		},
		title: {
			type: String,
			required: [true, 'Title is required'],
			trim: true,
			maxlength: [200, 'Title cannot exceed 200 characters'],
		},
		body: {
			type: String,
			required: [true, 'Body is required'],
			trim: true,
			maxlength: [500, 'Body cannot exceed 500 characters'],
		},
		data: {
			type: mongoose.Schema.Types.Mixed,
			default: null,
		},
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
notificationSchema.index({ userId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
