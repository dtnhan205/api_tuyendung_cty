const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục public/images nếu chưa tồn tại
const imageUploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}

// Tạo thư mục public/cv nếu chưa tồn tại
const cvUploadDir = path.join(__dirname, '../public/cv');
if (!fs.existsSync(cvUploadDir)) {
  fs.mkdirSync(cvUploadDir, { recursive: true });
  fs.chmodSync(cvUploadDir, 0o755); // Đặt quyền ghi cho thư mục
}

// Cấu hình bộ nhớ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      cb(null, cvUploadDir); // Lưu file PDF vào public/cv/
    } else {
      cb(null, imageUploadDir); // Lưu hình ảnh vào public/images/
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Kiểm tra loại file hợp lệ
const checkFile = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    // Chỉ cho phép file PDF cho resume
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file PDF cho CV!'), false);
    }
  } else {
    // Chỉ cho phép hình ảnh cho các field khác
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    const extname = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file ảnh (jpg, jpeg, png, gif, webp, svg)'));
    }
  }
};

// Xuất multer config
module.exports = multer({
  storage,
  fileFilter: checkFile,
  limits: { fileSize: 10 * 1024 * 1024 }, // Tăng lên 10MB để tránh lỗi kích thước
});