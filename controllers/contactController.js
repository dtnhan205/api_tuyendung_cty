// controllers/contactController.js
const Contact = require('../models/contact');
const path = require('path');
const fs = require('fs');

exports.createContact = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Họ và tên và email là bắt buộc' });
    }

    const cvFile = req.files?.resume?.[0] || null;
    let resume = null;

    if (cvFile) {
      resume = {
        name: cvFile.originalname,
        type: cvFile.mimetype,
        size: cvFile.size,
        url: `cv/${cvFile.filename}` // BỎ / ĐẦU → quan trọng!
      };
    }

    const newContact = new Contact({
      fullName,
      email,
      phone: phone || '',
      message: message || '',
      resume
    });

    await newContact.save();
    res.status(201).json({ message: 'Gửi liên hệ thành công', contact: newContact });
  } catch (error) {
    console.error('Lỗi khi gửi liên hệ:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi liên hệ' });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ contacts, total: contacts.length });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Liên hệ không tồn tại' });
    res.status(200).json(contact);
  } catch (error) {
    console.error('Lỗi:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Liên hệ không tồn tại' });

    if (!['Chưa xử lý', 'Đã xử lý'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    if (contact.status === 'Đã xử lý') {
      return res.status(400).json({ message: 'Liên hệ đã xử lý, không thể cập nhật' });
    }

    if (status === 'Đã xử lý') {
      contact.status = status;
      await contact.save();
      return res.status(200).json({ message: 'Cập nhật thành công', contact });
    }

    res.status(400).json({ message: 'Chỉ có thể chuyển từ "Chưa xử lý" sang "Đã xử lý"' });
  } catch (error) {
    console.error('Lỗi cập nhật:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Liên hệ không tồn tại' });

    // Xóa file CV nếu có
    if (contact.resume?.url) {
      const filePath = path.join(__dirname, '..', 'public', contact.resume.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await contact.deleteOne();
    res.status(200).json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Lỗi xóa:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// TẢI CV - ĐÃ SỬA HOÀN TOÀN
exports.downloadCv = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact || !contact.resume?.url) {
      return res.status(404).json({ message: 'Không tìm thấy CV' });
    }

    const filePath = path.resolve(__dirname, '..', 'public', contact.resume.url);

    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File CV không tồn tại trên server' });
    }

    // Bảo mật: không cho truy cập ngoài thư mục public
    const publicDir = path.resolve(__dirname, '..', 'public');
    if (!filePath.startsWith(publicDir)) {
      return res.status(403).json({ message: 'Truy cập bị từ chối' });
    }

    // Gửi file
    res.download(filePath, contact.resume.name, (err) => {
      if (err) {
        console.error('Lỗi gửi file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Lỗi khi tải file' });
        }
      }
    });
  } catch (error) {
    console.error('Lỗi tải CV:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};