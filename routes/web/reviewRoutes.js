const express = require('express');
const router = express.Router();
const { createReview, getReviews } = require('../../controllers/web/reviewController');
const { protect } = require('../../middleware/auth.middle');

router.route('/')
    .get(getReviews)
    .post(protect, createReview);

module.exports = router;
