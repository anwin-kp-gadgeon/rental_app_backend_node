const express = require('express');
const router = express.Router();
const { reviewController } = require('../controllers');
const { auth } = require('../middleware');
const { validateReview, validateReviewUpdate } = require('../validators/reviewValidator');

// Public routes
router.get('/property/:propertyId', reviewController.getPropertyReviews);
router.get('/user/:userId', reviewController.getUserReviews);

// Protected routes
router.use(auth);
router.post('/', validateReview, reviewController.createReview);
router.put('/:id', validateReviewUpdate, reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);
router.post('/:id/helpful', reviewController.markHelpful);

module.exports = router;
