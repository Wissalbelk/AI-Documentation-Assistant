import React, { useState, useEffect } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import GoogleDocsConnect from './components/GoogleDocsConnect';
import QueryAssistant from './components/QueryAssistant';
import ResultsDisplay from './components/ResultsDisplay';

function App() {
  const [userFiles, setUserFiles] = useState([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check for saved Google auth token
  useEffect(() => {
    const savedToken = localStorage.getItem('google_auth_token');
    if (savedToken) {
      setGoogleConnected(true);
    }
  }, []);

  const handleFilesUpdated = (files) => {
    setUserFiles(files);
  };

  const handleGoogleConnected = (connected) => {
    setGoogleConnected(connected);
  };

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 AI Document Assistant</h1>
        <p>Upload documents, connect Google Docs, and get instant analysis for any application</p>
      </header>

      <div className="container">
        <div className="main-grid">
          {/* Left Panel - Upload & Connection */}
          <div className="left-panel">
            <FileUpload onFilesUpdated={handleFilesUpdated} />
            <GoogleDocsConnect 
              onConnectionChange={handleGoogleConnected}
              isConnected={googleConnected}
            />
          </div>

          {/* Right Panel - Query & Results */}
          <div className="right-panel">
            <QueryAssistant 
              onAnalysisComplete={handleAnalysisComplete}
              userFiles={userFiles}
              googleConnected={googleConnected}
              loading={loading}
              setLoading={setLoading}
            />
            
            {analysisResult && (
              <ResultsDisplay result={analysisResult} />
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="card">
          <h3>📊 Current Status</h3>
          <div className="two-column">
            <div>
              <p><strong>Uploaded Files:</strong> {userFiles.length}</p>
              <p><strong>Google Docs:</strong> {googleConnected ? 'Connected' : 'Not Connected'}</p>
            </div>
            <div>
              <p><strong>API Status:</strong> 
                <span style={{ color: '#4CAF50', marginLeft: '10px' }}>● Backend Connected</span>
              </p>
              <p><strong>Ready to Analyze:</strong> 
                <span style={{ 
                  color: (userFiles.length > 0 || googleConnected) ? '#4CAF50' : '#ff9800',
                  marginLeft: '10px'
                }}>
                  ● {(userFiles.length > 0 || googleConnected) ? 'Yes' : 'Upload files or connect Google Docs'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;