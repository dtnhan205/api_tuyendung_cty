const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Lấy tất cả công việc
router.get('/', jobController.getAllJobs);

// Lấy công việc theo ID
router.get('/:id', jobController.getJobById);

// Tạo công việc mới
router.post('/', jobController.createJob);

// Cập nhật công việc
router.put('/:id', jobController.updateJob);

// Xóa công việc
router.delete('/:id', jobController.deleteJob);

// Chuyển đổi trạng thái hiển thị
router.put('/:id/toggle-visibility', jobController.toggleJobVisibility);

module.exports = router;