const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newController');

// Lấy tất cả tin tức
router.get('/', newsController.getAllNews);

// Lấy tin tức theo ID
router.get('/:id', newsController.getNewsById);

// Tạo tin tức mới
router.post('/', newsController.createNews);

// Cập nhật tin tức
router.put('/:id', newsController.updateNews);

// Xóa tin tức
router.delete('/:id', newsController.deleteNews);

// Chuyển đổi trạng thái hiển thị
router.put('/:id/toggle-visibility', newsController.toggleNewsVisibility);

module.exports = router;