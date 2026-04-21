// src/middleware/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保项目根目录下有 uploads 文件夹
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // 文件保存路径
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名，防止重名覆盖
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制文件大小为 5MB
  fileFilter: (req, file, cb) => {
    // 仅允许上传图片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件！'), false);
    }
  }
});

module.exports = upload;
