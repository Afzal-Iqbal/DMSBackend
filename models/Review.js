const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please add a rating between 1 and 5'],
        min: 1,
        max: 5
    },
    message: {
        type: String,
        required: [true, 'Please add a review message'],
        maxLength: 500
    },
    isApproved: {
        type: Boolean,
        default: true // Auto-approve for now, can be changed to false if moderation is needed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Review', reviewSchema);
