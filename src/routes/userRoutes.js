const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { auth, authorize } = require('../middleware');

// Public route to get user profile
router.get('/:id', userController.getUserById);

// Protected admin routes
router.use(auth);
router.use(authorize('admin'));

router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/toggle-active', userController.toggleUserActive);

module.exports = router;
