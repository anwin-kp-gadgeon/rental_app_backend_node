const express = require('express');
const router = express.Router();
const { notificationController } = require('../controllers');
const { auth, authorize } = require('../middleware');

// All routes require authentication
router.use(auth);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/', notificationController.deleteAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

// Admin only
router.post('/', authorize('admin'), notificationController.createNotification);

module.exports = router;
