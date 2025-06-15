import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SPOTIFY_CONFIG } from '../config/spotify';

import { useAuthStore } from '../store/authStore';
import { generateCodeVerifier, generateCodeChallenge, storePKCEVerifier, clearPKCEVerifier } from '../utils/pkce';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear any existing PKCE data
      clearPKCEVerifier();

      // Generate PKCE values
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // Persist verifier so we can use it in callback
      if (!storePKCEVerifier(verifier)) {
        throw new Error('Failed to store PKCE verifier');
      }

      const params = new URLSearchParams({
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        response_type: 'code',
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        scope: SPOTIFY_CONFIG.SCOPES.join(' '),
        show_dialog: 'true',
      });

      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to start login process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="max-w-md w-full mx-auto px-4 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold">Nish's Custom Spotify Client</h1>
            <p className="text-gray-400 text-lg">
              Your personalized Spotify experience
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`w-full bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Loading...' : 'Login with Spotify'}
          </button>

          <p className="text-gray-400 text-sm">
            You need a Spotify Premium account to use this app
          </p>
        </div>
      </div>
    </div>
  );
} 