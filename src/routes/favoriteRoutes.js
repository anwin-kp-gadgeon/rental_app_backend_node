const express = require('express');
const router = express.Router();
const { favoriteController } = require('../controllers');
const { auth } = require('../middleware');

// All routes require authentication
router.use(auth);

router.get('/', favoriteController.getFavorites);
router.get('/ids', favoriteController.getFavoriteIds);
router.get('/check/:propertyId', favoriteController.checkFavorite);
router.post('/', favoriteController.addFavorite);
router.post('/toggle/:propertyId', favoriteController.toggleFavorite);
router.delete('/:propertyId', favoriteController.removeFavorite);

module.exports = router;
