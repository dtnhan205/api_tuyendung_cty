const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const upload = require('../middlewares/multerConfig'); 

// Middleware xác thực admin
const authAdmin = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findOne({ _id: decoded.id, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ message: 'Không có quyền admin' });
    }
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token không hợp lệ', error: error.message });
  }
};

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Lỗi upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

router.get('/', authAdmin, profileController.getAllProfiles);

router.get('/:id', authAdmin, profileController.getProfileById);
router.get('/job/:jobId', authAdmin, profileController.getProfileByJobId);

router.get('/status/:status', authAdmin, profileController.getProfilesByStatus);

router.get('/:id/cv', authAdmin, profileController.downloadCv);

router.post(
  '/',
  upload.fields([{ name: 'resume', maxCount: 1 }]),
  handleMulterError,
  profileController.createProfile
);

router.put(
  '/:id',
  authAdmin,
  upload.fields([{ name: 'resume', maxCount: 1 }]),
  handleMulterError,
  profileController.updateProfile
);

router.delete('/:id', authAdmin, profileController.deleteProfile);

router.put('/:id/reject', authAdmin, profileController.softDeleteProfile);

module.exports = router;