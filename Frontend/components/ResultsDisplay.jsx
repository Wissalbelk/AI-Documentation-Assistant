import React from 'react';

const ResultsDisplay = ({ result }) => {
  if (!result) return null;

  const { 
    query, 
    use_case, 
    required_documents = [], 
    matched_documents = [], 
    missing_documents = [], 
    advice, 
    summary, 
    total_documents_analyzed,
    fallback_mode
  } = result;

  // Calculate completion percentage
  const completionPercent = required_documents.length > 0 
    ? Math.round((matched_documents.length / required_documents.length) * 100)
    : 0;

  return (
    <div className="card results-container">
      <div className="results-header">
        <h3>📋 Analysis Results</h3>
        <div className="summary-badge">
          {summary}
        </div>
      </div>

      {fallback_mode && (
        <div className="status-message status-warning">
          ⚠️ Fallback mode: Some AI features may be limited. Check your OpenAI API key.
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h4>🎯 Use Case</h4>
        <div className="use-case">
          {use_case}
        </div>
        <p style={{ marginTop: '0.5rem', color: '#666' }}>
          <strong>Your query:</strong> "{query}"
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{ margin: '1.5rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Document Completion</span>
          <span style={{ fontWeight: 'bold', color: completionPercent >= 80 ? '#4CAF50' : 
                       completionPercent >= 50 ? '#FF9800' : '#F44336' }}>
            {completionPercent}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ 
              width: `${completionPercent}%`,
              background: completionPercent >= 80 ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' :
                        completionPercent >= 50 ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)' :
                        'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)'
            }}
          ></div>
        </div>
      </div>

      <div className="two-column">
        {/* Documents Found */}
        <div>
          <h4 style={{ color: '#4CAF50' }}>✅ Documents Found</h4>
          {matched_documents.length > 0 ? (
            <div className="document-list">
              {matched_documents.map((match, idx) => (
                <div key={idx} className="document-item">
                  <div className="doc-type-badge" style={{ 
                    background: '#d4edda', 
                    color: '#155724' 
                  }}>
                    {match.type.replace('_', ' ').toUpperCase()}
                  </div>
                  {match.documents.map((doc, docIdx) => (
                    <div key={docIdx} style={{ marginTop: '0.5rem' }}>
                      <div><strong>{doc.name}</strong></div>
                      <div className="doc-preview">{doc.preview}</div>
                      {doc.source && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                          Source: {doc.source}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No matching documents found in your collection
            </div>
          )}
        </div>

        {/* Documents Missing */}
        <div>
          <h4 style={{ color: '#F44336' }}>❌ Documents Missing</h4>
          {missing_documents.length > 0 ? (
            <ul className="missing-list">
              {missing_documents.map((doc, idx) => (
                <li key={idx} className="missing-item">
                  <strong>{doc.replace('_', ' ').title()}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <div className="status-message status-success">
              🎉 Congratulations! You have all required documents.
            </div>
          )}
        </div>
      </div>

      {/* Requirements Summary */}
      <div style={{ margin: '1.5rem 0', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <h4>📝 Requirements Summary</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {required_documents.map((doc, idx) => {
            const isFound = matched_documents.some(m => m.type === doc);
            return (
              <span 
                key={idx}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '15px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  background: isFound ? '#d4edda' : '#f8d7da',
                  color: isFound ? '#155724' : '#721c24',
                  border: `1px solid ${isFound ? '#c3e6cb' : '#f5c6cb'}`
                }}
              >
                {isFound ? '✓ ' : '✗ '}{doc.replace('_', ' ').title()}
              </span>
            );
          })}
        </div>
      </div>

      {/* Advice Section */}
      <div className="advice-box">
        <h5>💡 Next Steps & Advice</h5>
        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
          {advice}
        </div>
      </div>

      {/* Analysis Metadata */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '0.9rem', 
        color: '#666',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid #eee'
      }}>
        <div>
          <strong>Analysis Details:</strong>
          <div>Total documents analyzed: {total_documents_analyzed || 0}</div>
          <div>Required documents: {required_documents.length}</div>
          <div>Found: {matched_documents.length} • Missing: {missing_documents.length}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div>Status: {completionPercent >= 80 ? 'Ready to apply' : 
                       completionPercent >= 50 ? 'Partially ready' : 'Needs preparation'}</div>
          <div>Completion: {completionPercent}%</div>
        </div>
      </div>

      {/* Export/Next Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #eee'
      }}>
        <button className="btn btn-success">
          📥 Export Document List
        </button>
        <button className="btn">
          📋 Create Checklist
        </button>
        <button className="btn btn-secondary">
          🔍 Search for Templates
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;