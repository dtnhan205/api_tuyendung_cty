const Profile = require('../models/profile');
const path = require('path');
const fs = require('fs');

// Lấy tất cả profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy profile theo jobId
exports.getProfileByJobId = async (req, res) => {
  try {
    const profiles = await Profile.find({ jobId: req.params.jobId });
    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy profile nào cho công việc này' });
    }
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy profiles theo status
exports.getProfilesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'reviewed', 'interview', 'accepted', 'rejected'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const profiles = await Profile.find({ status });
    if (profiles.length === 0) {
      return res.status(404).json({ message: `Không tìm thấy profile với trạng thái ${status}` });
    }

    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Tải file CV
exports.downloadCv = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }

    if (!profile.form.resume.url) {
      return res.status(404).json({ message: 'Profile này không có CV' });
    }

    const filePath = path.join(__dirname, '..', 'public', profile.form.resume.url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File CV không tồn tại trên server' });
    }

    res.download(filePath, profile.form.resume.name);
  } catch (error) {
    console.error('Lỗi tải CV:', error);
    res.status(500).json({ message: 'Lỗi server khi tải CV', error: error.message });
  }
};

// Tạo profile mới
exports.createProfile = async (req, res) => {
  try {
    
    const { jobId, jobName, jobWorkplace, form, status } = req.body;

    if (!jobId || !jobName || !jobWorkplace || !form) {
      return res.status(400).json({ message: 'Thiếu các trường bắt buộc: jobId, jobName, jobWorkplace, form' });
    }

    let parsedForm;
    if (typeof form === 'string') {
      parsedForm = JSON.parse(form);
    } else {
      parsedForm = form;
    }

    const { desiredWorkplace, fullName, phone, gender, dob, email, note } = parsedForm;
    if (!desiredWorkplace || !fullName || !phone || !gender || !dob || !email) {
      return res.status(400).json({ message: 'Thiếu các trường bắt buộc trong form' });
    }

    const cvFile = req.files && req.files['resume'] ? req.files['resume'][0] : null;
    if (!cvFile) {
      return res.status(400).json({ message: 'Không tìm thấy file CV' });
    }

    const resume = {
      name: cvFile.originalname,
      type: cvFile.mimetype,
      size: cvFile.size,
      url: `/cv/${cvFile.filename}`
    };

    if (status) {
      const validStatuses = ['pending', 'reviewed', 'interview', 'accepted', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      }
    }

    const profileData = {
      jobId,
      jobName,
      jobWorkplace,
      form: {
        desiredWorkplace,
        fullName,
        phone,
        gender,
        dob: new Date(dob),
        email,
        note: note || '',
        resume
      },
      status: status || 'pending',
      appliedAt: new Date()
    };

    const profile = new Profile(profileData);
    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    console.error('Lỗi tạo profile:', error);
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};

// Cập nhật profile
exports.updateProfile = async (req, res) => {
  try {
    const updateData = req.body;

    if (updateData.form && typeof updateData.form === 'string') {
      updateData.form = JSON.parse(updateData.form);
    }

    const cvFile = req.files && req.files['resume'] ? req.files['resume'][0] : null;
    if (cvFile) {
      updateData.form = updateData.form || {};
      updateData.form.resume = {
        name: cvFile.originalname,
        type: cvFile.mimetype,
        size: cvFile.size,
        url: `/cv/${cvFile.filename}`
      };
    }

    if (updateData.status) {
      const validStatuses = ['pending', 'reviewed', 'interview', 'accepted', 'rejected'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      }
    }

    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(400).json({ message: 'Dữ liệu không hợp lệ', error: error.message });
  }
};

// Xóa profile
exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }
    res.status(200).json({ message: 'Xóa profile thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Xóa mềm (chuyển status thành rejected)
exports.softDeleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }
    res.status(200).json({ message: 'Đã chuyển trạng thái profile thành rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};