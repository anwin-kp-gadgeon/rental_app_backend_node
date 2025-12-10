const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'User is required'],
		},
		propertyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Property',
			required: [true, 'Property is required'],
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
favoriteSchema.index({ userId: 1 });
favoriteSchema.index({ propertyId: 1 });
favoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
