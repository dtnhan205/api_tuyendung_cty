const Profile = require('../models/profile');

// Lấy tất cả profiles (không bao gồm profile ẩn)
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ hidden: false });
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy profile theo ID
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findOne({ id: req.params.id });
    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tạo profile mới
exports.createProfile = async (req, res) => {
  try {
    const profile = new Profile(req.body);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};

// Cập nhật profile
exports.updateProfile = async (req, res) => {
  try {
    const updateData = req.body;

    // Nếu status được gửi lên thì kiểm tra tính hợp lệ
    if (updateData.status) {
      const validStatuses = ['new', 'interview', 'recruitment', 'refuse'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      }
    }

    const profile = await Profile.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};


// Xóa (ẩn) profile
exports.softDeleteProfile = async (req, res) => {
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
};
