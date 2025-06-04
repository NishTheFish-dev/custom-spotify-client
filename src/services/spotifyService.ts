import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const spotifyApi = axios.create({
  baseURL: SPOTIFY_API_BASE,
});

spotifyApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const spotifyService = {
  async getCurrentUser() {
    const response = await spotifyApi.get('/me');
    return response.data;
  },

  async getUserPlaylists() {
    const response = await spotifyApi.get('/me/playlists');
    return response.data;
  },

  async getPlaylistTracks(playlistId: string) {
    const response = await spotifyApi.get(`/playlists/${playlistId}/tracks`);
    return response.data;
  },

  async searchTracks(query: string) {
    const response = await spotifyApi.get('/search', {
      params: {
        q: query,
        type: 'track',
        limit: 20,
      },
    });
    return response.data;
  },
}; 