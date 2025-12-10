const { Viewing, Property, User, Notification } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get user's viewing requests
 * @route   GET /api/viewings/user
 * @access  Private
 */
const getUserViewings = asyncHandler(async (req, res) => {
	const { status, page = 1, limit = 20 } = req.query;

	const query = { userId: req.user._id };
	if (status) {
		query.status = status;
	}

	const skip = (Number(page) - 1) * Number(limit);

	const [viewings, total] = await Promise.all([
		Viewing.find(query)
			.populate('propertyId', 'title images location price')
			.populate('ownerId', 'name email phoneNumber photoUrl')
			.sort({ date: -1 })
			.skip(skip)
			.limit(Number(limit)),
		Viewing.countDocuments(query),
	]);

	res.json({
		success: true,
		data: {
			viewings,
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
 * @desc    Get owner's viewing requests (for their properties)
 * @route   GET /api/viewings/owner
 * @access  Private (owner)
 */
const getOwnerViewings = asyncHandler(async (req, res) => {
	const { status, page = 1, limit = 20 } = req.query;

	const query = { ownerId: req.user._id };
	if (status) {
		query.status = status;
	}

	const skip = (Number(page) - 1) * Number(limit);

	const [viewings, total] = await Promise.all([
		Viewing.find(query)
			.populate('propertyId', 'title images location price')
			.populate('userId', 'name email phoneNumber photoUrl')
			.sort({ date: -1 })
			.skip(skip)
			.limit(Number(limit)),
		Viewing.countDocuments(query),
	]);

	res.json({
		success: true,
		data: {
			viewings,
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
 * @desc    Create a viewing request
 * @route   POST /api/viewings
 * @access  Private
 */
const createViewing = asyncHandler(async (req, res) => {
	const { propertyId, date, note } = req.body;

	// Check if property exists
	const property = await Property.findById(propertyId);
	if (!property) {
		throw new ApiError(404, 'Property not found');
	}

	// Prevent owners from requesting viewing of their own property
	if (property.ownerId.toString() === req.user._id.toString()) {
		throw new ApiError(400, 'You cannot request a viewing for your own property');
	}

	// Check for existing pending viewing
	const existingViewing = await Viewing.findOne({
		propertyId,
		userId: req.user._id,
		status: 'pending',
	});

	if (existingViewing) {
		throw new ApiError(
			400,
			'You already have a pending viewing request for this property'
		);
	}

	const viewing = await Viewing.create({
		propertyId,
		userId: req.user._id,
		ownerId: property.ownerId,
		date: new Date(date),
		note,
	});

	// Notify property owner
	await Notification.create({
		userId: property.ownerId,
		type: 'viewing',
		title: 'New Viewing Request',
		body: `${req.user.name} has requested a viewing for "${property.title}".`,
		data: { propertyId, viewingId: viewing._id },
	});

	await viewing.populate('propertyId', 'title images location');

	res.status(201).json({
		success: true,
		message: 'Viewing request created successfully',
		data: {
			viewing,
		},
	});
});

/**
 * @desc    Update viewing status
 * @route   PUT /api/viewings/:id/status
 * @access  Private
 */
const updateViewingStatus = asyncHandler(async (req, res) => {
	const { status, cancelReason } = req.body;

	const viewing = await Viewing.findById(req.params.id).populate('propertyId', 'title');

	if (!viewing) {
		throw new ApiError(404, 'Viewing not found');
	}

	// Check authorization
	const isOwner = viewing.ownerId.toString() === req.user._id.toString();
	const isUser = viewing.userId.toString() === req.user._id.toString();
	const isAdmin = req.user.role === 'admin';

	// Users can only cancel their own requests
	if (status === 'cancelled' && !isUser && !isAdmin) {
		throw new ApiError(403, 'Not authorized to cancel this viewing');
	}

	// Only owners can confirm/reject
	if (['confirmed', 'rejected', 'completed'].includes(status) && !isOwner && !isAdmin) {
		throw new ApiError(403, 'Not authorized to update this viewing');
	}

	viewing.status = status;
	if (cancelReason) {
		viewing.cancelReason = cancelReason;
	}
	await viewing.save();

	// Send notifications
	if (status === 'confirmed') {
		await Notification.create({
			userId: viewing.userId,
			type: 'viewing',
			title: 'Viewing Confirmed',
			body: `Your viewing request for "${viewing.propertyId.title}" has been confirmed.`,
			data: { viewingId: viewing._id },
		});
	} else if (status === 'rejected') {
		await Notification.create({
			userId: viewing.userId,
			type: 'viewing',
			title: 'Viewing Rejected',
			body: `Your viewing request for "${viewing.propertyId.title}" has been rejected.`,
			data: { viewingId: viewing._id },
		});
	} else if (status === 'cancelled') {
		await Notification.create({
			userId: viewing.ownerId,
			type: 'viewing',
			title: 'Viewing Cancelled',
			body: `A viewing request for "${viewing.propertyId.title}" has been cancelled.`,
			data: { viewingId: viewing._id },
		});
	}

	res.json({
		success: true,
		message: `Viewing ${status}`,
		data: {
			viewing,
		},
	});
});

/**
 * @desc    Delete a viewing
 * @route   DELETE /api/viewings/:id
 * @access  Private
 */
const deleteViewing = asyncHandler(async (req, res) => {
	const viewing = await Viewing.findById(req.params.id);

	if (!viewing) {
		throw new ApiError(404, 'Viewing not found');
	}

	const isUser = viewing.userId.toString() === req.user._id.toString();
	const isAdmin = req.user.role === 'admin';

	if (!isUser && !isAdmin) {
		throw new ApiError(403, 'Not authorized to delete this viewing');
	}

	await Viewing.findByIdAndDelete(req.params.id);

	res.json({
		success: true,
		message: 'Viewing deleted successfully',
	});
});

module.exports = {
	getUserViewings,
	getOwnerViewings,
	createViewing,
	updateViewingStatus,
	deleteViewing,
};
