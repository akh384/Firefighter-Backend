const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    message: { type: String, required: true },
    videoUrl: { type: String, required: true },
    userId: { type: String, required: true },
    approved: { type: Boolean, default: false }  // New field, defaulting to false
});

module.exports = mongoose.model("Testimonial", testimonialSchema);
