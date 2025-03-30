const fs = require('fs');
const { google } = require('googleapis');

// Load your OAuth 2.0 credentials from your JSON file.
const CREDENTIALS_PATH = 'youtube-oauth-credentials.json';
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

// Depending on your credentials file structure, it might be under "installed" or "web"
const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

// Create an OAuth2 client with the given credentials and the redirect URI.
const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]  // Make sure this matches your OAuth consent screen configuration.
);

// Define the scopes required for uploading videos to YouTube.
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

// Function to generate the authentication URL.
function getAuthUrl() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline', // "offline" will allow you to receive a refresh token.
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this URL:', authUrl);
}

// Function to exchange an authorization code for tokens and save them.
function getTokenFromCode(code) {
    oAuth2Client.getToken(code, (err, token) => {
        if (err) {
            return console.error('Error retrieving access token', err);
        }
        oAuth2Client.setCredentials(token);
        fs.writeFileSync('token.json', JSON.stringify(token));
        console.log('Token stored to token.json');
    });
}

async function uploadVideo() {
    try {
        // Create the YouTube client using your authenticated OAuth2 client.
        const youtube = google.youtube({
            version: 'v3',
            auth: oAuth2Client
        });

        // Upload the video.
        const res = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: 'Test Video Upload',
                    description: 'This video was uploaded via the API for testing purposes.',
                    tags: ['test', 'api'],
                    categoryId: '22' // For example, "People & Blogs"
                },
                status: {
                    privacyStatus: 'unlisted'  // Options: public, unlisted, private
                }
            },
            media: {
                // Update the path below to match your sample video file location.
                body: fs.createReadStream('sample-video.webm')
            }
        });

        console.log('Video uploaded successfully. Video ID:', res.data.id);
        console.log('Embed URL: https://www.youtube.com/embed/' + res.data.id);
    } catch (err) {
        console.error('Error uploading video:', err);
    }
}

// Generate and print the authentication URL.
getAuthUrl();

let token;
if (fs.existsSync('token.json')) {
    token = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    oAuth2Client.setCredentials(token);
}

uploadVideo();

// Optionally, if you already have an authorization code, you can call:
//getTokenFromCode('4/0AQSTgQGRONWYsVrEGGObcd0tS6RYAK0BuOS1XDEdv5g_OrwiQoxVN1zvbz76NAfbouzX7Q');

