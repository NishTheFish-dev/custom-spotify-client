import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SPOTIFY_CONFIG } from '../config/spotify';
import { generateCodeVerifier, generateCodeChallenge, storePKCEVerifier, clearPKCEVerifier } from '../utils/pkce';
import { useAuthStore } from '../store/authStore';

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

      // Clear any existing PKCE data before starting new login
      clearPKCEVerifier();

      // Generate PKCE values
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      // Store verifier
      if (!storePKCEVerifier(verifier)) {
        throw new Error('Failed to store authentication data');
      }

      // Prepare authorization URL
      const params = new URLSearchParams({
        client_id: SPOTIFY_CONFIG.CLIENT_ID,
        response_type: 'code',
        redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        scope: SPOTIFY_CONFIG.SCOPES.join(' '),
        show_dialog: 'true', // Force consent screen
      });

      // Redirect to Spotify
      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start login process');
      clearPKCEVerifier();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
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