/**
 * One-time OAuth setup for YouTube centralized uploads.
 *
 * Prerequisites (Google Cloud Console):
 *   1. Enable YouTube Data API v3
 *   2. OAuth consent screen with youtube.upload scope
 *   3. Web application OAuth client with redirect URI:
 *      http://localhost:3333/oauth/callback (or YOUTUBE_OAUTH_REDIRECT_URI)
 *
 * Usage:
 *   cd backend
 *   cp .env.example .env   # fill YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET
 *   node scripts/youtube-oauth-setup.js
 *
 * Sign in as the Google account that owns @mageDev-m2r, then paste the
 * refresh token printed at the end into YOUTUBE_REFRESH_TOKEN in .env
 */
import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = process.env.YOUTUBE_OAUTH_REDIRECT_URI || 'http://localhost:3333/oauth/callback';
const PORT = Number(process.env.YOUTUBE_OAUTH_PORT) || 3333;

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

function fail(msg) {
  console.error(`\nError: ${msg}\n`);
  process.exit(1);
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  fail('Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in backend/.env first.');
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    fail(`Token exchange failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname !== '/oauth/callback') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const error = url.searchParams.get('error');
  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h1>OAuth denied</h1><p>${error}</p>`);
    server.close();
    fail(`OAuth error: ${error}`);
  }

  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Missing code</h1>');
    return;
  }

  try {
    const tokens = await exchangeCode(code);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(
      '<h1>Success</h1><p>You can close this tab and return to the terminal.</p>',
    );

    console.log('\n--- OAuth tokens ---');
    if (tokens.refresh_token) {
      console.log('\nAdd this to backend/.env:\n');
      console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      console.warn(
        '\nNo refresh_token returned. Revoke app access at https://myaccount.google.com/permissions',
      );
      console.warn('Then re-run this script (prompt=consent forces a new refresh token).\n');
    }
    if (tokens.access_token) {
      console.log(`\n(short-lived access token: ${tokens.access_token.slice(0, 20)}…)`);
    }
    console.log('\nDone.\n');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>Token exchange failed</h1><p>See terminal.</p>');
    console.error(err);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT, () => {
  console.log('\nYouTube OAuth setup');
  console.log('===================');
  console.log(`Redirect URI: ${REDIRECT_URI}`);
  console.log('\n1. Open this URL in a browser (sign in as @mageDev-m2r owner):\n');
  console.log(authUrl.toString());
  console.log('\n2. After consent, the refresh token will print here.\n');
});
