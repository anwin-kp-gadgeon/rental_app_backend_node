const express = require('express');
const router = express.Router();
const { viewingController } = require('../controllers');
const { auth, authorize } = require('../middleware');
const {
	validateViewing,
	validateViewingStatus,
} = require('../validators/viewingValidator');

// All routes require authentication
router.use(auth);

router.get('/user', viewingController.getUserViewings);
router.get('/owner', authorize('owner', 'admin'), viewingController.getOwnerViewings);
router.post('/', validateViewing, viewingController.createViewing);
router.put('/:id/status', validateViewingStatus, viewingController.updateViewingStatus);
router.delete('/:id', viewingController.deleteViewing);

module.exports = router;
