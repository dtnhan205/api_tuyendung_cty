const mongoose = require('mongoose');
const Banner = require('../models/banner');
const { upload, handleMulterError } = require('../middlewares/upload');
const fs = require('fs').promises;
const path = require('path');

// Lấy banner để hiển thị cho user
exports.getBannersForUser = async (req, res) => {
  try {
    const { page } = req.query;
    const validPages = ['home', 'about', 'new', 'job'];
    if (page && !validPages.includes(page)) {
      return res.status(400).json({ error: 'Trang không hợp lệ. Chỉ hỗ trợ: home, about, new, job' });
    }

    const query = { status: 'show' };
    if (page) query.page = page;

    // Chỉ lấy banner còn trong thời hạn
    const banners = await Banner.find({
      ...query,
      $or: [
        { 'expiration.type': 'unlimited' },
        {
          'expiration.type': 'limited',
          'expiration.start': { $lte: new Date() },
          'expiration.end': { $gte: new Date() },
        },
      ],
    }).sort({ createdAt: -1 });

    if (banners.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy banner nào' });
    }
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy banner', error: error.message });
  }
};

// Lấy tất cả banner (cho admin)
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    if (banners.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy banner nào' });
    }
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách banner', error: error.message });
  }
};

// Tạo banner mới (admin)
exports.createBanner = async (req, res) => {
  try {
    const { title, expiration, status, page } = req.body;
    const image = req.files && req.files['image'] ? `/images/${req.files['image'][0].filename}` : null;

    if (!image) {
      return res.status(400).json({ error: 'Vui lòng cung cấp file ảnh banner' });
    }

    if (!title || !page) {
      return res.status(400).json({ error: 'Tiêu đề và trang là bắt buộc' });
    }

    const validPages = ['home', 'about', 'new', 'job'];
    if (!validPages.includes(page)) {
      return res.status(400).json({ error: 'Trang không hợp lệ. Chỉ hỗ trợ: home, about, new, job' });
    }

    let parsedExpiration;
    try {
      parsedExpiration = JSON.parse(expiration || '{}');
      if (!parsedExpiration.type || (parsedExpiration.type === 'limited' && (!parsedExpiration.start || !parsedExpiration.end))) {
        return res.status(400).json({ error: 'Thông tin thời hạn không hợp lệ' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Dữ liệu expiration JSON không hợp lệ' });
    }

    const newId = new mongoose.Types.ObjectId().toString();
    const banner = new Banner({
      id: newId,
      title,
      image,
      expiration: parsedExpiration,
      status: status || 'show',
      page,
    });

    await banner.save();
    res.status(201).json({ message: 'Tạo banner thành công', banner });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'ID hoặc dữ liệu đã tồn tại' });
    }
    res.status(400).json({ error: error.message });
  }
};

// Cập nhật banner (admin)
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, expiration, status, page } = req.body;
    const image = req.files && req.files['image'] ? `/images/${req.files['image'][0].filename}` : req.body.image;

    if (!image) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đường dẫn hoặc file ảnh banner' });
    }

    const validPages = ['home', 'about', 'new', 'job'];
    if (page && !validPages.includes(page)) {
      return res.status(400).json({ error: 'Trang không hợp lệ. Chỉ hỗ trợ: home, about, new, job' });
    }

    let parsedExpiration;
    try {
      parsedExpiration = JSON.parse(expiration || '{}');
      if (!parsedExpiration.type || (parsedExpiration.type === 'limited' && (!parsedExpiration.start || !parsedExpiration.end))) {
        return res.status(400).json({ error: 'Thông tin thời hạn không hợp lệ' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Dữ liệu expiration JSON không hợp lệ' });
    }

    // Xóa file ảnh cũ nếu upload ảnh mới
    if (req.files && req.files['image']) {
      const oldBanner = await Banner.findOne({ id });
      if (oldBanner && oldBanner.image) {
        const oldImagePath = path.join(__dirname, '..', 'public', oldBanner.image);
        await fs.unlink(oldImagePath).catch(err => console.log('Không thể xóa file cũ:', err));
      }
    }

    const updatedBanner = await Banner.findOneAndUpdate(
      { id },
      { title, image, expiration: parsedExpiration, status, page },
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({ error: 'Không tìm thấy banner để cập nhật' });
    }
    res.json({ message: 'Cập nhật banner thành công', banner: updatedBanner });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Xóa banner (admin)
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findOne({ id });
    if (!banner) {
      return res.status(404).json({ message: 'Không tìm thấy banner để xóa' });
    }

    // Xóa file ảnh
    const imagePath = path.join(__dirname, '..', 'public', banner.image);
    await fs.unlink(imagePath).catch(err => console.log('Không thể xóa file ảnh:', err));

    await Banner.findOneAndDelete({ id });
    res.json({ message: 'Xóa banner thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi xóa banner' });
  }
};

// Chuyển đổi trạng thái hiển thị (admin)
exports.toggleBannerVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findOne({ id });
    if (!banner) {
      return res.status(404).json({ message: 'Không tìm thấy banner' });
    }

    banner.status = banner.status === 'show' ? 'hidden' : 'show';
    await banner.save();
    res.json({ message: `Banner đã được ${banner.status === 'show' ? 'hiển thị' : 'ẩn'}`, banner });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi thay đổi trạng thái' });
  }
};

// Middleware upload
exports.uploadMiddleware = [upload.fields([{ name: 'image', maxCount: 1 }]), handleMulterError];