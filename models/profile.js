const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^0\d{9}$/, 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0']
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    match: [/^\d{2}\/\d{2}\/\d{4}$/, 'Ngày phải có định dạng DD/MM/YYYY']
  },
  status: {
    type: String,
    required: true,
    enum: ['Đang chờ', 'Đã duyệt', 'Đã từ chối'],
    default: 'Đang chờ'
  },
  gender: {
    type: String,
    required: true,
    enum: ['Nam', 'Nữ', 'Khác']
  },
  birthdate: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải có định dạng YYYY-MM-DD']
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  education: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: String,
    required: true,
    trim: true
  },
  skills: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  hidden: {
    type: Boolean,
    default: false
  },
  cvUrl: {
    type: String,
    required: true,
    trim: true,
    match: [/^https?:\/\/[^\s$.?#].[^\s]*$/, 'URL CV không hợp lệ']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);