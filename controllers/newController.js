const mongoose = require('mongoose');
const News = require('../models/news');
const validator = require('validator');
const multer = require('multer');
const upload = require('../middlewares/multerConfig');

// Middleware xử lý lỗi upload
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Lỗi upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Lấy tất cả tin tức
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

// Lấy tin tức theo ID và tăng views
exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findOneAndUpdate(
      { id: req.params.id }, // Tìm tin tức theo id
      { $inc: { views: 1 } }, // Tăng views lên 1
      { new: true } // Trả về document sau khi cập nhật
    );

    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    }

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy tin tức', error: error.message });
  }
};

// Lấy bài đăng hot nhất
exports.getHottestNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;

    let query = News.find({ status: 'show' }).sort({ views: -1 });

    if (limit > 0) {
      query = query.limit(limit);
    }

    const hottestNewsList = await query;

    if (hottestNewsList.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng nào' });
    }

    res.json({
      message: 'Lấy danh sách bài đăng hot thành công',
      news: hottestNewsList,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài đăng hot', error: error.message });
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

    const thumbnail = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;
    if (!thumbnail) {
      return res.status(400).json({ error: 'Không tìm thấy file thumbnail' });
    }
    const thumbnailUrl = `/images/${thumbnail.filename}`;

    if (!id) {
      return res.status(400).json({ error: 'Thiếu id' });
    }

    let contentBlocks = [];
    if (rawContentBlocks) {
      if (typeof rawContentBlocks === 'string') {
        try {
          contentBlocks = JSON.parse(rawContentBlocks);
        } catch (e) {
          return res.status(400).json({ error: 'contentBlocks JSON không hợp lệ' });
        }
      } else if (Array.isArray(rawContentBlocks)) {
        contentBlocks = rawContentBlocks;
      }
    }

    if (!Array.isArray(contentBlocks)) {
      contentBlocks = [];
    }

    for (const block of contentBlocks) {
      if (!['text', 'image'].includes(block.type)) {
        return res.status(400).json({ error: 'Loại khối nội dung không hợp lệ' });
      }
      if (block.type === 'text' && !block.content) {
        return res.status(400).json({ error: 'Block text phải có content' });
      }
      if (block.type === 'image' && !block.url) {
        return res.status(400).json({ error: 'Block image phải có url' });
      }
      if (block.type === 'text') {
        block.url = '';
      } else if (block.type === 'image') {
        block.content = '';
      }
    }

    const newNews = new News({
      id,
      title,
      slug,
      thumbnailUrl,
      thumbnailCaption: thumbnailCaption || '',
      publishedAt: new Date(publishedAt),
      views: parseInt(views, 10) || 0,
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
    if (err.code === 11000) {
      return res.status(400).json({ error: `ID "${req.body.id}" đã tồn tại` });
    }
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
    status,
    contentBlocks: rawContentBlocks,
  } = req.body;

  try {
    let contentBlocks = typeof rawContentBlocks === 'string' ? JSON.parse(rawContentBlocks) : rawContentBlocks;

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

    const uploadedImages = (req.files || []).map(file => ({
      type: 'image',
      url: `/images/${file.filename}`,
      caption: '',
    }));

    let imageIndex = 0;
    const finalContentBlocks = contentBlocks.map(block => {
      if (block.type === 'image') {
        if (block.url) return block;
        if (imageIndex < uploadedImages.length) return uploadedImages[imageIndex++];
      }
      return block;
    });

    while (imageIndex < uploadedImages.length) {
      finalContentBlocks.push(uploadedImages[imageIndex++]);
    }

    const updatedNews = await News.findOneAndUpdate(
      { id },
      {
        title,
        slug,
        thumbnailUrl,
        thumbnailCaption: thumbnailCaption || '',
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        views: parseInt(views, 10) || 0,
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
    // Tìm tin tức theo trường id (lưu ý: trong model, id là String, không phải ObjectId)
    const news = await News.findOne({ id });
    if (!news) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }

    // Chuyển đổi trạng thái
    news.status = news.status === 'show' ? 'hidden' : 'show';
    await news.save();

    // Trả về toàn bộ thông tin tin tức, bao gồm contentBlocks
    res.json({
      message: `Tin tức đã được ${news.status === 'show' ? 'hiển thị' : 'ẩn'}`,
      news: {
        id: news.id,
        title: news.title,
        slug: news.slug,
        thumbnailUrl: news.thumbnailUrl,
        thumbnailCaption: news.thumbnailCaption,
        publishedAt: news.publishedAt,
        views: news.views,
        status: news.status,
        createdAt: news.createdAt,
        contentBlocks: news.contentBlocks, // Đảm bảo trả về contentBlocks
      },
    });
  } catch (err) {
    console.error(`PUT /api/news/${id}/toggle-visibility error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

exports.uploadMiddleware = [upload.array('images', 10), handleMulterError];