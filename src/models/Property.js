const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
	{
		ownerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Owner is required'],
		},
		title: {
			type: String,
			required: [true, 'Title is required'],
			trim: true,
			minlength: [3, 'Title must be at least 3 characters'],
			maxlength: [200, 'Title cannot exceed 200 characters'],
		},
		description: {
			type: String,
			required: [true, 'Description is required'],
			trim: true,
			minlength: [10, 'Description must be at least 10 characters'],
			maxlength: [2000, 'Description cannot exceed 2000 characters'],
		},
		price: {
			type: Number,
			required: [true, 'Price is required'],
			min: [0, 'Price cannot be negative'],
		},
		location: {
			type: String,
			required: [true, 'Location is required'],
			trim: true,
		},
		images: [
			{
				type: String,
			},
		],
		propertyType: {
			type: String,
			enum: [
				'apartment',
				'house',
				'condo',
				'townhouse',
				'studio',
				'villa',
				'room',
				'other',
			],
			default: 'apartment',
		},
		bedrooms: {
			type: Number,
			default: 1,
			min: [0, 'Bedrooms cannot be negative'],
		},
		bathrooms: {
			type: Number,
			default: 1,
			min: [0, 'Bathrooms cannot be negative'],
		},
		squareFeet: {
			type: Number,
			min: [0, 'Square feet cannot be negative'],
			default: null,
		},
		amenities: [
			{
				type: String,
				trim: true,
			},
		],
		isAvailable: {
			type: Boolean,
			default: true,
		},
		isApproved: {
			type: Boolean,
			default: false,
		},
		status: {
			type: String,
			enum: ['pending', 'approved', 'rejected'],
			default: 'pending',
		},
		isResubmitted: {
			type: Boolean,
			default: false,
		},
		rejectionReason: {
			type: String,
			default: null,
		},
		views: {
			type: Number,
			default: 0,
		},
		averageRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		reviewCount: {
			type: Number,
			default: 0,
		},
		availableFrom: {
			type: Date,
			default: null,
		},
		sharingType: {
			type: String,
			enum: ['entire', 'private_room', 'shared_room', null],
			default: null,
		},
		availableBeds: {
			type: Number,
			default: null,
		},
		coordinates: {
			type: {
				type: String,
				enum: ['Point'],
				default: 'Point',
			},
			coordinates: {
				type: [Number], // [longitude, latitude]
				default: [0, 0],
			},
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes
propertySchema.index({ ownerId: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ isApproved: 1 });
propertySchema.index({ isAvailable: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ location: 'text', title: 'text' });
propertySchema.index({ coordinates: '2dsphere' });

// Virtual for reviews
propertySchema.virtual('reviews', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'propertyId',
});

// Virtual for owner details
propertySchema.virtual('owner', {
	ref: 'User',
	localField: 'ownerId',
	foreignField: '_id',
	justOne: true,
});

// Static method to search properties
propertySchema.statics.search = function (filters) {
	const query = { isApproved: true, isAvailable: true };

	if (filters.location) {
		query.location = new RegExp(filters.location, 'i');
	}

	if (filters.propertyType) {
		query.propertyType = filters.propertyType;
	}

	if (filters.minPrice || filters.maxPrice) {
		query.price = {};
		if (filters.minPrice) query.price.$gte = Number(filters.minPrice);
		if (filters.maxPrice) query.price.$lte = Number(filters.maxPrice);
	}

	if (filters.bedrooms) {
		query.bedrooms = { $gte: Number(filters.bedrooms) };
	}

	if (filters.bathrooms) {
		query.bathrooms = { $gte: Number(filters.bathrooms) };
	}

	if (filters.amenities && filters.amenities.length > 0) {
		query.amenities = { $all: filters.amenities };
	}

	return this.find(query);
};

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
