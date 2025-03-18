const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, 'public/videos');
const maxFileSize = 100 * 1024 * 1024;

/*==================== [ DIRECTORY INIT ] ====================*/
function initUploadDir() {
  try {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    console.log(`Upload directory initialized: ${uploadDir}`);
  } catch (error) {
    console.error('Upload directory initialization failed:', error);
    process.exit(1);
  }
}

/*==================== [ FILE FILTER ] ====================*/
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/x-matroska'];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('INVALID_FILE_TYPE'));
};

/*==================== [ STORAGE CONFIG ] ====================*/
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});

/*==================== [ UPLOAD CONFIG ] ====================*/
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxFileSize, files: 1 }
});

/*==================== [ FILE CLEANUP ] ====================*/
async function cleanupOldFiles() {
  try {
    const files = await fs.promises.readdir(uploadDir);
    const now = Date.now();

    await Promise.all(files.map(async file => {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.promises.stat(filePath);

      if (now - stats.birthtimeMs > 86400000) {
        await fs.promises.unlink(filePath);
        console.log(`Cleaned up file: ${file}`);
      }
    }));
  } catch (error) {
    console.error('File cleanup error:', error);
  }
}

/*==================== [ MIDDLEWARE API KEY ] ====================*/
const validateApiKey = (req, res, next) => {
  const providedKey = req.query.apikey || req.headers['x-api-key'];
  const validKey = process.env.API_KEY;

  if (!validKey) {
    console.error('API_KEY is not set in .env');
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }

  if (providedKey === validKey) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Invalid API key' });
  }
};

module.exports = { 
  initUploadDir, 
  upload, 
  uploadDir, 
  cleanupOldFiles, 
  validateApiKey 
};