const { Property, User, Notification } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get all approved properties with filters
 * @route   GET /api/properties
 * @access  Public
 */
const getProperties = asyncHandler(async (req, res) => {
	const {
		location,
		propertyType,
		minPrice,
		maxPrice,
		bedrooms,
		bathrooms,
		amenities,
		page = 1,
		limit = 20,
		sortBy = 'createdAt',
		sortOrder = 'desc',
	} = req.query;

	const query = { isApproved: true, status: 'approved' };

	if (location) {
		query.location = new RegExp(location, 'i');
	}

	if (propertyType) {
		query.propertyType = propertyType;
	}

	if (minPrice || maxPrice) {
		query.price = {};
		if (minPrice) query.price.$gte = Number(minPrice);
		if (maxPrice) query.price.$lte = Number(maxPrice);
	}

	if (bedrooms) {
		query.bedrooms = { $gte: Number(bedrooms) };
	}

	if (bathrooms) {
		query.bathrooms = { $gte: Number(bathrooms) };
	}

	if (amenities) {
		const amenityList = amenities.split(',').map((a) => a.trim());
		query.amenities = { $all: amenityList };
	}

	const skip = (Number(page) - 1) * Number(limit);
	const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

	const [properties, total] = await Promise.all([
		Property.find(query)
			.populate('ownerId', 'name email phoneNumber photoUrl')
			.sort(sortOptions)
			.skip(skip)
			.limit(Number(limit)),
		Property.countDocuments(query),
	]);

	res.json({
		success: true,
		data: {
			properties,
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
 * @desc    Get single property by ID
 * @route   GET /api/properties/:id
 * @access  Public
 */
const getPropertyById = asyncHandler(async (req, res) => {
	const property = await Property.findById(req.params.id).populate(
		'ownerId',
		'name email phoneNumber photoUrl bio'
	);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	res.json({
		success: true,
		data: {
			property,
		},
	});
});

/**
 * @desc    Create a new property
 * @route   POST /api/properties
 * @access  Private (owner, admin)
 */
const createProperty = asyncHandler(async (req, res) => {
	const propertyData = {
		...req.body,
		ownerId: req.user._id,
		status: 'pending',
		isApproved: false,
	};

	const property = await Property.create(propertyData);

	// Notify admins about new property
	const admins = await User.find({ role: 'admin' });
	for (const admin of admins) {
		await Notification.create({
			userId: admin._id,
			type: 'propertyUpdate',
			title: 'New Property Submitted',
			body: `A new property "${property.title}" has been submitted for review.`,
			data: { propertyId: property._id },
		});
	}

	res.status(201).json({
		success: true,
		message: 'Property created successfully. Pending admin approval.',
		data: {
			property,
		},
	});
});

/**
 * @desc    Update a property
 * @route   PUT /api/properties/:id
 * @access  Private (owner, admin)
 */
const updateProperty = asyncHandler(async (req, res) => {
	let property = await Property.findById(req.params.id);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	// Check ownership (unless admin)
	if (
		property.ownerId.toString() !== req.user._id.toString() &&
		req.user.role !== 'admin'
	) {
		throw new ApiError(403, 'Not authorized to update this property');
	}

	// If owner updates, reset approval status (unless admin)
	const updateData = { ...req.body };
	if (req.user.role !== 'admin') {
		updateData.status = 'pending';
		updateData.isApproved = false;
	}

	property = await Property.findByIdAndUpdate(
		req.params.id,
		{ $set: updateData },
		{ new: true, runValidators: true }
	).populate('ownerId', 'name email phoneNumber photoUrl');

	res.json({
		success: true,
		message: 'Property updated successfully',
		data: {
			property,
		},
	});
});

/**
 * @desc    Delete a property
 * @route   DELETE /api/properties/:id
 * @access  Private (owner, admin)
 */
const deleteProperty = asyncHandler(async (req, res) => {
	const property = await Property.findById(req.params.id);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	// Check ownership (unless admin)
	if (
		property.ownerId.toString() !== req.user._id.toString() &&
		req.user.role !== 'admin'
	) {
		throw new ApiError(403, 'Not authorized to delete this property');
	}

	await Property.findByIdAndDelete(req.params.id);

	res.json({
		success: true,
		message: 'Property deleted successfully',
	});
});

/**
 * @desc    Get owner's properties
 * @route   GET /api/properties/owner/my-properties
 * @access  Private
 */
const getMyProperties = asyncHandler(async (req, res) => {
	const { status, page = 1, limit = 20 } = req.query;

	const query = { ownerId: req.user._id };
	if (status) {
		query.status = status;
	}

	const skip = (Number(page) - 1) * Number(limit);

	const [properties, total] = await Promise.all([
		Property.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
		Property.countDocuments(query),
	]);

	res.json({
		success: true,
		data: {
			properties,
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
 * @desc    Get pending properties (admin)
 * @route   GET /api/properties/admin/pending
 * @access  Private (admin)
 */
const getPendingProperties = asyncHandler(async (req, res) => {
	const { page = 1, limit = 20 } = req.query;

	const query = { status: 'pending' };
	const skip = (Number(page) - 1) * Number(limit);

	const [properties, total] = await Promise.all([
		Property.find(query)
			.populate('ownerId', 'name email phoneNumber')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit)),
		Property.countDocuments(query),
	]);

	res.json({
		success: true,
		data: {
			properties,
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
 * @desc    Get rejected properties (admin)
 * @route   GET /api/properties/admin/rejected
 * @access  Private (admin)
 */
const getRejectedProperties = asyncHandler(async (req, res) => {
	const { page = 1, limit = 20 } = req.query;

	const query = { status: 'rejected' };
	const skip = (Number(page) - 1) * Number(limit);

	const [properties, total] = await Promise.all([
		Property.find(query)
			.populate('ownerId', 'name email phoneNumber')
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Number(limit)),
		Property.countDocuments(query),
	]);

	res.json({
		success: true,
		data: {
			properties,
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
 * @desc    Approve a property
 * @route   PUT /api/properties/:id/approve
 * @access  Private (admin)
 */
const approveProperty = asyncHandler(async (req, res) => {
	const property = await Property.findById(req.params.id);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	property.status = 'approved';
	property.isApproved = true;
	property.isResubmitted = false;
	property.rejectionReason = null;
	await property.save();

	// Notify owner
	await Notification.create({
		userId: property.ownerId,
		type: 'approval',
		title: 'Property Approved',
		body: `Your property "${property.title}" has been approved and is now live.`,
		data: { propertyId: property._id },
	});

	res.json({
		success: true,
		message: 'Property approved successfully',
		data: {
			property,
		},
	});
});

/**
 * @desc    Reject a property
 * @route   PUT /api/properties/:id/reject
 * @access  Private (admin)
 */
const rejectProperty = asyncHandler(async (req, res) => {
	const { reason } = req.body;

	const property = await Property.findById(req.params.id);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	property.status = 'rejected';
	property.isApproved = false;
	property.rejectionReason = reason || 'No reason provided';
	await property.save();

	// Notify owner
	await Notification.create({
		userId: property.ownerId,
		type: 'approval',
		title: 'Property Rejected',
		body: `Your property "${property.title}" has been rejected. Reason: ${property.rejectionReason}`,
		data: { propertyId: property._id },
	});

	res.json({
		success: true,
		message: 'Property rejected',
		data: {
			property,
		},
	});
});

/**
 * @desc    Resubmit a rejected property
 * @route   PUT /api/properties/:id/resubmit
 * @access  Private (owner)
 */
const resubmitProperty = asyncHandler(async (req, res) => {
	const property = await Property.findById(req.params.id);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	if (property.ownerId.toString() !== req.user._id.toString()) {
		throw new ApiError(403, 'Not authorized');
	}

	if (property.status !== 'rejected') {
		throw new ApiError(400, 'Only rejected properties can be resubmitted');
	}

	property.status = 'pending';
	property.isResubmitted = true;
	await property.save();

	// Notify admins
	const admins = await User.find({ role: 'admin' });
	for (const admin of admins) {
		await Notification.create({
			userId: admin._id,
			type: 'propertyUpdate',
			title: 'Property Resubmitted',
			body: `Property "${property.title}" has been resubmitted for review.`,
			data: { propertyId: property._id },
		});
	}

	res.json({
		success: true,
		message: 'Property resubmitted for review',
		data: {
			property,
		},
	});
});

/**
 * @desc    Increment property view count
 * @route   POST /api/properties/:id/view
 * @access  Public
 */
const incrementView = asyncHandler(async (req, res) => {
	const property = await Property.findByIdAndUpdate(
		req.params.id,
		{ $inc: { views: 1 } },
		{ new: true }
	);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	res.json({
		success: true,
		data: {
			views: property.views,
		},
	});
});

/**
 * @desc    Toggle property availability
 * @route   PATCH /api/properties/:id/availability
 * @access  Private (owner, admin)
 */
const toggleAvailability = asyncHandler(async (req, res) => {
	const property = await Property.findById(req.params.id);

	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	if (
		property.ownerId.toString() !== req.user._id.toString() &&
		req.user.role !== 'admin'
	) {
		throw new ApiError(403, 'Not authorized');
	}

	property.isAvailable = !property.isAvailable;
	await property.save();

	res.json({
		success: true,
		message: `Property is now ${property.isAvailable ? 'available' : 'unavailable'}`,
		data: {
			property,
		},
	});
});

module.exports = {
	getProperties,
	getPropertyById,
	createProperty,
	updateProperty,
	deleteProperty,
	getMyProperties,
	getPendingProperties,
	getRejectedProperties,
	approveProperty,
	rejectProperty,
	resubmitProperty,
	incrementView,
	toggleAvailability,
};
