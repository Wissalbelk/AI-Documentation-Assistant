import React, { useState } from 'react';
import axios from 'axios';

const QueryAssistant = ({ onAnalysisComplete, userFiles, googleConnected, loading, setLoading }) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const API_BASE = 'http://localhost:8000';

  // Quick query suggestions
  const quickQueries = [
    "What documents do I need for a university application?",
    "Check my documents for a US student visa",
    "What's required for a job application abroad?",
    "Do I have all documents for a Schengen visa?",
    "Prepare documents for a master's degree application",
    "What do I need for a work permit application?",
    "Check documents for scholarship application"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Get Google auth token if connected
      let authToken = null;
      if (googleConnected) {
        const token = localStorage.getItem('google_auth_token');
        if (token) {
          authToken = token;
        }
      }

      // Prepare request data
      const requestData = {
        query: query,
        user_id: 'default_user'
      };

      if (authToken) {
        requestData.auth_token = authToken;
      }

      // Send analysis request
      const response = await axios.post(`${API_BASE}/analyze`, requestData);

      if (response.data.error) {
        setError(response.data.error);
      } else {
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data);
        }
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.response?.data?.detail || 'Failed to analyze documents. Please try again.');
      
      // Provide mock response for testing
      if (onAnalysisComplete) {
        onAnalysisComplete({
          query: query,
          use_case: "Test Analysis",
          required_documents: ["passport", "transcript", "diploma"],
          matched_documents: [
            {
              type: "passport",
              documents: userFiles.filter(f => f.category === 'passport').map(f => ({
                name: f.name,
                preview: f.preview
              }))
            }
          ],
          missing_documents: ["transcript", "diploma"],
          advice: "This is a test response. Check console for errors.",
          summary: `Test mode: ${userFiles.length} files available`,
          total_documents_analyzed: userFiles.length
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (quickQuery) => {
    setQuery(quickQuery);
  };

  return (
    <div className="card">
      <h3>💬 Ask AI Assistant</h3>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <p>Ask what documents you need for any application:</p>
        
        <div className="quick-queries">
          {quickQueries.map((q, idx) => (
            <button
              key={idx}
              className="query-chip"
              onClick={() => handleQuickQuery(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: 'What documents do I need to apply for a master's degree in computer science in Germany?'"
            className="query-input"
            rows="4"
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            type="submit" 
            className="btn"
            disabled={loading || !query.trim() || (userFiles.length === 0 && !googleConnected)}
            style={{ flex: 1 }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Analyzing Documents...
              </>
            ) : (
              '🤖 Analyze Documents'
            )}
          </button>
          
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            {userFiles.length} files • {googleConnected ? 'Google Docs ✓' : 'Google Docs ✗'}
          </div>
        </div>

        {(!userFiles.length && !googleConnected) && (
          <div className="status-message status-warning">
            ⚠️ Please upload documents or connect Google Docs first
          </div>
        )}

        {error && (
          <div className="status-message status-error">
            ❌ {error}
          </div>
        )}

        <div className="status-message status-info" style={{ fontSize: '0.9rem' }}>
          <strong>💡 Tips for better analysis:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>Be specific about the application type and country</li>
            <li>Mention if it's for study, work, or travel</li>
            <li>Include any special requirements you know about</li>
            <li>The AI will analyze all your uploaded and Google Docs files</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default QueryAssistant;