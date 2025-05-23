const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  jobType: { type: String, required: true, trim: true }, // Ví dụ: "OFFICE WORK"
  name: { type: String, required: true, trim: true }, // Tên công việc
  brands: { type: String, trim: true }, // Các thương hiệu
  workplace: { type: String, required: true, trim: true }, // Nơi làm việc
  salary: { type: String, required: true, trim: true }, // Mức lương
  slot: { type: Number, required: true, min: 0 }, // Số lượng slot
  postDate: { type: Date, required: true }, // Ngày đăng
  dueDate: { type: Date, required: true }, // Ngày hết hạn
  degree: { type: String, required: true, trim: true }, // Bằng cấp
  workExperience: { type: String, required: true, trim: true }, // Kinh nghiệm làm việc
  jobDescription: { type: String, required: true, trim: true }, // Mô tả công việc
  welfare: { type: String, required: true, trim: true }, // Phúc lợi
  status: { type: String, enum: ['hidden', 'show'], default: 'show' }, // Trạng thái hiển thị
  createdAt: { type: Date, default: Date.now }, // Thời gian tạo
});

module.exports = mongoose.model('Job', jobSchema);