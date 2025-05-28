const mongoose = require('mongoose');
const News = require('../models/news');
const validator = require('validator');
const multer = require('multer');
const upload = require('../middlewares/multerConfig');

// Middleware xử lý lỗi upload (bạn có thể để riêng nếu muốn)
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Lỗi upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

exports.getAllNews = async (req, res) => {
  try {
    const newsList = await News.find().sort({ publishedAt: -1 });
    if (newsList.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy tin tức nào" });
    }
    res.json(newsList);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy tin tức', error: error.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findOne({ id: req.params.id });
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    }
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy tin tức', error: error.message });
  }
};

// Create a new news
exports.createNews = async (req, res) => {
  try {
    const {
      id,
      title,
      slug,
      thumbnailCaption,
      publishedAt,
      views,
      status,
      contentBlocks: rawContentBlocks,
    } = req.body;

    // ✅ Lấy file thumbnail đã upload
    const thumbnailUrl = req.file ? `/images/${req.file.filename}` : null;

    // ⚠️ Kiểm tra bắt buộc
    if (!id || !thumbnailUrl) {
      return res.status(400).json({ error: 'Thiếu id hoặc thumbnail ảnh' });
    }

    // Parse contentBlocks nếu là JSON string
    let contentBlocks = rawContentBlocks;
    if (typeof rawContentBlocks === 'string') {
      try {
        contentBlocks = JSON.parse(rawContentBlocks);
      } catch (e) {
        return res.status(400).json({ error: 'contentBlocks JSON không hợp lệ' });
      }
    }

    // Validate contentBlocks
    if (!Array.isArray(contentBlocks)) contentBlocks = [];

    for (const block of contentBlocks) {
      if (block.type === 'text' && (!block.content || typeof block.content !== 'string')) {
        return res.status(400).json({ error: 'Nội dung văn bản không hợp lệ' });
      } else if (block.type === 'image' && (!block.url || typeof block.url !== 'string')) {
        return res.status(400).json({ error: 'URL ảnh không hợp lệ' });
      } else if (!['text', 'image'].includes(block.type)) {
        return res.status(400).json({ error: 'Loại khối nội dung không hợp lệ' });
      }
    }

    const newNews = new News({
      id,
      title,
      slug,
      thumbnailUrl, // ✅ Lấy từ file upload
      thumbnailCaption,
      publishedAt: new Date(publishedAt),
      views: parseInt(views, 10) || 0,
      rating: rating ? (typeof rating === 'string' ? JSON.parse(rating) : rating) : { score: 0.0, votes: 0 },
      status: status || 'show',
      contentBlocks,
    });

    await newNews.save();
    res.status(201).json({
      message: 'Tạo tin tức thành công',
      news: newNews,
    });
  } catch (err) {
    console.error('POST /api/news error:', err);
    res.status(400).json({ error: err.message });
  }
};


// Update a news by ID
exports.updateNews = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    slug,
    thumbnailUrl,
    thumbnailCaption,
    publishedAt,
    views,
    rating,
    status,
    contentBlocks: rawContentBlocks,
  } = req.body;

  try {
    let contentBlocks = typeof rawContentBlocks === 'string' ? JSON.parse(rawContentBlocks) : rawContentBlocks;

    // Validate
    if (!Array.isArray(contentBlocks)) contentBlocks = [];
    for (const block of contentBlocks) {
      if (block.type === 'text' && (!block.content || typeof block.content !== 'string')) {
        return res.status(400).json({ error: 'Nội dung văn bản không hợp lệ' });
      } else if (block.type === 'image' && (!block.url || typeof block.url !== 'string')) {
        return res.status(400).json({ error: 'URL ảnh không hợp lệ' });
      } else if (!['text', 'image'].includes(block.type)) {
        return res.status(400).json({ error: 'Loại khối nội dung không hợp lệ' });
      }
    }

    // Upload mới
    const uploadedImages = (req.files || []).map(file => ({
      type: 'image',
      url: `/images/${file.filename}`,
      caption: '',
    }));

    // Kết hợp contentBlocks cũ và ảnh mới (nếu block image chưa có url thì thay thế)
    let imageIndex = 0;
    const finalContentBlocks = contentBlocks.map(block => {
      if (block.type === 'image') {
        if (block.url) return block;
        if (imageIndex < uploadedImages.length) return uploadedImages[imageIndex++];
      }
      return block;
    });

    // Thêm các ảnh dư chưa được gắn vào block nào
    while (imageIndex < uploadedImages.length) {
      finalContentBlocks.push(uploadedImages[imageIndex++]);
    }

    const updatedNews = await News.findOneAndUpdate(
      { id },
      {
        title,
        slug,
        thumbnailUrl,
        thumbnailCaption,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        views: parseInt(views, 10) || 0,
        rating: rating ? (typeof rating === 'string' ? JSON.parse(rating) : rating) : { score: 0.0, votes: 0 },
        status: status || 'show',
        contentBlocks: finalContentBlocks,
      },
      { new: true, runValidators: true }
    );

    if (!updatedNews) return res.status(404).json({ error: 'Không tìm thấy tin tức để cập nhật' });

    res.json({
      message: 'Cập nhật tin tức thành công',
      news: updatedNews,
    });
  } catch (err) {
    console.error(`PUT /api/news/${id} error:`, err);
    res.status(400).json({ error: err.message });
  }
};


// Delete a news by ID
exports.deleteNews = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNews = await News.findOneAndDelete({ id });
    if (!deletedNews) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức để xóa' });
    }
    res.json({ message: 'Xóa tin tức thành công' });
  } catch (err) {
    console.error(`DELETE /api/news/${id} error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// Toggle news visibility
exports.toggleNewsVisibility = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await News.findOne({ id }); // Tìm theo id tùy chỉnh
    if (!news) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }

    news.status = news.status === 'show' ? 'hidden' : 'show';
    await news.save();

    res.json({
      message: `Tin tức đã được ${news.status === 'show' ? 'hiển thị' : 'ẩn'}`,
      news: {
        id: news.id,
        title: news.title,
        status: news.status,
      },
    });
  } catch (err) {
    console.error(`PUT /api/news/${id}/toggle-visibility error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

exports.uploadMiddleware = [upload.array('images', 10), handleMulterError];