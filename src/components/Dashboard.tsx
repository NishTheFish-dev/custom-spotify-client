import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  tracks: {
    total: number;
  };
}

export default function Dashboard() {
  const { accessToken } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPlaylists(data.items);
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [accessToken]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <div className="text-center text-gray-400">Loading playlists...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Playlists</h1>
        <Link
          to="/search"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
        >
          Search Tracks
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {playlists.map((playlist) => (
          <Link
            key={playlist.id}
            to={`/playlist/${playlist.id}`}
            className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
          >
            <div className="aspect-square">
              <img
                src={playlist.images[0]?.url || '/default-playlist.png'}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h2 className="font-medium text-white truncate">{playlist.name}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {playlist.tracks.total} tracks
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 