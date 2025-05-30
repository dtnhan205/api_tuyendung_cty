const mongoose = require('mongoose');
const Job = require('../models/job');

// Hàm chuyển đổi định dạng ngày từ DD/MM/YYYY sang Date object
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
  }
  return new Date(dateStr);
};

// Lấy tất cả công việc
exports.getAllJobs = async (req, res) => {
  try {
    const jobList = await Job.find().sort({ 'Post-date': -1 });
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
      JobType,
      Name,
      Brands,
      Position,
      Workplace,
      Salary,
      Slot,
      'Post-date': PostDate,
      'Due date': DueDate,
      Degree,
      'Work Experience': WorkExperience,
      'Job Description': JobDescription,
      'Job Requirements': JobRequirements,
      Welfare,
      status,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    const requiredFields = [
      'JobType',
      'Name',
      'Position',
      'Workplace',
      'Salary',
      'Slot',
      'Post-date',
      'Due date',
      'Degree',
      'Work Experience',
      'Job Requirements',
      'Welfare',
    ];
    const missingFields = requiredFields.filter(field => !req.body[field] && req.body[field] !== 0);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Thiếu các trường bắt buộc',
        missingFields,
      });
    }

    // Chuyển đổi ngày
    const parsedPostDate = parseDate(PostDate);
    const parsedDueDate = parseDate(DueDate);
    if (!parsedPostDate || !parsedDueDate || isNaN(parsedPostDate.getTime()) || isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({ error: 'Ngày Post-date hoặc Due date không hợp lệ' });
    }

    // Kiểm tra Slot
    const parsedSlot = parseInt(Slot, 10);
    if (isNaN(parsedSlot) || parsedSlot < 0) {
      return res.status(400).json({ error: 'Slot phải là số không âm' });
    }

    // Xử lý các trường mảng
    const formattedBrands = Array.isArray(Brands) ? Brands : (Brands || '').split(',').map(b => b.trim()).filter(Boolean);
    const formattedJobDescription = Array.isArray(JobDescription) ? JobDescription : (JobDescription || '').split('\n').filter(Boolean);
    const formattedJobRequirements = Array.isArray(JobRequirements) ? JobRequirements : (JobRequirements || '').split('\n').filter(Boolean);
    const formattedWelfare = Array.isArray(Welfare) ? Welfare : (Welfare || '').split('\n').filter(Boolean);

    // Kiểm tra status
    if (status && !['show', 'hidden'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái phải là "show" hoặc "hidden"' });
    }

    // Tạo công việc mới
    const newJob = new Job({
      JobType,
      Name,
      Brands: formattedBrands,
      Position,
      Workplace,
      Salary,
      Slot: parsedSlot,
      'Post-date': parsedPostDate,
      'Due date': parsedDueDate,
      Degree,
      'Work Experience': WorkExperience,
      'Job Description': formattedJobDescription,
      'Job Requirements': formattedJobRequirements,
      Welfare: formattedWelfare,
      status: status || 'show',
    });

    const savedJob = await newJob.save();
    res.status(201).json({
      message: 'Tạo công việc thành công',
      job: savedJob,
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
      JobType,
      Name,
      Brands,
      Position,
      Workplace,
      Salary,
      Slot,
      'Post-date': PostDate,
      'Due date': DueDate,
      Degree,
      'Work Experience': WorkExperience,
      'Job Description': JobDescription,
      'Job Requirements': JobRequirements,
      Welfare,
      status,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID công việc không hợp lệ' });
    }

    const existingJob = await Job.findById(id);
    if (!existingJob) {
      return res.status(404).json({ error: 'Không tìm thấy công việc để cập nhật' });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {
      JobType: JobType !== undefined ? JobType : existingJob.JobType,
      Name: Name !== undefined ? Name : existingJob.Name,
      Brands: Brands !== undefined ? (Array.isArray(Brands) ? Brands : Brands.split(',').map(b => b.trim()).filter(Boolean)) : existingJob.Brands,
      Position: Position !== undefined ? Position : existingJob.Position,
      Workplace: Workplace !== undefined ? Workplace : existingJob.Workplace,
      Salary: Salary !== undefined ? Salary : existingJob.Salary,
      Slot: Slot !== undefined ? parseInt(Slot, 10) : existingJob.Slot,
      'Post-date': PostDate ? parseDate(PostDate) : existingJob['Post-date'],
      'Due date': DueDate ? parseDate(DueDate) : existingJob['Due date'],
      Degree: Degree !== undefined ? Degree : existingJob.Degree,
      'Work Experience': WorkExperience !== undefined ? WorkExperience : existingJob['Work Experience'],
      'Job Description': JobDescription !== undefined ? 
        (Array.isArray(JobDescription) ? JobDescription : (JobDescription || '').split('\n').filter(Boolean)) 
        : existingJob['Job Description'],
      'Job Requirements': JobRequirements !== undefined ? 
        (Array.isArray(JobRequirements) ? JobRequirements : (JobRequirements || '').split('\n').filter(Boolean)) 
        : existingJob['Job Requirements'],
      Welfare: Welfare !== undefined ? 
        (Array.isArray(Welfare) ? Welfare : (Welfare || '').split('\n').filter(Boolean)) 
        : existingJob.Welfare,
      status: status !== undefined ? status : existingJob.status,
    };

    // Kiểm tra các trường bắt buộc
    const requiredFields = [
      'JobType',
      'Name',
      'Position',
      'Workplace',
      'Salary',
      'Slot',
      'Post-date',
      'Due date',
      'Degree',
      'Work Experience',
      'Job Requirements',
      'Welfare',
    ];
    const missingFields = requiredFields.filter(field => !updateData[field] && updateData[field] !== 0);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Thiếu các trường bắt buộc',
        missingFields,
      });
    }

    // Kiểm tra định dạng ngày
    if (isNaN(updateData['Post-date'].getTime()) || isNaN(updateData['Due date'].getTime())) {
      return res.status(400).json({ error: 'Post-date hoặc Due date không hợp lệ' });
    }

    // Kiểm tra Slot
    if (isNaN(updateData.Slot) || updateData.Slot < 0) {
      return res.status(400).json({ error: 'Slot phải là số không âm' });
    }

    // Kiểm tra status
    if (updateData.status && !['show', 'hidden'].includes(updateData.status)) {
      return res.status(400).json({ error: 'Trạng thái phải là "show" hoặc "hidden"' });
    }

    // Cập nhật công việc
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID công việc không hợp lệ' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Không tìm thấy công việc' });
    }

    const newStatus = job.status === 'show' ? 'hidden' : 'show';
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: { status: newStatus } },
      { new: true, runValidators: true }
    );

    res.json({
      message: `Công việc đã được ${newStatus === 'show' ? 'hiển thị' : 'ẩn'}`,
      job: updatedJob,
    });
  } catch (err) {
    console.error('Lỗi toggleJobVisibility:', err);
    res.status(500).json({ error: 'Lỗi máy chủ', details: err.message });
  }
};