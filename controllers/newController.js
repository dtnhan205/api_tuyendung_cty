const mongoose = require('mongoose');
const News = require('../models/news');
const validator = require('validator');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html'); // Thêm sanitize-html
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

// Hàm sanitize HTML
const sanitizeContentHtml = (html) => {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe']), // Cho phép img, iframe (video)
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'vimeo.com'], // Chỉ cho phép iframe từ nguồn đáng tin cậy
  });
};

// Endpoint upload hình ảnh cho SunEditor
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file hình ảnh' });
    }
    const imageUrl = `/images/${req.file.filename}`; // URL của ảnh
    res.json({ url: imageUrl }); // SunEditor mong đợi response dạng { url: string }
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi upload ảnh', error: error.message });
  }
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

// Lấy tin tức theo slug
exports.getNewsById = async (req, res) => {
  try {
    const isAdmin = !!req.headers.authorization;
    let news;
    if (isAdmin) {
      news = await News.findOne({ slug: req.params.slug });
    } else {
      news = await News.findOneAndUpdate(
        { slug: req.params.slug },
        { $inc: { views: 1 } },
        { new: true }
      );
    }
    if (!news) {
      return res.status(404).json({ message: "Không tìm thấy tin tức" });
    }
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy tin tức', error: error.message });
  }
};

// Lấy tin tức hot nhất
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

// Lấy tin tức theo category
exports.getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 0;
    if (!['news', 'interview_tip', 'project' ].includes(category)) {
      return res.status(400).json({ error: 'Category phải là  "project" , "news" hoặc "interview_tip"' });
    }
    let query = News.find({ category, status: 'show' }).sort({ publishedAt: -1 });
    if (limit > 0) {
      query = query.limit(limit);
    }
    const newsList = await query;
    if (newsList.length === 0) {
      return res.status(404).json({ message: `Không tìm thấy bài viết nào trong danh mục ${category}` });
    }
    res.json({
      message: `Lấy danh sách bài viết trong danh mục ${category} thành công`,
      news: newsList,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài viết', error: error.message });
  }
};



// Tạo bài viết mới
 exports.createNews = async (req, res) => {
  try {
    const {
      title,
      slug,
      thumbnailCaption,
      publishedAt,
      views,
      status,
      category,
      contentHtml,
      contentBlocks: rawContentBlocks,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!title || !slug || !contentHtml) {
      return res.status(400).json({ error: 'Thiếu các trường bắt buộc: title, slug, contentHtml' });
    }

    // Kiểm tra contentHtml không rỗng sau khi loại bỏ thẻ HTML
    const cleanContent = contentHtml.replace(/<[^>]+>/g, '').trim();
    if (!cleanContent) {
      return res.status(400).json({ error: 'Nội dung HTML không được để trống' });
    }

    // Kiểm tra thumbnail
    const thumbnail = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;
    if (!thumbnail) {
      return res.status(400).json({ error: 'Không tìm thấy file thumbnail' });
    }
    const thumbnailUrl = `/images/${thumbnail.filename}`;

    // Kiểm tra định dạng file thumbnail
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimes.includes(thumbnail.mimetype)) {
      return res.status(400).json({ error: 'Thumbnail phải là file JPEG, PNG hoặc GIF' });
    }

    const newId = new mongoose.Types.ObjectId().toString();

    // Xử lý contentBlocks (nếu có)
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

    const contentImages = req.files && req.files['contentImages'] ? req.files['contentImages'] : [];
    const uploadedImages = contentImages.map(file => ({
      type: 'image',
      url: `/images/${file.filename}`,
      caption: '',
    }));

    let imageIndex = 0;
    const finalContentBlocks = contentBlocks
      .filter(block => {
        if (block.type === 'image' && (!block.url || block.url.startsWith('blob:') || block.url.includes('placeholder'))) {
          return imageIndex < uploadedImages.length;
        }
        if (block.type === 'text' && (!block.content || typeof block.content !== 'string')) {
          return false;
        }
        return true;
      })
      .map(block => {
        if (block.type === 'image' && (!block.url || block.url.startsWith('blob:') || block.url.includes('placeholder'))) {
          return {
            ...uploadedImages[imageIndex++],
            caption: block.caption || '',
          };
        }
        if (block.type === 'text') {
          block.url = '';
        }
        return block;
      });

    while (imageIndex < uploadedImages.length) {
      finalContentBlocks.push(uploadedImages[imageIndex++]);
    }

    // Kiểm tra category
    if (!['news', 'interview_tip', 'project'].includes(category)) {
      return res.status(400).json({ error: 'Category phải là  "news" , "project" hoặc "interview_tip"' });
    }

    // Sanitize contentHtml
    const sanitizedContentHtml = sanitizeContentHtml(contentHtml);

    const newNews = new News({
      id: newId,
      title,
      slug,
      thumbnailUrl,
      thumbnailCaption: thumbnailCaption || '',
      publishedAt: new Date(publishedAt),
      views: parseInt(views, 10) || 0,
      status: status || 'show',
      category: category || 'news',
      contentHtml: sanitizedContentHtml,
      contentBlocks: finalContentBlocks,
    });

    await newNews.save();
    res.status(201).json({
      message: 'Tạo tin tức thành công',
      news: newNews,
    });
  } catch (err) {
    console.error('POST /api/news error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Slug đã tồn tại' });
    }
    res.status(400).json({ error: 'Lỗi khi tạo bài viết', details: err.message });
  }
};

// Cập nhật bài viết theo slug
exports.updateNews = async (req, res) => {
  const { slug } = req.params;
  const {
    title,
    slug: newSlug,
    thumbnailUrl,
    thumbnailCaption,
    publishedAt,
    views,
    status,
    category,
    contentHtml,
    contentBlocks: rawContentBlocks,
  } = req.body;

  try {
    // Kiểm tra các trường bắt buộc
    if (!title || !newSlug || !contentHtml) {
      return res.status(400).json({ error: 'Thiếu các trường bắt buộc: title, slug, contentHtml' });
    }

    // Kiểm tra contentHtml không rỗng
    const cleanContent = contentHtml.replace(/<[^>]+>/g, '').trim();
    if (!cleanContent) {
      return res.status(400).json({ error: 'Nội dung HTML không được để trống' });
    }

    let contentBlocks = [];
    if (rawContentBlocks) {
      contentBlocks = typeof rawContentBlocks === 'string' ? JSON.parse(rawContentBlocks) : rawContentBlocks;
    }
    if (!Array.isArray(contentBlocks)) {
      contentBlocks = [];
    }

    const files = req.files || {};
    const thumbnail = files['thumbnail'] && files['thumbnail'].length > 0 ? files['thumbnail'][0] : null;
    const contentImages = files['contentImages'] && Array.isArray(files['contentImages']) ? files['contentImages'] : [];

    // Kiểm tra định dạng file thumbnail
    if (thumbnail && !['image/jpeg', 'image/png', 'image/gif'].includes(thumbnail.mimetype)) {
      return res.status(400).json({ error: 'Thumbnail phải là file JPEG, PNG hoặc GIF' });
    }

    const uploadedImages = contentImages.map(file => ({
      type: 'image',
      url: `/images/${file.filename}`,
      caption: '',
    }));

    let imageIndex = 0;
    const finalContentBlocks = contentBlocks
      .filter(block => {
        if (block.type === 'image' && (!block.url || block.url.startsWith('blob:') || block.url.includes('placeholder'))) {
          return imageIndex < uploadedImages.length;
        }
        if (block.type === 'text' && (!block.content || typeof block.content !== 'string')) {
          return false;
        }
        return true;
      })
      .map(block => {
        if (block.type === 'image' && (!block.url || block.url.startsWith('blob:') || block.url.includes('placeholder'))) {
          return {
            ...uploadedImages[imageIndex++],
            caption: block.caption || '',
          };
        }
        return block;
      });

    while (imageIndex < uploadedImages.length) {
      finalContentBlocks.push(uploadedImages[imageIndex++]);
    }

    const finalThumbnailUrl = thumbnail ? `/images/${thumbnail.filename}` : (thumbnailUrl || '');

    if (category && !['news', 'interview_tip' ,'project' ].includes(category)) {
      return res.status(400).json({ error: 'Category phải là"project", "news" hoặc "interview_tip"' });
    }

    // Sanitize contentHtml
    const sanitizedContentHtml = sanitizeContentHtml(contentHtml);

    const updatedNews = await News.findOneAndUpdate(
      { slug },
      {
        title,
        slug: newSlug || slug,
        thumbnailUrl: finalThumbnailUrl,
        thumbnailCaption: thumbnailCaption || '',
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        views: parseInt(views, 10) || 0,
        status: status || 'show',
        category: category || 'news',
        contentHtml: sanitizedContentHtml,
        contentBlocks: finalContentBlocks,
      },
      { new: true, runValidators: true }
    );

    if (!updatedNews) {
      return res.status(404).json({ error: 'Không tìm thấy tin tức để cập nhật' });
    }

    res.json({
      message: 'Cập nhật tin tức thành công',
      news: updatedNews,
    });
  } catch (err) {
    console.error(`PUT /api/news/${slug} error:`, err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Slug đã tồn tại' });
    }
    res.status(400).json({ error: 'Lỗi khi cập nhật bài viết', details: err.message });
  }
};

// Xóa tin tức theo slug
exports.deleteNews = async (req, res) => {
  const { slug } = req.params;
  try {
    const deletedNews = await News.findOneAndDelete({ slug });
    if (!deletedNews) {
      return res.status(404).json({ message: 'Không tìm thấy tin tức để xóa' });
    }
    res.json({ message: 'Xóa tin tức thành công' });
  } catch (err) {
    console.error(`DELETE /api/news/${slug} error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// Chuyển đổi trạng thái hiển thị
exports.toggleNewsVisibility = async (req, res) => {
  const { slug } = req.params;
  try {
    const news = await News.findOne({ slug });
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
    console.error(`PUT /api/news/${slug}/toggle-visibility error:`, err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};