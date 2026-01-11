import React, { useState, useCallback } from 'react';
import axios from 'axios';

const FileUpload = ({ onFilesUpdated }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const API_BASE = 'http://localhost:8000';

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      handleUpload(selectedFiles);
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleUpload(droppedFiles);
    }
  }, []);

  const handleUpload = async (fileList) => {
    setUploading(true);
    const uploadedFiles = [];
    
    for (const file of fileList) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g|txt|docx?)$/i)) {
        alert(`File type not supported: ${file.name}`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(`${API_BASE}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          uploadedFiles.push(response.data.document);
          console.log(`Uploaded: ${file.name}`);
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    
    if (uploadedFiles.length > 0) {
      // Get updated files list
      try {
        const response = await axios.get(`${API_BASE}/files`);
        setFiles(response.data.files);
        if (onFilesUpdated) {
          onFilesUpdated(response.data.files);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
  };

  const removeFile = async (fileId) => {
    // Note: Backend needs delete endpoint implementation
    alert('Delete functionality requires backend implementation');
  };

  return (
    <div className="card">
      <h3>📤 Upload Documents</h3>
      <p>Upload images, PDFs, or documents for analysis</p>
      
      <div 
        className={`file-input-container ${dragOver ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="file-input"
          onChange={handleFileChange}
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="file-label">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div>
            <strong>Click to upload</strong> or drag and drop
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Supports: PDF, PNG, JPG, TXT, DOC, DOCX
          </div>
        </label>
      </div>

      {uploading && (
        <div className="loading">
          <div className="spinner"></div>
          <div className="loading-text">Processing files with OCR...</div>
        </div>
      )}

      {files.length > 0 && (
        <div className="document-list">
          <h4>Uploaded Files ({files.length})</h4>
          {files.map((file, index) => (
            <div key={index} className="document-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{file.name}</strong>
                  <div className="doc-type-badge">{file.category}</div>
                </div>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => removeFile(file.id)}
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
              <div className="doc-preview">{file.preview}</div>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                {file.ocr_processed ? '✓ OCR Processed' : 'Text Document'} • {Math.ceil(file.file_size / 1024)} KB
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;