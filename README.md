# Video Upload Service

A simple Node.js service for handling video uploads with secure access management and automatic cleanup.

## Features

- API key authentication for sensitive endpoints
- Video upload with support for MP4, WebM, and MKV formats
- Rate limiting to prevent abuse
- Delete functionality for individual or all files
- Automatic cleanup of files older than 24 hours
- File size limit of 100MB

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
   FRONTEND_URL=http://your-frontend-url.com
   API_KEY=your_secret_key_here
   ```

## Usage

Start the server:
```bash
node index.js
```

The server will run on port 5000 by default or the port specified in your `.env` file.

## API Endpoints

### Upload Video
```http
POST /upload
```
- Request: `multipart/form-data` with field name `video`
- Response: JSON with video URL and file information

### List Files (Protected)
```http
GET /files?apikey={your_api_key}
```
or
```http
GET /files
x-api-key: {your_api_key}
```
- Response: JSON array of all uploaded files with metadata

### Delete Files (Protected)
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
- Response: Video file

## Security Considerations

- Store API_KEY securely in environment variables
- Never hardcode API keys in source code
- Use HTTPS in production
- Rotate API keys periodically
- Revoke compromised API keys immediately

## Directory Structure

- `public/videos/`: Directory for uploaded videos

## Technical Notes

- Files are automatically deleted after 24 hours
- API key validation uses environment variables
- Authentication via query parameter or `x-api-key` header
- Videos are stored with unique filenames generated from timestamp and random bytes
- Rate limiting: 100 requests per 15 minutes

## Example Usage

### Upload Video (Node.js)
```javascript
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function uploadFile(path) {
  try {
    const formData = new FormData();
    formData.append('video', fs.createReadStream(path));

    const response = await axios.post('http://localhost:5000/upload', formData, {
      headers: formData.getHeaders()
    });

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
  "message": "Upload successful",
  "videoUrl": "http://localhost:5000/video/1634567890123_abc123.mp4",
  "fileInfo": {
    "filename": "1634567890123_abc123.mp4",
    "size": 10485760,
    "mimetype": "video/mp4"
  }
}
```

**Example Output (Error):**
```json
{
  "success": false,
  "message": "File size exceeds 100MB limit"
}

{
  "success": false,
  "message": "Invalid file type"
}

{
  "success": false,
  "message": "Upload failed"
}

{
  "success": false,
  "message": "Upload processing failed"
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
  "count": 2,
  "files": [
    {
      "filename": "1634567890123_abc123.mp4",
      "url": "http://localhost:5000/video/1634567890123_abc123.mp4",
      "size": 10485760,
      "uploadedAt": "2023-10-15T14:30:45.000Z",
      "expiresAt": "2023-10-16T14:30:45.000Z",
      "mimetype": "video/mp4"
    },
    {
      "filename": "1634567890456_def456.webm",
      "url": "http://localhost:5000/video/1634567890456_def456.webm",
      "size": 5242880,
      "uploadedAt": "2023-10-15T12:15:30.000Z",
      "expiresAt": "2023-10-16T12:15:30.000Z",
      "mimetype": "video/webm"
    }
  ]
}
```

**Example Output (Error):**
```json
{
  "success": false,
  "message": "Failed to retrieve files"
}
```

### Delete Files (cURL)
Delete specific file:
```bash
curl "http://localhost:5000/delete?apikey=your_api_key&video=1634567890123_abc123.mp4"
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

{
  "success": true,
  "message": "All files deleted successfully"
}
```

**Example Output (Error):**
```json
{
  "success": false,
  "message": "File not found"
}

{
  "success": false,
  "message": "Delete operation failed"
}
```