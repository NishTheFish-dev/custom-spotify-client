export function generateCodeVerifier(length = 128) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return verifier;
}

export async function generateCodeChallenge(verifier: string) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (error) {
    console.error('Error generating code challenge:', error);
    throw new Error('Failed to generate code challenge');
  }
}

export function storePKCEVerifier(verifier: string): boolean {
  try {
    // Clear any existing verifier
    localStorage.removeItem('pkce_verifier');
    
    // Store the new verifier
    localStorage.setItem('pkce_verifier', verifier);
    
    // Verify storage
    const storedVerifier = localStorage.getItem('pkce_verifier');
    return storedVerifier === verifier;
  } catch (error) {
    console.error('Error storing PKCE verifier:', error);
    return false;
  }
}

export function getPKCEVerifier(): string | null {
  try {
    return localStorage.getItem('pkce_verifier');
  } catch (error) {
    console.error('Error retrieving PKCE verifier:', error);
    return null;
  }
}

export function clearPKCEVerifier(): void {
  try {
    localStorage.removeItem('pkce_verifier');
  } catch (error) {
    console.error('Error clearing PKCE verifier:', error);
  }
} 