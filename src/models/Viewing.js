const mongoose = require('mongoose');

const viewingSchema = new mongoose.Schema(
	{
		propertyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Property',
			required: [true, 'Property is required'],
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'User is required'],
		},
		ownerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Owner is required'],
		},
		date: {
			type: Date,
			required: [true, 'Viewing date is required'],
		},
		status: {
			type: String,
			enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
			default: 'pending',
		},
		note: {
			type: String,
			maxlength: [500, 'Note cannot exceed 500 characters'],
			default: null,
		},
		cancelReason: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
viewingSchema.index({ propertyId: 1 });
viewingSchema.index({ userId: 1 });
viewingSchema.index({ ownerId: 1 });
viewingSchema.index({ status: 1 });
viewingSchema.index({ date: 1 });

const Viewing = mongoose.model('Viewing', viewingSchema);

module.exports = Viewing;
