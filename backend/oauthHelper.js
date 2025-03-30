const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const CREDENTIALS_PATH = path.join(__dirname, 'youtube-oauth-credentials.json');
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
);

const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

function getAuthUrl() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this URL:', authUrl);
}

function getTokenFromCode(code) {
    oAuth2Client.getToken(code, (err, token) => {
        if (err) {
            return console.error('Error retrieving access token', err);
        }
        oAuth2Client.setCredentials(token);
        fs.writeFileSync('token.json', JSON.stringify(token, null, 2));
        console.log('Token stored to token.json');
    });
}

async function uploadVideo() {
    try {
        const youtube = google.youtube({
            version: 'v3',
            auth: oAuth2Client
        });

        const res = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
                snippet: {
                    title: 'Test Video Upload',
                    description: 'This video was uploaded via the API for testing purposes.',
                    tags: ['test', 'api'],
                    categoryId: '22'
                },
                status: {
                    privacyStatus: 'unlisted'
                }
            },
            media: {
                body: fs.createReadStream('sample-video.webm')
            }
        });

        console.log('✅ Video uploaded successfully. Video ID:', res.data.id);
        console.log('▶️ Embed URL: https://www.youtube.com/embed/' + res.data.id);
    } catch (err) {
        console.error('❌ Error uploading video:', err);
    }
}

getAuthUrl();

if (fs.existsSync('token.json')) {
    const token = JSON.parse(fs.readFileSync('token.json', 'utf8'));
    oAuth2Client.setCredentials(token);
    uploadVideo();
} else {
    console.log('No token found. Authorize the app using the URL above.');
}
