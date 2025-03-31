const { google } = require('googleapis');
const express = require('express');
const app = express();

// Load credentials from environment variables
const client_id = process.env.YOUTUBE_CLIENT_ID;
const client_secret = process.env.YOUTUBE_CLIENT_SECRET;
const redirect_uri = process.env.YOUTUBE_REDIRECT_URI;

if (!client_id || !client_secret || !redirect_uri) {
  console.warn("YouTube OAuth environment variables are missing. YouTube features will be disabled.");
} else {
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

  // Example usage
  const getNewToken = (oAuth2Client, callback) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.upload'],
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    // You can implement token handling here
  };

  // If you want to trigger token generation at startup (optional)
  // getNewToken(oAuth2Client, () => {});
}

// Basic test route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
