const express = require('express');
const router = express.Router();
const Profile = require('../models/profile');

// Lấy tất cả profiles (không bao gồm profile ẩn)
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find({ hidden: false });
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Lấy profile theo ID
router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: req.params.id });
    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Tạo profile mới
router.post('/', async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
  }
});

// Cập nhật profile
router.put('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
  }
});

// Xóa profile (ẩn profile thay vì xóa cứng)
router.delete('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { id: req.params.id },
      { hidden: true },
      { new: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }
    res.status(200).json({ message: 'Đã ẩn profile thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;