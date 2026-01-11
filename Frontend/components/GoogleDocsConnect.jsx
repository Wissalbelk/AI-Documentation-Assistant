import React, { useState } from 'react';
import axios from 'axios';

const GoogleDocsConnect = ({ onConnectionChange, isConnected }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const API_BASE = 'http://localhost:8000';

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    try {
      // Get authorization URL from backend
      const response = await axios.get(`${API_BASE}/auth/url`);
      const authUrl = response.data.auth_url;

      // Open popup for OAuth
      const popup = window.open(
        authUrl,
        'Google OAuth',
        'width=600,height=600,menubar=no,toolbar=no,location=no,status=no'
      );

      // Poll for popup closure
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          
          // Check if token is in localStorage (popup should have saved it)
          const token = localStorage.getItem('google_auth_token');
          if (token) {
            if (onConnectionChange) {
              onConnectionChange(true);
            }
            alert('✅ Google Docs connected successfully!');
          } else {
            setError('Authorization cancelled or failed');
          }
          setConnecting(false);
        }
      }, 500);

      // Alternative: Listen for message from popup
      window.addEventListener('message', (event) => {
        if (event.origin === window.location.origin && event.data.type === 'oauth_token') {
          localStorage.setItem('google_auth_token', JSON.stringify(event.data.token));
          if (onConnectionChange) {
            onConnectionChange(true);
          }
          if (popup) popup.close();
          setConnecting(false);
        }
      });

    } catch (error) {
      console.error('Connection error:', error);
      setError('Failed to connect to Google Docs. Please check your credentials.');
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google_auth_token');
    if (onConnectionChange) {
      onConnectionChange(false);
    }
    alert('Google Docs disconnected');
  };

  // For testing without actual OAuth
  const handleMockConnect = () => {
    const mockToken = {
      access_token: 'mock_token_for_testing',
      refresh_token: 'mock_refresh_token',
      token_uri: 'https://oauth2.googleapis.com/token',
      client_id: 'mock_client_id',
      client_secret: 'mock_secret',
      scopes: SCOPES,
      expiry: new Date(Date.now() + 3600000).toISOString()
    };
    localStorage.setItem('google_auth_token', JSON.stringify(mockToken));
    if (onConnectionChange) {
      onConnectionChange(true);
    }
    alert('⚠️ Mock connection for testing only. Use real OAuth in production.');
  };

  return (
    <div className="card">
      <h3>☁️ Connect Google Docs</h3>
      
      {isConnected ? (
        <div className="status-message status-success">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong>✅ Connected to Google Docs</strong>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Your Google Docs and Drive files are accessible for analysis.
              </p>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleDisconnect}
              disabled={connecting}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: '1rem' }}>
            Connect your Google account to analyze documents from Google Docs and Drive.
          </p>
          
          <button 
            className="btn"
            onClick={handleConnect}
            disabled={connecting}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {connecting ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Connecting to Google...
              </>
            ) : (
              '🔗 Connect Google Account'
            )}
          </button>

          {/* For testing only - remove in production */}
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ fontSize: '0.9rem', color: '#666', cursor: 'pointer' }}>
              ⚠️ Testing without Google OAuth?
            </summary>
            <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                For testing without actual Google OAuth setup:
              </p>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleMockConnect}
                style={{ fontSize: '0.9rem' }}
              >
                Use Mock Connection
              </button>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                Note: This will only work with mock data. For real Google Docs access,
                you need to set up OAuth credentials in Google Cloud Console.
              </p>
            </div>
          </details>
        </>
      )}

      {error && (
        <div className="status-message status-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      <div className="status-message status-info" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
        <strong>ℹ️ What happens when you connect?</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>We request read-only access to your Google Docs and Drive</li>
          <li>Your documents are analyzed locally - we don't store them</li>
          <li>Only document text content is extracted for analysis</li>
        </ul>
      </div>
    </div>
  );
};

// Mock scopes for testing
const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];

export default GoogleDocsConnect;