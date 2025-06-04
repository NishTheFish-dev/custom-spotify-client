import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import Layout from './Layout';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  uri: string;
}

interface PlaylistDetails {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: {
    display_name: string;
  };
  tracks: {
    items: { track: Track }[];
    total: number;
  };
}

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const Playlist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setPlaylist(response.data);
      } catch (err) {
        setError('Failed to load playlist. Please try again.');
        console.error('Error fetching playlist:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id && accessToken) {
      fetchPlaylist();
    }
  }, [id, accessToken]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !playlist) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-red-500 text-xl">{error || 'Playlist not found'}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Playlist Header */}
          <div className="flex items-end space-x-6 mb-8">
            {playlist.images[0] && (
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                className="w-48 h-48 object-cover shadow-lg"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{playlist.name}</h1>
              <p className="text-gray-400 mb-1">{playlist.owner.display_name}</p>
              {playlist.description && (
                <p className="text-gray-400 text-sm">{playlist.description}</p>
              )}
              <p className="text-gray-400 text-sm mt-2">
                {playlist.tracks.total} tracks
              </p>
            </div>
          </div>

          {/* Tracks List */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 text-gray-400 text-sm">
                <div className="w-8">#</div>
                <div>Title</div>
                <div>Album</div>
                <div className="w-16 text-right">Duration</div>
              </div>
            </div>
            <div className="divide-y divide-gray-700">
              {playlist.tracks.items.map((item, index) => {
                const track = item.track;
                return (
                  <div
                    key={track.id}
                    className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 text-gray-400">{index + 1}</div>
                    <div>
                      <div className="text-white font-medium">{track.name}</div>
                      <div className="text-gray-400 text-sm">
                        {track.artists.map(artist => artist.name).join(', ')}
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm truncate">
                      {track.album.name}
                    </div>
                    <div className="w-16 text-right text-gray-400 text-sm">
                      {formatDuration(track.duration_ms)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Playlist; 