const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { 
  upload, 
  uploadDir,
  cleanupOldFiles,
  validateApiKey 
} = require('./lib');

/*==================== [ ROUTES ] ====================*/
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

router.post('/upload', (req, res) => {
  upload.single('video')(req, res, async (err) => {
    try {
      if (err) {
        const errorMap = {
          LIMIT_FILE_SIZE: { message: 'File size exceeds 100MB limit', status: 413 },
          INVALID_FILE_TYPE: { message: 'Invalid file type', status: 400 }
        };

        const errorInfo = errorMap[err.code] || { message: 'Upload failed', status: 500 };
        return res.status(errorInfo.status).json({
          success: false,
          message: errorInfo.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      await fs.promises.access(path.join(uploadDir, req.file.filename));
      const videoUrl = `${req.protocol}://${req.get('host')}/video/${req.file.filename}`;

      console.log(`[${req.requestTime}] POST | IP: ${req.clientIP} | VIDEO ${req.file.filename}`);

      res.status(201).json({
        success: true,
        message: 'Upload successful',
        videoUrl,
        fileInfo: {
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });

    } catch (error) {
      console.error(`[${req.requestTime}] POST VIDEO | IP: ${req.clientIP} | Error: ${error.message}`);

      res.status(500).json({
        success: false,
        message: 'Upload processing failed'
      });
    }
  });
});

router.get('/files', validateApiKey, async (req, res) => {
  try {
    const files = await fs.promises.readdir(uploadDir);

    const fileList = await Promise.all(files.map(async (file) => {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.promises.stat(filePath);

      return {
        filename: file,
        url: `${req.protocol}://${req.get('host')}/video/${file}`,
        size: stats.size,
        uploadedAt: stats.birthtime,
        expiresAt: new Date(stats.birthtime.getTime() + 86400000),
        mimetype: getMimeType(path.extname(file))
      };
    }));

    console.log(`[${req.requestTime}] GET | IP: ${req.clientIP} | FILES`);

    res.json({
      success: true,
      count: fileList.length,
      files: fileList.sort((a, b) => b.uploadedAt - a.uploadedAt)
    });

  } catch (error) {
    console.error(`[${req.requestTime}] GET FILES | IP: ${req.clientIP} | Error: ${error.message}`);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve files'
    });
  }
});

router.get('/delete', validateApiKey, async (req, res) => {
  const { video } = req.query;

  if (!video) {
    return res.status(400).json({
      success: false,
      message: 'Missing video parameter'
    });
  }

  try {
    if (video === 'all') {
      const files = await fs.promises.readdir(uploadDir);
      await Promise.all(files.map(file => fs.promises.unlink(path.join(uploadDir, file))));

      console.log(`[${req.requestTime}] DELETE ALL | IP: ${req.clientIP}`);

      return res.json({
        success: true,
        message: 'All files deleted successfully'
      });

    } else {
      const filePath = path.join(uploadDir, video);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      await fs.promises.unlink(filePath);
      console.log(`[${req.requestTime}] DELETE | IP: ${req.clientIP} | VIDEO ${video}`);

      return res.json({
        success: true,
        message: 'File deleted successfully'
      });
    }

  } catch (error) {
    console.error(`[${req.requestTime}] DELETE ERROR | IP: ${req.clientIP} | ${error.message}`);

    res.status(500).json({
      success: false,
      message: 'Delete operation failed'
    });
  }
});

/*==================== [ MIME TYPE HELPER ] ====================*/
function getMimeType(ext) {
  return {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime'
  }[ext.toLowerCase()] || 'application/octet-stream';
}

/*==================== [ SCHEDULED CLEANUP ] ====================*/
setInterval(() => {
  console.log('Initiating scheduled cleanup...');
  cleanupOldFiles();
}, 3600000);

module.exports = router;