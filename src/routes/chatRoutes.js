const express = require('express');
const router = express.Router();
const { chatController } = require('../controllers');
const { auth, authorize } = require('../middleware');

// All routes require authentication
router.use(auth);

router.get('/', chatController.getChats);
router.get('/unread-count', chatController.getUnreadCount);
router.get('/admin/support', authorize('admin'), chatController.getAdminSupportChats);
router.post('/', chatController.getOrCreateChat);
router.post('/support', chatController.getOrCreateSupportChat);

// Chat-specific routes
router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/messages', chatController.sendMessage);
router.delete('/:chatId/messages/:messageId', chatController.deleteMessage);
router.put('/:chatId/read', chatController.markAsRead);

module.exports = router;
