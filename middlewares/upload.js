const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục public/images/ nếu chưa tồn tại
const imageUploadDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}

// Tạo thư mục public/cv/ nếu chưa tồn tại
const cvUploadDir = path.join(__dirname, '..', 'public', 'cv');
if (!fs.existsSync(cvUploadDir)) {
  fs.mkdirSync(cvUploadDir, { recursive: true });
  // Đặt quyền ghi cho thư mục (trên Windows/Linux)
  fs.chmodSync(cvUploadDir, 0o755); // Thử đặt quyền nếu cần
}

// Cấu hình lưu trữ file
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

// Bộ lọc file
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'resume') {
    // Chỉ cho phép file PDF cho resume
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file PDF cho CV!'), false);
    }
  } else {
    // Chỉ cho phép hình ảnh cho các field khác
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file ảnh (jpg, jpeg, png, gif, webp, svg)'), false);
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Tăng giới hạn lên 10MB để kiểm tra
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Lỗi upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
};