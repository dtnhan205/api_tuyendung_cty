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
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3801',
      'http://localhost:3001',
      'http://localhost:3002',
      // 'https://your-frontend.com', // Thay bằng domain frontend thực tế
      // 'https://<your-render-frontend>.onrender.com', // Thay bằng domain frontend trên Render
    ];

app.use(cors({
  origin: (origin, callback) => {
    console.log(`[${new Date().toISOString()}] Request Origin: ${origin}`);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 60000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
})
  .then(() => console.log('Kết nối MongoDB thành công'))
  .catch((err) => {
    console.error('Lỗi kết nối MongoDB:', err.message, err.stack);
    process.exit(1);
  });

mongoose.connection.on('connected', () => console.log('Mongoose đã kết nối với DB'));
mongoose.connection.on('error', (err) => console.error('Lỗi kết nối Mongoose:', err.message, err.stack));
mongoose.connection.on('disconnected', () => console.log('Mongoose đã ngắt kết nối'));

// Routes
app.use('/api/jobs', jobRouter);
app.use('/api/new', newsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);
app.use(express.static('public'));

// Health check endpoint (hữu ích cho host như Render)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Xử lý lỗi 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Tuyến đường không tồn tại' });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Lỗi server:`, err.message, err.stack);
  res.status(500).json({ message: 'Lỗi server', error: err.message });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind tất cả interface, phù hợp với host
app.listen(PORT, HOST, () => {
  console.log(`Server đang chạy tại http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Đang tắt server...');
  await mongoose.connection.close();
  console.log('Đã đóng kết nối Mongoose');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Nhận SIGTERM, đang tắt server...');
  await mongoose.connection.close();
  console.log('Đã đóng kết nối Mongoose');
  process.exit(0);
});