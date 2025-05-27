const mongoose = require('mongoose');
const News = require('../models/news');
const validator = require('validator');
const upload = require('../middlewares/upload');

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Lỗi upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

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
  upload.array('images', 10)(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message });
    }

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
      // Parse contentBlocks if sent as JSON string
      let contentBlocks = rawContentBlocks;
      if (typeof rawContentBlocks === 'string') {
        try {
          contentBlocks = JSON.parse(rawContentBlocks);
        } catch (e) {
          return res.status(400).json({ error: 'contentBlocks JSON không hợp lệ' });
        }
      }

      // Validate contentBlocks
      if (contentBlocks && Array.isArray(contentBlocks)) {
        for (const block of contentBlocks) {
          if (block.type === 'text') {
            if (!block.content || typeof block.content !== 'string') {
              return res.status(400).json({ error: 'Nội dung văn bản không hợp lệ' });
            }
          } else if (block.type !== 'image') {
            return res.status(400).json({ error: 'Loại khối nội dung không hợp lệ' });
          }
        }
      } else {
        contentBlocks = [];
      }

      // Handle uploaded images
      const uploadedImages = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          // Generate the URL for the saved image
          const imageUrl = `/images/${file.filename}`;
          uploadedImages.push({
            url: imageUrl,
            caption: '',
          });
        }
      }

      // Merge uploaded images with contentBlocks
      let imageIndex = 0;
      const finalContentBlocks = contentBlocks.map((block) => {
        if (block.type === 'image') {
          if (block.url) {
            // Keep existing URL if provided (e.g., from previously saved images)
            return {
              type: 'image',
              url: block.url,
              caption: block.caption || '',
            };
          } else if (imageIndex < uploadedImages.length) {
            // Use new uploaded image
            return {
              type: 'image',
              url: uploadedImages[imageIndex].url,
              caption: block.caption || '',
            };
          }
          imageIndex++;
        }
        return block;
      });

      // If there are extra uploaded images, append them
      for (; imageIndex < uploadedImages.length; imageIndex++) {
        finalContentBlocks.push({
          type: 'image',
          url: uploadedImages[imageIndex].url,
          caption: '',
        });
      }

      // Update news
      const updatedNews = await News.findOneAndUpdate(
        { id }, // Find by custom id
        {
          title,
          slug,
          thumbnailUrl,
          thumbnailCaption,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
          views: parseInt(views, 10) || 0,
          rating: rating ? JSON.parse(rating) : { score: 0, votes: 0 },
          status: status || 'show',
          contentBlocks: finalContentBlocks,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedNews) {
        return res.status(404).json({ error: 'Không tìm thấy tin tức để cập nhật' });
      }

      res.json({
        message: 'Cập nhật tin tức thành công',
        news: updatedNews,
      });
    } catch (err) {
      console.error(`PUT /api/new/${id} error:`, err);
      res.status(400).json({ error: err.message });
    }
  });
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
const mongoose = require('mongoose');
const News = require('../models/news');

// Toggle news visibility (Chuyển đổi giữa hidden và show)
exports.toggleNewsVisibility = async (req, res) => {
  const { id } = req.params;

  try {
    // Sử dụng findById thay vì findOne({ id }) vì id thường là _id trong Mongoose
    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức' });
    }

    // Chuyển đổi trạng thái
    news.status = news.status === 'show' ? 'hidden' : 'show';
    await news.save();

    res.json({
      message: `Tin tức đã được ${news.status === 'show' ? 'hiển thị' : 'ẩn'}`,
      news: {
        id: news._id, // Trả về _id để đồng bộ với frontend
        title: news.title,
        status: news.status,
        // Thêm các trường khác nếu cần thiết (tùy schema)
      },
    });
  } catch (err) {
    console.error(`PUT /api/news/${id}/toggle-visibility error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

exports.uploadMiddleware = [upload.array('images', 10), handleMulterError];