const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  thumbnailUrl: { type: String, required: true, trim: true },
  thumbnailCaption: { type: String, required: true, trim: true },
  publishedAt: { type: Date, required: true },
  views: { type: Number, default: 0, min: 0 },
  rating: {
    score: { type: Number, default: 0.0, min: 0.0, max: 5.0 },
    votes: { type: Number, default: 0, min: 0 },
  },
  status: { type: String, enum: ['hidden', 'show'], default: 'show' }, // Đã có
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('News', newsSchema);