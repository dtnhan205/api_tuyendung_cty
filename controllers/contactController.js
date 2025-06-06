const Contact = require('../models/contact');

exports.createContact = async (req, res) => {
  try {
    const { fullName, email, phone, message } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Họ và tên và email là bắt buộc' });
    }

    const newContact = new Contact({
      fullName,
      email,
      phone: phone || '',   
      message: message || '',
    });

    await newContact.save();

    res.status(201).json({ message: 'Gửi liên hệ thành công', contact: newContact });
  } catch (error) {
    console.error('Lỗi khi gửi liên hệ:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server khi gửi liên hệ' });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(query);

    res.status(200).json({
      contacts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách liên hệ:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách liên hệ' });
  }
};

exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Liên hệ không tồn tại' });
    }
    res.status(200).json(contact);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết liên hệ:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết liên hệ' });
  }
};

// Xóa liên hệ theo ID
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Liên hệ không tồn tại' });
    }

    await contact.deleteOne();
    res.status(200).json({ message: 'Xóa liên hệ thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa liên hệ:', error.message, error.stack);
    res.status(500).json({ message: 'Lỗi server khi xóa liên hệ' });
  }
};