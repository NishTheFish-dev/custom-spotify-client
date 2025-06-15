import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * AuthCallback handles the redirect from Spotify after implicit-grant authentication.
 * It parses the URL hash, extracts the access token and expiry time, stores them
 * in the auth store, and navigates the user to the dashboard. If an error occurs,
 * it displays an error message and offers a way back to the login screen.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : '';
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const err = params.get('error');

    if (err) {
      setError(err);
      return;
    }

    if (!accessToken || !expiresIn) {
      setError('Authentication failed. No token returned.');
      return;
    }

    // Store token (no refresh token provided in implicit flow)
    setTokens(accessToken, '', Number(expiresIn));

    // Navigate to dashboard
    navigate('/dashboard', { replace: true });
  }, [navigate, setTokens]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-center p-4">
        <div>
          <h1 className="text-2xl mb-4">Login Error</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <p className="text-xl">Logging you in...</p>
    </div>
  );
}
