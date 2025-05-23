const mongoose = require('mongoose');
const News = require('../models/new');

// Get all news (chỉ lấy tin tức có status: 'show')
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find({ status: 'show' });
    if (!news.length) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức nào' });
    }
    res.json(news);
  } catch (err) {
    console.error('GET /api/news error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

exports.getNewsById = async (req, res) => {
  const { id } = req.params;
  try {
    const news = await News.findOne({ id, status: 'show' });
    if (!news) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }
    res.json(news);
  } catch (err) {
    console.error(`GET /api/news/${id} error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// Create a new news
exports.createNews = async (req, res) => {
  try {
    const {
      id,
      title,
      slug,
      thumbnailUrl,
      thumbnailCaption,
      publishedAt,
      views,
      rating,
      status,
    } = req.body;

    const newNews = new News({
      id,
      title,
      slug,
      thumbnailUrl,
      thumbnailCaption,
      publishedAt: new Date(publishedAt),
      views: views || 0,
      rating: rating || { score: 0.0, votes: 0 },
      status: status || 'show',
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

  try {
    const updatedNews = await News.findOneAndUpdate(
      { id }, // Tìm theo id tùy chỉnh
      {
        title: req.body.title,
        slug: req.body.slug,
        thumbnailUrl: req.body.thumbnailUrl,
        thumbnailCaption: req.body.thumbnailCaption,
        publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : undefined,
        views: req.body.views,
        rating: req.body.rating,
        status: req.body.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedNews) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức để cập nhật' });
    }

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
    const deletedNews = await News.findOneAndDelete({ id }); // Xóa theo id tùy chỉnh
    if (!deletedNews) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức để xóa' });
    }
    res.json({ message: 'Xóa tin tức thành công' });
  } catch (err) {
    console.error(`DELETE /api/news/${id} error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// Toggle news visibility (Chuyển đổi giữa hidden và show)
exports.toggleNewsVisibility = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await News.findOne({ id });
    if (!news) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }

    news.status = news.status === 'show' ? 'hidden' : 'show';
    await news.save();

    res.json({
      message: `Tin tức đã được ${news.status === 'show' ? 'hiển thị' : 'ẩn'}`,
      news,
    });
  } catch (err) {
    console.error(`PUT /api/news/${id}/toggle-visibility error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};