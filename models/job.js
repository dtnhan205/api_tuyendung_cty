const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  JobType: { type: String, required: true, trim: true },
  Name: { type: String, required: true, trim: true },
  Brands: { type: [String], default: [] }, // Không bắt buộc, mặc định là mảng rỗng
  Position: { type: String, required: true, trim: true },
  Workplace: { type: String, required: true, trim: true },
  Salary: { type: String, required: true, trim: true },
  Slot: { type: Number, required: true, min: 0 },
  'Post-date': { type: Date, required: true },
  'Due date': { type: Date, required: true },
  Degree: { type: String, required: true, trim: true },
  'Work Experience': { type: String, required: true, trim: true },
  'Job Description': { type: [String], default: [] }, // Không bắt buộc, mặc định là mảng rỗng
  'Job Requirements': { type: [String], required: true },
  Welfare: { type: [String], required: true },
  status: { type: String, enum: ['show', 'hidden'], default: 'show' },
  createdAt: { type: Date, default: Date.now },
}, {
  // Đảm bảo tên trường trong JSON được giữ nguyên
  toJSON: { transform: (doc, ret) => ret },
  toObject: { transform: (doc, ret) => ret },
});

// Validator để đảm bảo Due date sau Post-date
jobSchema.pre('validate', function(next) {
  if (this['Due date'] <= this['Post-date']) {
    next(new Error('Hạn nộp (Due date) phải sau ngày đăng (Post-date)'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Job', jobSchema);