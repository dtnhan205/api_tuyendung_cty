const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  jobType: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  brands: { type: [String], trim: true },
  position: { type: String, required: true, trim: true },
  workplace: { type: String, required: true, trim: true },
  salary: { type: String, required: true, trim: true },
  slot: { type: Number, required: true, min: 0 },
  postDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  degree: { type: String, required: true, trim: true },
  workExperience: { type: String, required: true, trim: true },
  jobRequirements: { type: [String], required: true, trim: true },
  welfare: { type: [String], required: true, trim: true },
  status: { type: String, enum: ['hidden', 'show'], default: 'show' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Job', jobSchema);