import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';

const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function Player() {
  const { accessToken } = useAuthStore();
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    queue,
    setIsPlaying,
    setVolume,
    setProgress,
    playNext,
    playPrevious
  } = usePlayerStore();

  const [isDragging, setIsDragging] = useState(false);
  const progressInterval = useRef<number>();
  const volumeTimeout = useRef<number>();

  useEffect(() => {
    if (isPlaying && !isDragging) {
      progressInterval.current = window.setInterval(() => {
        if (!currentTrack) {
          setProgress(0);
          return;
        }
        const newProgress = progress + 1000;
        setProgress(newProgress >= currentTrack.duration_ms ? 0 : newProgress);
      }, 1000);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, isDragging, currentTrack, progress, setProgress]);

  const handlePlayPause = async () => {
    if (!accessToken || !currentTrack) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/${isPlaying ? 'pause' : 'play'}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: [currentTrack.uri]
          })
        }
      );

      if (response.ok) {
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    if (!accessToken) return;

    setVolume(newVolume);

    // Debounce the API call
    if (volumeTimeout.current) {
      clearTimeout(volumeTimeout.current);
    }

    volumeTimeout.current = window.setTimeout(async () => {
      try {
        await fetch(
          `https://api.spotify.com/v1/me/player/volume?volume_percent=${newVolume}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }, 100);
  };

  const handleProgressChange = async (newProgress: number) => {
    if (!accessToken || !currentTrack) return;

    setProgress(newProgress);
    setIsDragging(false);

    try {
      await fetch(
        `https://api.spotify.com/v1/me/player/seek?position_ms=${newProgress}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleNext = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        'https://api.spotify.com/v1/me/player/next',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        playNext();
      }
    } catch (error) {
      console.error('Error playing next track:', error);
    }
  };

  const handlePrevious = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        'https://api.spotify.com/v1/me/player/previous',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        playPrevious();
      }
    } catch (error) {
      console.error('Error playing previous track:', error);
    }
  };

  if (!currentTrack) return null;

  const progressPercentage = (progress / currentTrack.duration_ms) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-700 cursor-pointer" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        handleProgressChange(Math.floor(percentage * currentTrack.duration_ms));
      }}>
        <div
          className="h-full bg-green-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Track Info */}
          <div className="flex items-center space-x-4">
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-14 h-14 rounded"
            />
            <div>
              <div className="font-medium text-white">{currentTrack.name}</div>
              <div className="text-sm text-gray-400">
                {currentTrack.artists.map(artist => artist.name).join(', ')}
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevious}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handlePlayPause}
                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleNext}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Progress Time */}
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{formatTime(progress)}</span>
              <span>/</span>
              <span>{formatTime(currentTrack.duration_ms)}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 