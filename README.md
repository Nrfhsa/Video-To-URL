# Video Upload Service

A simple Node.js service for handling video uploads with secure access management and automatic cleanup.

## Features

- Video upload with support for MP4, WebM, and MKV formats
- Delete functionality for individual or all files
- Automatic cleanup based on configurable TTL
- Hash-based file deduplication
- Permanent file storage option

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Nrfhsa/Video-To-URL.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```env
   PORT=5000
   MAX_FILE_SIZE=200MB
   FRONTEND_URL=http://your-frontend-url.com
   API_KEY=your_secret_key_here
   ```

## Usage

Start the server:
```bash
node index.js
```

## API Endpoints

### Upload Video
```http
POST /upload
```
- Request: `multipart/form-data` with field name `video`
- Parameter `exipred=1` for 1 hour, or any number for custom hours. Leave empty for 24 hours.
- Files can be made permanent with `expired=0` parameter

### List Files
```http
GET /files?apikey={your_api_key}
```
or
```http
GET /files
x-api-key: {your_api_key}
```

### Delete Files
```http
GET /delete?apikey={your_api_key}&video={all|filename}
```
Parameters:
- `video=all` - Delete all files
- `video={filename}` - Delete specific file

### View Video
```http
GET /video/{filename}
```

## Security Considerations

- Use HTTPS in production
- Revoke compromised API keys immediately

## Technical Notes

- Files automatically deleted based on TTL
- Hash-based filenames prevent duplicate uploads
- Rate limiting: 100 requests per 15 minutes
- Automatic hash map backups every 5 minutes
- Scheduled cleanup every hour

## Example Usage

### Upload Video (cURL)
```bash
curl -X POST -F "video=@./video.mp4" http://localhost:5000/upload?expired=48
```
or
### Upload Video (Node.js)
```javascript
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function uploadFile(path) {
  try {
    const formData = new FormData();
    formData.append('video', fs.createReadStream(path));

    const response = await axios.post(
      'http://localhost:5000/upload?expired=48',
      formData, 
      {
        headers: formData.getHeaders()
      }
    );

    console.log(response.data);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

uploadFile('./video.mp4');
```

**Example Output (Success):**
```json
{
  "success": true,
  "message": "Uploaded",
  "videoUrl": "http://localhost:5000/video/abc123.mp4",
  "expiresAt": "2023-10-16T14:30:45+07:00",
  "isPermanent": false,
  "fileInfo": {
    "filename": "abc123.mp4",
    "size": 10485760,
    "mimetype": "video/mp4"
  }
}
```

### List Files (cURL)
```bash
curl "http://localhost:5000/files?apikey=your_api_key"
```

**Example Output (Success):**
```json
{
  "success": true,
  "count": 1,
  "files": [
    {
      "filename": "abc123.mp4",
      "url": "http://localhost:5000/video/abc123.mp4",
      "size": 10485760,
      "uploadedAt": "2023-10-15T14:30:45+07:00",
      "expiresAt": "2023-10-17T14:30:45+07:00",
      "isPermanent": false,
      "mimetype": "video/mp4"
    }
  ]
}
```

### Delete Files (cURL)
Delete specific file:
```bash
curl "http://localhost:5000/delete?apikey=your_api_key&video=abc123.mp4"
```

Delete all files:
```bash
curl "http://localhost:5000/delete?apikey=your_api_key&video=all"
```

**Example Output (Success):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```