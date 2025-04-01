const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: String,
    message: String,
    videoUrl: String,
    userId: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
