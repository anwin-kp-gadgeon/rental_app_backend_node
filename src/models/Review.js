const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
		userName: {
			type: String,
			required: [true, 'User name is required'],
		},
		userPhotoUrl: {
			type: String,
			default: null,
		},
		rating: {
			type: Number,
			required: [true, 'Rating is required'],
			min: [1, 'Rating must be at least 1'],
			max: [5, 'Rating cannot exceed 5'],
		},
		reviewText: {
			type: String,
			required: [true, 'Review text is required'],
			trim: true,
			minlength: [10, 'Review must be at least 10 characters'],
			maxlength: [1000, 'Review cannot exceed 1000 characters'],
		},
		helpfulCount: {
			type: Number,
			default: 0,
		},
		helpfulUserIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
	},
	{
		timestamps: true,
	}
);

// Indexes
reviewSchema.index({ propertyId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ propertyId: 1, userId: 1 }, { unique: true });

// Static method to calculate average rating for a property
reviewSchema.statics.calculateAverageRating = async function (propertyId) {
	const result = await this.aggregate([
		{ $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
		{
			$group: {
				_id: '$propertyId',
				averageRating: { $avg: '$rating' },
				reviewCount: { $sum: 1 },
			},
		},
	]);

	if (result.length > 0) {
		await mongoose.model('Property').findByIdAndUpdate(propertyId, {
			averageRating: Math.round(result[0].averageRating * 10) / 10,
			reviewCount: result[0].reviewCount,
		});
	} else {
		await mongoose.model('Property').findByIdAndUpdate(propertyId, {
			averageRating: 0,
			reviewCount: 0,
		});
	}
};

// Post-save hook to update property rating
reviewSchema.post('save', function () {
	this.constructor.calculateAverageRating(this.propertyId);
});

// Post-remove hook to update property rating
reviewSchema.post('findOneAndDelete', function (doc) {
	if (doc) {
		doc.constructor.calculateAverageRating(doc.propertyId);
	}
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
