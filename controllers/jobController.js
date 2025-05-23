const mongoose = require('mongoose');
const Job = require('../models/job');

// Get all jobs (chỉ lấy công việc có status: 'show')
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'show' });
    if (!jobs.length) {
      return res.status(404).json({ message: 'Không tìm thấy công việc nào' });
    }
    res.json(jobs);
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await Job.findOne({ _id: id, status: 'show' });
    if (!job) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }
    res.json(job);
  } catch (err) {
    console.error(`GET /api/jobs/${id} error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const {
      jobType,
      name,
      brands,
      workplace,
      salary,
      slot,
      postDate,
      dueDate,
      degree,
      workExperience,
      jobDescription,
      welfare,
      status,
    } = req.body;

    const newJob = new Job({
      jobType,
      name,
      brands,
      workplace,
      salary,
      slot,
      postDate: new Date(postDate),
      dueDate: new Date(dueDate),
      degree,
      workExperience,
      jobDescription,
      welfare,
      status: status || 'show', // Mặc định là 'show' nếu không được cung cấp
    });

    await newJob.save();
    res.status(201).json({
      message: 'Tạo công việc thành công',
      job: newJob,
    });
  } catch (err) {
    console.error('POST /api/jobs error:', err);
    res.status(400).json({ error: err.message });
  }
};

// Update a job by ID
exports.updateJob = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      {
        jobType: req.body.jobType,
        name: req.body.name,
        brands: req.body.brands,
        workplace: req.body.workplace,
        salary: req.body.salary,
        slot: req.body.slot,
        postDate: req.body.postDate ? new Date(req.body.postDate) : undefined,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        degree: req.body.degree,
        workExperience: req.body.workExperience,
        jobDescription: req.body.jobDescription,
        welfare: req.body.welfare,
        status: req.body.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Không tìm thấy công việc để cập nhật' });
    }

    res.json({
      message: 'Cập nhật công việc thành công',
      job: updatedJob,
    });
  } catch (err) {
    console.error(`PUT /api/jobs/${id} error:`, err);
    res.status(400).json({ error: err.message });
  }
};

// Delete a job by ID
exports.deleteJob = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedJob = await Job.findByIdAndDelete(id);
    if (!deletedJob) {
      return res.status(404).json({ message: 'Không tìm thấy công việc để xóa' });
    }
    res.json({ message: 'Xóa công việc thành công' });
  } catch (err) {
    console.error(`DELETE /api/jobs/${id} error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// Toggle job visibility (Chuyển đổi giữa hidden và show)
exports.toggleJobVisibility = async (req, res) => {
  const { id } = req.params;

  try {
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    job.status = job.status === 'show' ? 'hidden' : 'show';
    await job.save();

    res.json({
      message: `Công việc đã được ${job.status === 'show' ? 'hiển thị' : 'ẩn'}`,
      job,
    });
  } catch (err) {
    console.error(`PUT /api/jobs/${id}/toggle-visibility error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};