/**
 * Exchange a Google authorization code for user info (email, sub, name).
 * Used by /api/auth/exchange and /api/trial/start.
 */
export async function exchangeGoogleCode(code, redirectUri) {
  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();

  // Decode id_token to get user info (it's a JWT, middle segment is payload)
  const idToken = tokens.id_token;
  if (!idToken) {
    throw new Error('No id_token returned from Google');
  }

  const payload = JSON.parse(
    Buffer.from(idToken.split('.')[1], 'base64url').toString()
  );

  return {
    email: payload.email,
    sub: payload.sub,
    name: payload.name || '',
    picture: payload.picture || '',
  };
}
