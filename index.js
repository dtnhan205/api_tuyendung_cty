const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jobRouter = require('./routes/jobRouter');
const newsRouter = require('./routes/newRouter');
const profileRouter = require('./routes/profileRouter');
const adminRouter = require('./routes/adminRouter');
const upload = require('./middlewares/multerConfig');
require('dotenv').config();

const app = express();

// Cấu hình CORS
// Cấu hình CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3801',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://172.16.0.2:3000',
      'http://192.168.1.50:3000',
      // Thêm các domain thực tế của frontend khi triển khai
      // 'https://your-frontend.com',
      // 'https://<your-render-frontend>.onrender.com',
    ];

app.use(cors({
  origin: (origin, callback) => {
    console.log(`[${new Date().toISOString()}] Request Origin: ${origin}`);
    // Cho phép tất cả origin trong môi trường phát triển để dễ debug
    if (process.env.NODE_ENV === 'development' || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Không được phép bởi CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Parse JSON body
app.use(express.json());

// Middleware ghi log yêu cầu
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Kiểm tra biến môi trường bắt buộc
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`Lỗi: Biến môi trường ${env} không được định nghĩa trong .env`);
    process.exit(1);
  }
}

// Tối ưu hóa kết nối MongoDB
const mongooseOptions = {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  // Thêm các tùy chọn để tăng tính ổn định khi triển khai
  maxPoolSize: 10, // Giới hạn số kết nối đồng thời
  minPoolSize: 2,  // Duy trì tối thiểu 2 kết nối
  retryWrites: true, // Thử lại các thao tác ghi nếu gặp lỗi
  retryReads: true,  // Thử lại các thao tác đọc nếu gặp lỗi
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => console.log('Kết nối MongoDB thành công'))
  .catch((err) => {
    console.error('Lỗi kết nối MongoDB:', err.message, err.stack);
    process.exit(1);
  });

mongoose.connection.on('connected', () => console.log('Mongoose đã kết nối với DB'));
mongoose.connection.on('error', (err) => console.error('Lỗi kết nối Mongoose:', err.message, err.stack));
mongoose.connection.on('disconnected', () => console.log('Mongoose đã ngắt kết nối'));

// Routes
app.use('/api/job', jobRouter);
app.use('/api/new', newsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);
app.use(express.static('public'));

// Health check endpoint (rất quan trọng khi triển khai trên hosting)
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
  };
  res.status(200).json(healthStatus);
});

// Xử lý lỗi 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Tuyến đường không tồn tại' });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Lỗi server:`, err.message, err.stack);
  // Chỉ gửi chi tiết lỗi trong môi trường phát triển
  const errorResponse = process.env.NODE_ENV === 'development'
    ? { message: 'Lỗi server', error: err.message, stack: err.stack }
    : { message: 'Lỗi server' };
  res.status(500).json(errorResponse);
});

// Khởi động server
const PORT = process.env.PORT || 3000; // Sử dụng port từ hosting hoặc mặc định 3000
const HOST = process.env.HOST || '0.0.0.0'; // Bind tất cả interface, phù hợp với hosting
app.listen(PORT, HOST, () => {
  console.log(`Server đang chạy tại http://${HOST}:${PORT}`);
  console.log(`Môi trường: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Nhận ${signal}, đang tắt server...`);
  try {
    await mongoose.connection.close();
    console.log('Đã đóng kết nối Mongoose');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi đóng kết nối:', err.message, err.stack);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Xử lý lỗi uncaughtException để tránh crash ứng dụng
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, err.message, err.stack);
});

// Xử lý lỗi unhandledRejection
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
});