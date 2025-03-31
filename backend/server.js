const { google } = require('googleapis');
const express = require('express');
const app = express();

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

    // OPTIONAL: Save tokens to a database or session, depending on your use case
    console.log("✅ Tokens received:", tokens);

    res.send("Authorization successful! You can now upload videos.");
  } catch (error) {
    console.error("❌ Error retrieving access token:", error);
    res.status(500).send("Error retrieving access token.");
  }
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