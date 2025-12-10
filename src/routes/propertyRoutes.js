const express = require('express');
const router = express.Router();
const { propertyController } = require('../controllers');
const { auth, authorize } = require('../middleware');
const {
	validateProperty,
	validatePropertyUpdate,
} = require('../validators/propertyValidator');

// Public routes
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getPropertyById);
router.post('/:id/view', propertyController.incrementView);

// Protected routes (must be logged in)
router.use(auth);

// Owner routes
router.get('/owner/my-properties', propertyController.getMyProperties);
router.post(
	'/',
	authorize('owner', 'admin'),
	validateProperty,
	propertyController.createProperty
);
router.put(
	'/:id',
	authorize('owner', 'admin'),
	validatePropertyUpdate,
	propertyController.updateProperty
);
router.delete('/:id', authorize('owner', 'admin'), propertyController.deleteProperty);
router.put(
	'/:id/resubmit',
	authorize('owner', 'admin'),
	propertyController.resubmitProperty
);
router.patch(
	'/:id/availability',
	authorize('owner', 'admin'),
	propertyController.toggleAvailability
);

// Admin routes
router.get('/admin/pending', authorize('admin'), propertyController.getPendingProperties);
router.get(
	'/admin/rejected',
	authorize('admin'),
	propertyController.getRejectedProperties
);
router.put('/:id/approve', authorize('admin'), propertyController.approveProperty);
router.put('/:id/reject', authorize('admin'), propertyController.rejectProperty);

module.exports = router;
