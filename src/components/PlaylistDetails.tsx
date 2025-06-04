import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  uri: string;
}

interface PlaylistDetails {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  owner: {
    display_name: string;
  };
  tracks: {
    items: Array<{
      track: Track;
      added_at: string;
    }>;
    total: number;
    next: string | null;
  };
}

const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export default function PlaylistDetails() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuthStore();
  const { setCurrentTrack, setIsPlaying, setProgress } = usePlayerStore();
  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastTrackRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && playlist?.tracks.next) {
        loadMoreTracks();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, playlist?.tracks.next]);

  const loadMoreTracks = async () => {
    if (!playlist?.tracks.next || !accessToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(playlist.tracks.next, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylist(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tracks: {
              ...data,
              items: [...prev.tracks.items, ...data.items]
            }
          };
        });
      }
    } catch (error) {
      console.error('Error loading more tracks:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id || !accessToken) return;

      try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPlaylist(data);
        } else {
          throw new Error('Failed to load playlist');
        }
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, [id, accessToken]);

  const handlePlay = async (track: Track) => {
    if (!accessToken) return;

    try {
      // First, ensure we have an active device
      const devicesResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!devicesResponse.ok) {
        throw new Error('Failed to get devices');
      }

      const devicesData = await devicesResponse.json();
      const activeDevice = devicesData.devices.find((device: any) => device.is_active);

      // If no active device, transfer playback to the first available device
      if (!activeDevice && devicesData.devices.length > 0) {
        const transferResponse = await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            device_ids: [devicesData.devices[0].id],
            play: false
          })
        });

        if (!transferResponse.ok) {
          throw new Error('Failed to transfer playback');
        }
      }

      // Now play the track
      const playResponse = await fetch(
        'https://api.spotify.com/v1/me/player/play',
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [track.uri],
            position_ms: 0
          })
        }
      );

      if (playResponse.ok) {
        setCurrentTrack(track);
        setIsPlaying(true);
        setProgress(0);
      } else {
        const errorData = await playResponse.json();
        console.error('Playback error:', errorData);
        throw new Error('Failed to play track');
      }
    } catch (error) {
      console.error('Error playing track:', error);
      // You might want to show an error message to the user here
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <div className="text-center text-gray-400">Loading playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <div className="text-center text-red-500">{error || 'Playlist not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Playlist Header */}
        <div className="flex items-end space-x-6 mb-8">
          {playlist.images[0] && (
            <img
              src={playlist.images[0].url}
              alt={decodeHtmlEntities(playlist.name)}
              className="w-48 h-48 object-cover shadow-lg"
            />
          )}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{decodeHtmlEntities(playlist.name)}</h1>
            <p className="text-gray-400 mb-1">{decodeHtmlEntities(playlist.owner.display_name)}</p>
            {playlist.description && (
              <p className="text-gray-400 text-sm">{decodeHtmlEntities(playlist.description)}</p>
            )}
            <p className="text-gray-400 text-sm mt-2">
              {playlist.tracks.total} tracks
            </p>
          </div>
        </div>

        {/* Tracks List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 text-gray-400 text-sm">
              <div className="w-8">#</div>
              <div>Title</div>
              <div>Album</div>
              <div className="w-32">Date Added</div>
              <div className="w-16">Duration</div>
            </div>
          </div>
          <div className="divide-y divide-gray-700">
            {playlist.tracks.items.map((item, index) => {
              const track = item.track;
              const isLastTrack = index === playlist.tracks.items.length - 1;
              return (
                <div
                  key={track.id}
                  ref={isLastTrack ? lastTrackRef : null}
                  className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handlePlay(track)}
                >
                  <div className="w-8 text-gray-400">{index + 1}</div>
                  <div>
                    <div className="text-white font-medium">{decodeHtmlEntities(track.name)}</div>
                    <div className="text-gray-400 text-sm">
                      {track.artists.map(artist => decodeHtmlEntities(artist.name)).join(', ')}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm truncate">
                    {decodeHtmlEntities(track.album.name)}
                  </div>
                  <div className="w-32 text-gray-400 text-sm">
                    {formatDate(item.added_at)}
                  </div>
                  <div className="w-16 text-gray-400 text-sm">
                    {formatDuration(track.duration_ms)}
                  </div>
                </div>
              );
            })}
          </div>
          {isLoadingMore && (
            <div className="p-4 text-center text-gray-400">
              Loading more tracks...
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 