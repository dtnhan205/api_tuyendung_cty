const mongoose = require('mongoose');
const Job = require('../models/job');

// Lấy tất cả công việc
exports.getAllJobs = async (req, res) => {
  try {
    const jobList = await Job.find().sort({ postDate: -1 });
    if (jobList.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy công việc nào' });
    }
    res.json(jobList);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách công việc', error: error.message });
  }
};

// Lấy công việc theo ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy công việc', error: error.message });
  }
};

// Tạo công việc mới
exports.createJob = async (req, res) => {
  try {
    const {
      jobType,
      name,
      brands,
      position,
      workplace,
      salary,
      slot,
      postDate,
      dueDate,
      degree,
      workExperience,
      jobRequirements,
      welfare,
      status,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    const requiredFields = [
      'jobType',
      'name',
      'position',
      'workplace',
      'salary',
      'slot',
      'postDate',
      'dueDate',
      'degree',
      'workExperience',
      'jobRequirements',
      'welfare',
    ];
    const missingFields = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Thiếu các trường bắt buộc',
        missingFields,
      });
    }

    // Kiểm tra định dạng ngày
    const parsedPostDate = new Date(postDate);
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedPostDate) || isNaN(parsedDueDate)) {
      return res.status(400).json({ error: 'Ngày postDate hoặc dueDate không hợp lệ' });
    }

    // Kiểm tra jobRequirements và welfare là mảng
    if (!Array.isArray(jobRequirements) || !Array.isArray(welfare)) {
      return res.status(400).json({ error: 'jobRequirements và welfare phải là mảng' });
    }

    // Kiểm tra slot là số hợp lệ
    if (isNaN(slot) || parseInt(slot, 10) < 0) {
      return res.status(400).json({ error: 'slot phải là số không âm' });
    }

    const newJob = new Job({
      jobType,
      name,
      brands: brands || [],
      position,
      workplace,
      salary,
      slot: parseInt(slot, 10),
      postDate: parsedPostDate,
      dueDate: parsedDueDate,
      degree,
      workExperience,
      jobRequirements,
      welfare,
      status: status || 'show',
    });

    await newJob.save();
    res.status(201).json({
      message: 'Tạo công việc thành công',
      job: newJob,
    });
  } catch (err) {
    console.error('Lỗi tạo công việc:', err);
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật công việc
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      jobType,
      name,
      brands,
      position,
      workplace,
      salary,
      slot,
      postDate,
      dueDate,
      degree,
      workExperience,
      jobRequirements,
      welfare,
      status,
    } = req.body;

    // Kiểm tra định dạng ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID công việc không hợp lệ' });
    }

    // Kiểm tra công việc tồn tại
    const existingJob = await Job.findById(id);
    if (!existingJob) {
      return res.status(404).json({ error: 'Không tìm thấy công việc để cập nhật' });
    }

    // Kiểm tra các trường bắt buộc
    const requiredFields = [
      'jobType',
      'name',
      'position',
      'workplace',
      'salary',
      'slot',
      'postDate',
      'dueDate',
      'degree',
      'workExperience',
      'jobRequirements',
      'welfare',
    ];
    const updateData = {
      jobType: jobType || existingJob.jobType,
      name: name || existingJob.name,
      position: position || existingJob.position,
      workplace: workplace || existingJob.workplace,
      salary: salary || existingJob.salary,
      slot: slot !== undefined ? parseInt(slot, 10) : existingJob.slot,
      postDate: postDate ? new Date(postDate) : existingJob.postDate,
      dueDate: dueDate ? new Date(dueDate) : existingJob.dueDate,
      degree: degree || existingJob.degree,
      workExperience: workExperience || existingJob.workExperience,
      jobRequirements: jobRequirements || existingJob.jobRequirements,
      welfare: welfare || existingJob.welfare,
      brands: brands || existingJob.brands,
      status: status || existingJob.status,
    };

    // Kiểm tra các trường bắt buộc trong updateData
    const missingFields = requiredFields.filter(field => updateData[field] === undefined || updateData[field] === null);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Thiếu các trường bắt buộc',
        missingFields,
      });
    }

    // Kiểm tra định dạng ngày
    if (isNaN(updateData.postDate) || isNaN(updateData.dueDate)) {
      return res.status(400).json({ error: 'postDate hoặc dueDate không hợp lệ' });
    }

    // Kiểm tra jobRequirements và welfare là mảng
    if (!Array.isArray(updateData.jobRequirements) || !Array.isArray(updateData.welfare)) {
      return res.status(400).json({ error: 'jobRequirements và welfare phải là mảng' });
    }

    // Kiểm tra slot là số hợp lệ
    if (isNaN(updateData.slot) || updateData.slot < 0) {
      return res.status(400).json({ error: 'slot phải là số không âm' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Cập nhật công việc thành công',
      job: updatedJob,
    });
  } catch (err) {
    console.error('Lỗi cập nhật công việc:', err);
    res.status(400).json({ error: err.message });
  }
};

// Xóa công việc theo ID
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedJob = await Job.findByIdAndDelete(id);
    if (!deletedJob) {
      return res.status(404).json({ message: 'Không tìm thấy công việc để xóa' });
    }
    res.json({ message: 'Xóa công việc thành công' });
  } catch (err) {
    console.error('Lỗi xóa công việc:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// Chuyển đổi trạng thái hiển thị công việc
exports.toggleJobVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra định dạng ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID công việc không hợp lệ' });
    }

    // Tìm công việc để kiểm tra sự tồn tại
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    // Chuyển đổi trạng thái và cập nhật trực tiếp
    const newStatus = job.status === 'show' ? 'hidden' : 'show';
    await Job.updateOne(
      { _id: id },
      { $set: { status: newStatus } }
    );

    // Lấy lại thông tin công việc sau khi cập nhật
    const updatedJob = await Job.findById(id);

    // Trả về toàn bộ thông tin công việc
    res.json({
      message: `Công việc đã được ${newStatus === 'show' ? 'hiển thị' : 'ẩn'}`,
      job: {
        id: updatedJob._id,
        jobType: updatedJob.jobType,
        name: updatedJob.name,
        brands: updatedJob.brands,
        position: updatedJob.position,
        workplace: updatedJob.workplace,
        salary: updatedJob.salary,
        slot: updatedJob.slot,
        postDate: updatedJob.postDate,
        dueDate: updatedJob.dueDate,
        degree: updatedJob.degree,
        workExperience: updatedJob.workExperience,
        jobRequirements: updatedJob.jobRequirements,
        welfare: updatedJob.welfare,
        status: updatedJob.status,
        createdAt: updatedJob.createdAt,
      },
    });
  } catch (err) {
    console.error('Lỗi toggleJobVisibility:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

module.exports = {
  getAllJobs: exports.getAllJobs,
  getJobById: exports.getJobById,
  createJob: exports.createJob,
  updateJob: exports.updateJob,
  deleteJob: exports.deleteJob,
  toggleJobVisibility: exports.toggleJobVisibility,
};