if (!import.meta.env.VITE_SPOTIFY_CLIENT_ID) {
  throw new Error('Missing VITE_SPOTIFY_CLIENT_ID in environment variables');
}

if (!import.meta.env.VITE_SPOTIFY_CLIENT_SECRET) {
  throw new Error('Missing VITE_SPOTIFY_CLIENT_SECRET in environment variables');
}

export const SPOTIFY_CONFIG = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://127.0.0.1:3000/callback',
  scopes: [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
  ].join(' '),
}; 