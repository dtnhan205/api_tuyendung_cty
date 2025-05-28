const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục public/images nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình bộ nhớ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // ✅ Fix: originalname (không phải originalName)
  },
});

// Kiểm tra loại file hợp lệ
const checkFile = (req, file, cb) => {
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
};

// Xuất multer config
module.exports = multer({
  storage,
  fileFilter: checkFile,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
