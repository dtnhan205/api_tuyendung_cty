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
    if (!jobType || !name || !position || !workplace || !salary || !slot || !postDate || !dueDate || !degree || !workExperience || !jobRequirements || !welfare) {
      return res.status(400).json({ error: 'Thiếu các trường bắt buộc' });
    }

    // Kiểm tra định dạng ngày
    const parsedPostDate = new Date(postDate);
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedPostDate) || isNaN(parsedDueDate)) {
      return res.status(400).json({ error: 'Ngày không hợp lệ' });
    }

    // Kiểm tra jobRequirements và welfare là mảng
    if (!Array.isArray(jobRequirements) || !Array.isArray(welfare)) {
      return res.status(400).json({ error: 'jobRequirements và welfare phải là mảng' });
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
    res.status(400).json({ error: err.message });
  }
};

// Cập nhật công việc theo ID
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

    // Kiểm tra jobRequirements và welfare là mảng nếu được cung cấp
    if (jobRequirements && !Array.isArray(jobRequirements)) {
      return res.status(400).json({ error: 'jobRequirements phải là mảng' });
    }
    if (welfare && !Array.isArray(welfare)) {
      return res.status(400).json({ error: 'welfare phải là mảng' });
    }

    // Kiểm tra định dạng ngày nếu được cung cấp
    let parsedPostDate, parsedDueDate;
    if (postDate) {
      parsedPostDate = new Date(postDate);
      if (isNaN(parsedPostDate)) {
        return res.status(400).json({ error: 'postDate không hợp lệ' });
      }
    }
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate)) {
        return res.status(400).json({ error: 'dueDate không hợp lệ' });
      }
    }

    const updateData = {};
    if (jobType) updateData.jobType = jobType;
    if (name) updateData.name = name;
    if (brands) updateData.brands = brands;
    if (position) updateData.position = position;
    if (workplace) updateData.workplace = workplace;
    if (salary) updateData.salary = salary;
    if (slot) updateData.slot = parseInt(slot, 10);
    if (postDate) updateData.postDate = parsedPostDate;
    if (dueDate) updateData.dueDate = parsedDueDate;
    if (degree) updateData.degree = degree;
    if (workExperience) updateData.workExperience = workExperience;
    if (jobRequirements) updateData.jobRequirements = jobRequirements;
    if (welfare) updateData.welfare = welfare;
    if (status) updateData.status = status;

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ error: 'Không tìm thấy công việc để cập nhật' });
    }

    res.json({
      message: 'Cập nhật công việc thành công',
      job: updatedJob,
    });
  } catch (err) {
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

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    // Chuyển đổi trạng thái
    job.status = job.status === 'show' ? 'hidden' : 'show';
    await job.save();

    // Trả về toàn bộ thông tin công việc
    res.json({
      message: `Công việc đã được ${job.status === 'show' ? 'hiển thị' : 'ẩn'}`,
      job: {
        id: job._id,
        jobType: job.jobType,
        name: job.name,
        brands: job.brands,
        position: job.position,
        workplace: job.workplace,
        salary: job.salary,
        slot: job.slot,
        postDate: job.postDate,
        dueDate: job.dueDate,
        degree: job.degree,
        workExperience: job.workExperience,
        jobRequirements: job.jobRequirements, // Đảm bảo trả về trường này
        welfare: job.welfare, // Đảm bảo trả về trường này
        status: job.status,
        createdAt: job.createdAt,
      },
    });
  } catch (err) {
    console.error('Lỗi toggleJobVisibility:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};