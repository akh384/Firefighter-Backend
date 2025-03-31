require('dotenv').config();
const { google } = require('googleapis');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setup Multer for handling video uploads
const upload = multer({ dest: 'uploads/' });

// Load credentials from environment variables
const client_id = process.env.YOUTUBE_CLIENT_ID;
const client_secret = process.env.YOUTUBE_CLIENT_SECRET;
const redirect_uri = process.env.YOUTUBE_REDIRECT_URI;

let oAuth2Client;
if (client_id && client_secret && redirect_uri) {
  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
} else {
  console.warn("YouTube OAuth environment variables are missing.");
}

// Step 1: Auth URL route (optional to trigger auth manually)
app.get('/auth', (req, res) => {
  if (!oAuth2Client) return res.status(500).send("OAuth client not configured.");
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
  });
  res.redirect(authUrl);
});

// Step 2: OAuth2 callback
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code || !oAuth2Client) {
    return res.status(400).send("Missing authorization code or client config.");
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    console.log("✅ Tokens received:", tokens);
    res.send("Authorization successful! You can now upload videos.");
  } catch (error) {
    console.error("❌ Error retrieving access token:", error);
    res.status(500).send("Error retrieving access token.");
  }
});

// Step 3: Upload video endpoint
app.post('/uploadVideo', upload.single('file'), async (req, res) => {
  if (!oAuth2Client) {
    return res.status(401).send("OAuth2 client not configured.");
  }

  const credentials = oAuth2Client.credentials;
  if (!credentials || !credentials.access_token) {
    return res.status(401).send("OAuth2 client not authenticated. Please complete the OAuth flow at /auth.");
  }

  if (!req.file) {
    console.error("❌ No file received in request.");
    return res.status(400).send("No file uploaded.");
  }

  const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
  const filePath = req.file.path;
  const fileName = req.file.originalname;

  try {
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: fileName,
          description: 'Testimonial video uploaded by user',
        },
        status: {
          privacyStatus: 'unlisted',
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    fs.unlinkSync(filePath);
    const videoUrl = `https://www.youtube.com/watch?v=${response.data.id}`;
    console.log("✅ Video uploaded to YouTube:", videoUrl);

    res.json({ success: true, embedUrl: `https://www.youtube.com/embed/${response.data.id}` });
  } catch (error) {
    console.error("❌ Error uploading video:", error);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).send(`Failed to upload video to YouTube. ${error.message}`);
  }
});

// Temporary placeholder route for testimonials
app.get('/api/testimonials', (req, res) => {
  res.json([]); // Replace with database or storage later
});

// Test route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
