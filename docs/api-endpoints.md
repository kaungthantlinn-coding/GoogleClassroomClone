# API Endpoints for File Upload

## File Upload Endpoints

### Upload Submission Files

**POST** `/submissions/upload`

Upload files for a student submission.

**Headers:**

- `Authorization: Bearer <token>` - JWT token for authentication
- `Content-Type: multipart/form-data` - Required for file uploads

**Request Body (FormData):**

- `assignmentId` (string, required) - The ID of the assignment
- `files` (array of files, required) - The files to upload
- `submissionId` (string, optional) - If adding files to an existing submission

**Response:**

```json
{
  "success": true,
  "files": [
    {
      "id": "file-123",
      "name": "assignment.pdf",
      "type": "application/pdf",
      "size": 1024000,
      "url": "/api/submissions/files/file-123"
    }
  ]
}
```

### Download Submission File

**GET** `/submissions/files/:fileId`

Download a specific file from a submission.

**Headers:**

- `Authorization: Bearer <token>` - JWT token for authentication

**URL Parameters:**

- `fileId` (string, required) - The ID of the file to download

**Response:**

- File content with appropriate content type and download headers

### Delete Submission File

**DELETE** `/submissions/files/:fileId`

Delete a specific file from a submission.

**Headers:**

- `Authorization: Bearer <token>` - JWT token for authentication

**URL Parameters:**

- `fileId` (string, required) - The ID of the file to delete

**Response:**

```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Server Implementation Notes

### Storage Options

For file storage, you can implement:

1. **Local File Storage** - Store files on the local server filesystem

   - Simple but not scalable for production
   - Files are stored in a directory like `/uploads`
   - Need to handle file naming conflicts

2. **Cloud Storage (Recommended)**
   - AWS S3, Google Cloud Storage, or Azure Blob Storage
   - Scalable and reliable for production use
   - Better security and access control
   - Built-in CDN capabilities

### Backend Implementation

**Express.js Example:**

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const upload = multer({ dest: "uploads/" });

// Upload endpoint
app.post("/api/submissions/upload", upload.array("files"), async (req, res) => {
  try {
    const assignmentId = req.body.assignmentId;
    const submissionId = req.body.submissionId;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const fileData = req.files.map((file) => {
      const fileId = uuidv4();
      const fileExt = path.extname(file.originalname);
      const newFilename = `${fileId}${fileExt}`;

      // Move file to permanent location
      fs.renameSync(file.path, path.join(__dirname, "uploads", newFilename));

      return {
        id: fileId,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: `/api/submissions/files/${fileId}`,
      };
    });

    // In a real app, you would save the fileData in your database
    // associated with the submission

    res.json({
      success: true,
      files: fileData,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ success: false, message: "Error uploading files" });
  }
});

// Download endpoint
app.get("/api/submissions/files/:fileId", (req, res) => {
  try {
    const fileId = req.params.fileId;

    // In a real app, you would lookup the file metadata in your database
    // to get the actual filename and path

    // For this example, we'll assume all files are in the uploads directory
    const filePath = path.join(__dirname, "uploads", fileId);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    // Set appropriate headers and send the file
    res.download(filePath);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ success: false, message: "Error downloading file" });
  }
});

// Delete file endpoint
app.delete("/api/submissions/files/:fileId", (req, res) => {
  try {
    const fileId = req.params.fileId;

    // In a real app, you would lookup the file metadata in your database
    // to get the actual filename and path

    // For this example, we'll assume all files are in the uploads directory
    const filePath = path.join(__dirname, "uploads", fileId);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    // In a real app, you would also remove the file reference from your database

    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ success: false, message: "Error deleting file" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

**Implementing with AWS S3:**

```javascript
const express = require("express");
const multer = require("multer");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "my-classroom-uploads";

// Upload endpoint
app.post("/api/submissions/upload", upload.array("files"), async (req, res) => {
  try {
    const assignmentId = req.body.assignmentId;
    const submissionId = req.body.submissionId;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });
    }

    const uploadPromises = req.files.map(async (file) => {
      const fileId = uuidv4();
      const key = `submissions/${assignmentId}/${
        submissionId || "new"
      }/${fileId}`;

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      // Generate a pre-signed URL (valid for 1 hour)
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return {
        id: fileId,
        key,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url,
      };
    });

    const fileData = await Promise.all(uploadPromises);

    // In a real app, you would save the fileData in your database
    // associated with the submission

    res.json({
      success: true,
      files: fileData,
    });
  } catch (error) {
    console.error("Error uploading files to S3:", error);
    res.status(500).json({ success: false, message: "Error uploading files" });
  }
});

// Download endpoint
app.get("/api/submissions/files/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // In a real app, you would lookup the file metadata in your database
    // to get the S3 key

    // For this example, we'll generate a pre-signed URL and redirect
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `submissions/files/${fileId}`, // You would get this from your database
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Redirect to the pre-signed URL
    res.redirect(url);
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ success: false, message: "Error accessing file" });
  }
});

// Delete file endpoint
app.delete("/api/submissions/files/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // In a real app, you would lookup the file metadata in your database
    // to get the S3 key

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `submissions/files/${fileId}`, // You would get this from your database
      })
    );

    // In a real app, you would also remove the file reference from your database

    res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    res.status(500).json({ success: false, message: "Error deleting file" });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```
