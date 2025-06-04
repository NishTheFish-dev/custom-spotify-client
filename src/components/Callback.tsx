import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { SPOTIFY_CONFIG } from '../config/spotify';
import { getPKCEVerifier, clearPKCEVerifier } from '../utils/pkce';

const DEBUG_DELAY = 5000; // 5 seconds delay for debugging

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokens } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const isMounted = useRef(true);
  const hasAttemptedExchange = useRef(false);

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, info]);
  };

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasAttemptedExchange.current) {
        addDebugInfo('Token exchange already attempted, skipping...');
        return;
      }

      hasAttemptedExchange.current = true;

      try {
        addDebugInfo('Starting callback handling...');
        addDebugInfo(`Current URL: ${window.location.href}`);

        // Check for error in URL
        const error = searchParams.get('error');
        if (error) {
          addDebugInfo(`Error in URL: ${error}`);
          throw new Error(`Spotify auth error: ${error}`);
        }

        // Get the authorization code
        const code = searchParams.get('code');
        addDebugInfo(`Authorization code present: ${!!code}`);
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Get the stored verifier
        const verifier = getPKCEVerifier();
        addDebugInfo(`PKCE verifier present: ${!!verifier}`);
        if (!verifier) {
          throw new Error('No PKCE verifier found in storage');
        }

        setStatus('Exchanging code for tokens...');
        addDebugInfo('Preparing token exchange request...');

        // Exchange the code for tokens
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
            client_id: SPOTIFY_CONFIG.CLIENT_ID,
            code_verifier: verifier,
          }).toString(),
        });

        addDebugInfo(`Token exchange response status: ${tokenResponse.status}`);

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          addDebugInfo(`Token exchange error: ${JSON.stringify(errorData)}`);
          throw new Error(errorData.error_description || 'Failed to exchange code for token');
        }

        const tokenData = await tokenResponse.json();
        addDebugInfo('Successfully received token response');
        
        // Verify we have all required tokens
        if (!tokenData.access_token || !tokenData.refresh_token) {
          addDebugInfo('Invalid token response - missing required tokens');
          throw new Error('Invalid token response from Spotify');
        }

        setStatus('Verifying tokens...');
        addDebugInfo('Fetching user profile to verify tokens...');

        // Get user profile to verify the token works
        const profileResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
        });

        addDebugInfo(`Profile fetch response status: ${profileResponse.status}`);
        addDebugInfo(`Profile fetch response headers: ${JSON.stringify(Object.fromEntries(profileResponse.headers.entries()))}`);

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          addDebugInfo(`Profile fetch error: ${JSON.stringify(errorData)}`);
          throw new Error(`Failed to fetch user profile: ${errorData.error?.message || 'Unknown error'}`);
        }

        const profileData = await profileResponse.json();
        addDebugInfo(`Successfully authenticated as: ${profileData.display_name}`);

        // Set the tokens first
        setTokens(
          tokenData.access_token,
          tokenData.refresh_token,
          tokenData.expires_in
        );
        addDebugInfo('Tokens stored in auth store');

        // Store tokens in localStorage as backup
        localStorage.setItem('spotify_access_token', tokenData.access_token);
        localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
        localStorage.setItem('spotify_token_expiry', String(Date.now() + (tokenData.expires_in * 1000)));
        addDebugInfo('Tokens backed up to localStorage');

        // Verify token storage
        const storedToken = localStorage.getItem('spotify_access_token');
        addDebugInfo(`Token storage verification: ${storedToken ? 'Success' : 'Failed'}`);

        setStatus(`Success! Redirecting to dashboard in ${DEBUG_DELAY/1000} seconds...`);
        addDebugInfo('Waiting for debug delay before navigation...');

        // Force navigation after delay
        setTimeout(() => {
          addDebugInfo('Debug delay complete, attempting navigation...');
          addDebugInfo('Current auth state: ' + JSON.stringify({
            hasAccessToken: !!tokenData.access_token,
            hasRefreshToken: !!tokenData.refresh_token,
            expiryTime: tokenData.expires_in,
            storedToken: !!storedToken
          }));

          try {
            addDebugInfo('Attempting navigation with React Router...');
            // Only clear PKCE verifier after successful token storage
            clearPKCEVerifier();
            addDebugInfo('Cleared PKCE verifier');
            
            navigate('/dashboard', { 
              replace: true,
              state: { 
                from: 'callback',
                timestamp: Date.now()
              }
            });
            addDebugInfo('Navigation command executed');
          } catch (navError) {
            console.error('Navigation error:', navError);
            addDebugInfo(`Navigation error: ${navError instanceof Error ? navError.message : 'Unknown error'}`);
            
            // Fallback navigation
            addDebugInfo('Attempting fallback navigation...');
            window.location.replace('/dashboard');
          }
        }, DEBUG_DELAY);

      } catch (error) {
        console.error('Authentication error:', error);
        addDebugInfo(`Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (isMounted.current) {
          setError(error instanceof Error ? error.message : 'Authentication failed');
        }
        clearPKCEVerifier();
      }
    };

    handleCallback();
  }, [searchParams, setTokens, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-4">
        {error ? (
          <>
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Return to Login
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-xl mb-4">{status}</p>
            <div className="bg-gray-800 rounded-lg p-4 text-left max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-2">Debug Information:</h3>
              <ul className="space-y-1">
                {debugInfo.map((info, index) => (
                  <li key={index} className="text-sm text-gray-400">{info}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 