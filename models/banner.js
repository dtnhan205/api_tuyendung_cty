const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  image: { type: String, required: true, trim: true },
  expiration: {
    type: {
      type: String,
      enum: ['limited', 'unlimited'],
      required: true,
    },
    start: { type: Date, required: function () { return this.expiration.type === 'limited'; } },
    end: { type: Date, required: function () { return this.expiration.type === 'limited'; } },
  },
  status: { type: String, enum: ['show', 'hidden'], default: 'show' },
  page: { type: String, enum: ['home', 'about', 'new', 'job'], required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

bannerSchema.index({ page: 1, status: 1 });

module.exports = mongoose.model('Banner', bannerSchema);