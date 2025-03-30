const express = require('express');
const multer  = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Connect to Cosmos DB
require('./db');

// Load the Testimonial model from testimonialModel.js
const Testimonial = require('./testimonialModel');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.use(cors());
app.use(express.json());

// ----------------- Testimonials Endpoints -----------------

// GET: Retrieve all testimonials (sorted by newest first)
app.get('/api/testimonials', async (req, res) => {
  try {
    const allTestimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(allTestimonials);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching testimonials', error });
  }
});

// DELETE: Delete a testimonial by ID
app.delete('/api/testimonials/:id', async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: 'Testimonial deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting testimonial', error });
  }
});

// ----------------- OAuth2 Setup for YouTube -----------------

const CREDENTIALS_PATH = 'youtube-oauth-credentials.json';
const TOKEN_PATH = 'token.json';

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error("OAuth credentials file not found. Please ensure youtube-oauth-credentials.json exists.");
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0] // Must match your OAuth consent screen configuration.
);

// Load the stored token, if available.
if (fs.existsSync(TOKEN_PATH)) {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
} else {
  console.error("No token found. Run your OAuth flow to obtain a token.");
  // Optionally, exit or handle this case.
}

// ----------------- YouTube Upload Function -----------------

async function uploadVideoToYouTube(filePath) {
  const youtube = google.youtube({
    version: 'v3',
    auth: oAuth2Client
  });

  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: 'Testimonial Video Upload',
        description: 'Uploaded via API',
        tags: ['testimonial'],
        categoryId: '22' // For example, "People & Blogs"
      },
      status: {
        privacyStatus: 'unlisted'
      }
    },
    media: {
      body: fs.createReadStream(filePath)
    }
  });

  return res.data;
}

// ----------------- YouTube Upload Route -----------------

app.post('/api/uploadVideo', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await uploadVideoToYouTube(filePath);
    // Delete the local file after upload
    fs.unlinkSync(filePath);

    // Save the testimonial metadata to Cosmos DB.
    // We expect the client to send additional fields (name, message, userId) along with the file.
    const { name, message, userId } = req.body;
    const newTestimonial = new Testimonial({
      name,
      message,
      videoUrl: `https://www.youtube.com/embed/${result.id}`,
      userId
    });
    await newTestimonial.save();

    res.json({
      message: 'Video uploaded successfully',
      videoId: result.id,
      embedUrl: `https://www.youtube.com/embed/${result.id}`
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ message: 'Video upload failed', error });
  }
});

// ----------------- Start the Server -----------------

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
