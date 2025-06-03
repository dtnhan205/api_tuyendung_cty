const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

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

router.get('/', bannerController.getBannersForUser);
router.get('/all', authAdmin, bannerController.getAllBanners);
router.post('/', authAdmin, bannerController.uploadMiddleware, bannerController.createBanner);
router.put('/:id', authAdmin, bannerController.uploadMiddleware, bannerController.updateBanner);
router.delete('/:id', authAdmin, bannerController.deleteBanner);
router.put('/:id/toggle-visibility', authAdmin, bannerController.toggleBannerVisibility);

module.exports = router;