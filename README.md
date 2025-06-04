# Custom Spotify Client

A web-based Spotify client that provides a personalized music experience with a modern interface.

## Features

- **Authentication**: Secure login with Spotify using PKCE authentication
- **Dashboard**: View and access your playlists
- **Playlist Details**: Browse tracks within playlists with added date information
- **Search**: Search for tracks across Spotify's library
- **Player Controls**: Play, pause, and skip tracks (requires Spotify Premium)
- **Responsive Design**: Works on desktop and mobile devices

## Requirements

- Node.js 16 or higher
- Spotify Premium account (required for playback functionality)
- Spotify Developer account with registered application

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your Spotify credentials:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   VITE_SPOTIFY_REDIRECT_URI=some_URI_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Add `http://localhost:5173/callback` to the Redirect URIs
4. Copy the Client ID to your `.env` file

## Note

This application requires a Spotify Premium account to use playback features. Free users can still browse playlists and search for music, but playback controls will be limited.

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Spotify Web API
- Spotify Web Playback SDK
