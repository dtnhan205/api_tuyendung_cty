const mongoose = require('mongoose');
const validator = require('validator');

const profileSchema = new mongoose.Schema({
  jobId: { type: String, required: true, trim: true },
  jobName: { type: String, required: true, trim: true },
  jobWorkplace: { type: String, required: true, trim: true },
  form: {
    desiredWorkplace: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{10,11}$/.test(v); 
        },
        message: 'Số điện thoại không hợp lệ (phải có 10-11 chữ số)'
      }
    },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], required: true },
    dob: { type: Date, required: true },
    email: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: 'Email không hợp lệ'
      }
    },
    note: { type: String, trim: true, default: '' },
    resume: {
      name: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true, min: 0 },
      url: { type: String, required: true, trim: true } 
    }
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'interview', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tự động cập nhật updatedAt trước khi lưu
profileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Tự động cập nhật updatedAt trước khi cập nhật
profileSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Profile', profileSchema);