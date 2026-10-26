// One-time helper: signs in to Google in the browser and prints the refresh token for YOUTUBE_REFRESH_TOKEN.
// Usage: YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... node scripts/youtube-token.mjs
// The OAuth client must be of type "Desktop app" with the YouTube Data API v3 enabled; the loopback redirect needs no registration for it.
import http from 'node:http';

const { YOUTUBE_CLIENT_ID: id, YOUTUBE_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) {
    console.error('Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET first.');
    process.exit(1);
}
const PORT = 53682;
const redirect = `http://127.0.0.1:${PORT}`;
const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
auth.search = new URLSearchParams({
    client_id: id,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    // without "consent" Google omits the refresh token on a repeat sign-in
    prompt: 'consent',
});

const server = http.createServer(async (req, res) => {
    const code = new URL(req.url, redirect).searchParams.get('code');
    if (!code) return res.end('No code in the request.');
    const token = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: id,
            client_secret: secret,
            redirect_uri: redirect,
            grant_type: 'authorization_code',
        }),
    }).then((r) => r.json());
    res.end('Done, you can close this tab.');
    console.log(token.refresh_token ? `YOUTUBE_REFRESH_TOKEN=${token.refresh_token}` : token);
    server.close();
});
server.listen(PORT, '127.0.0.1', () => console.log(`Open this URL and sign in:\n${auth}`));
