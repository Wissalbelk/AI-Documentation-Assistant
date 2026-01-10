// ===== CONFIGURATION =====
const API_URL = 'http://localhost:8000'; // Change this to your backend URL
const DEMO_MODE = true; // Set to false to disable demo mode

// ===== STATE MANAGEMENT =====
let state = {
    uploadedDocuments: [],
    currentQuery: '',
    isProcessing: false,
    currentResults: null
};

// ===== DOM ELEMENTS =====
const elements = {
    // Upload
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    filesList: document.getElementById('filesList'),
    uploadProgress: document.getElementById('uploadProgress'),
    
    // Query
    queryInput: document.getElementById('queryInput'),
    submitQuery: document.getElementById('submitQuery'),
    aiStatus: document.getElementById('aiStatus'),
    
    // Results
    initialState: document.getElementById('initialState'),
    loadingState: document.getElementById('loadingState'),
    resultsContent: document.getElementById('resultsContent'),
    resultsContainer: document.getElementById('resultsContainer'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateUI();
    
    // Check if backend is reachable
    checkBackendConnection();
});

// ===== EVENT LISTENERS =====
function initializeEventListeners() {
    // File upload listeners
    elements.dropZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        elements.dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        elements.dropZone.addEventListener(eventName, highlightDropZone, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        elements.dropZone.addEventListener(eventName, unhighlightDropZone, false);
    });
    
    elements.dropZone.addEventListener('drop', handleDrop, false);
    
    // Query input
    elements.queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !state.isProcessing) {
            processQuery();
        }
    });
    
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// ===== FILE UPLOAD FUNCTIONS =====
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlightDropZone() {
    elements.dropZone.classList.add('drag-over');
}

function unhighlightDropZone() {
    elements.dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

async function handleFiles(files) {
    if (files.length === 0) return;
    
    showToast(`Uploading ${files.length} file(s)...`, 'info');
    
    for (let file of files) {
        await uploadFile(file);
    }
    
    showToast('Upload complete!', 'success');
}

async function uploadFile(file) {
    // Validate file
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showToast(`File ${file.name} is too large (max 10MB)`, 'error');
        return;
    }
    
    // Create unique ID
    const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Add to state immediately for better UX
    const tempDocument = {
        id: fileId,
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileType(file.name),
        status: 'uploading',
        uploadProgress: 0
    };
    
    state.uploadedDocuments.push(tempDocument);
    updateUploadedFilesList();
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', 'demo_user');
    
    try {
        // Simulate progress for demo
        simulateUploadProgress(fileId);
        
        // Actual upload
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
        
        const result = await response.json();
        
        // Update document status
        const docIndex = state.uploadedDocuments.findIndex(doc => doc.id === fileId);
        if (docIndex !== -1) {
            state.uploadedDocuments[docIndex] = {
                ...state.uploadedDocuments[docIndex],
                status: 'uploaded',
                uploadProgress: 100,
                serverId: result.document_id || fileId
            };
        }
        
        updateUploadedFilesList();
        
    } catch (error) {
        console.error('Upload error:', error);
        
        // Update document status to error
        const docIndex = state.uploadedDocuments.findIndex(doc => doc.id === fileId);
        if (docIndex !== -1) {
            state.uploadedDocuments[docIndex].status = 'error';
            state.uploadedDocuments[docIndex].error = error.message;
        }
        
        updateUploadedFilesList();
        showToast(`Failed to upload ${file.name}`, 'error');
    }
}

function simulateUploadProgress(fileId) {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        
        const docIndex = state.uploadedDocuments.findIndex(doc => doc.id === fileId);
        if (docIndex !== -1) {
            state.uploadedDocuments[docIndex].uploadProgress = Math.min(progress, 90);
            updateUploadProgress();
        }
        
        if (progress >= 90) {
            clearInterval(interval);
        }
    }, 200);
}

function updateUploadedFilesList() {
    const filesList = elements.filesList;
    
    if (state.uploadedDocuments.length === 0) {
        filesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No documents uploaded yet</p>
            </div>
        `;
        return;
    }
    
    filesList.innerHTML = state.uploadedDocuments.map(doc => `
        <div class="file-item" data-id="${doc.id}">
            <div class="file-icon">
                ${getFileIcon(doc.type)}
            </div>
            <div class="file-info">
                <div class="file-name">${doc.name}</div>
                <div class="file-size">${doc.size} • ${doc.type.toUpperCase()}</div>
            </div>
            <div class="file-status">
                ${doc.status === 'uploading' ? `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${doc.uploadProgress}%"></div>
                    </div>
                ` : `
                    <span class="status-badge ${doc.status === 'uploaded' ? 'success' : 'processing'}">
                        ${doc.status === 'uploaded' ? '✓ Uploaded' : 'Uploading...'}
                    </span>
                `}
            </div>
        </div>
    `).join('');
}

function updateUploadProgress() {
    document.querySelectorAll('.file-item').forEach(item => {
        const fileId = item.dataset.id;
        const doc = state.uploadedDocuments.find(d => d.id === fileId);
        if (doc && doc.status === 'uploading') {
            const progressBar = item.querySelector('.progress-fill');
            if (progressBar) {
                progressBar.style.width = `${doc.uploadProgress}%`;
            }
        }
    });
}

// ===== QUERY PROCESSING =====
function setExample(type) {
    const examples = {
        university: "I want to apply for a Master's in Computer Science at Stanford University",
        visa: "I need documents for a US work visa (H1-B visa application)",
        job: "Applying for a software engineer position at Google",
        loan: "Need documents for a home mortgage loan application",
        scholarship: "Applying for a full scholarship to study abroad",
        immigration: "Documents needed for Canadian permanent residency application"
    };
    
    elements.queryInput.value = examples[type] || examples.university;
    elements.queryInput.focus();
}

async function processQuery() {
    const query = elements.queryInput.value.trim();
    
    if (!query) {
        showToast('Please enter what you need documents for', 'warning');
        return;
    }
    
    if (state.uploadedDocuments.length === 0) {
        showToast('Please upload some documents first', 'warning');
        return;
    }
    
    // Update state
    state.currentQuery = query;
    state.isProcessing = true;
    state.currentResults = null;
    
    // Update UI
    updateUI();
    showLoadingState();
    
    try {
        // Call backend API
        const response = await fetch(`${API_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                user_id: 'demo_user'
            })
        });
        
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const result = await response.json();
        
        // Update state
        state.currentResults = result;
        state.isProcessing = false;
        
        // Update UI
        updateUI();
        showResults(result);
        
        showToast('Analysis complete!', 'success');
        
    } catch (error) {
        console.error('Query error:', error);
        state.isProcessing = false;
        updateUI();
        
        // Show error or demo data
        if (DEMO_MODE) {
            showDemoResults(query);
        } else {
            showToast('Failed to process query. Please try again.', 'error');
            showInitialState();
        }
    }
}

// ===== UI UPDATES =====
function updateUI() {
    // Update query button
    elements.submitQuery.disabled = state.isProcessing || !elements.queryInput.value.trim();
    elements.submitQuery.innerHTML = state.isProcessing 
        ? '<i class="fas fa-spinner fa-spin"></i> Processing...' 
        : '<i class="fas fa-paper-plane"></i> Analyze Documents';
    
    // Update AI status
    const statusText = elements.aiStatus.querySelector('.status-text');
    const statusIcon = elements.aiStatus.querySelector('.status-icon');
    
    if (state.isProcessing) {
        statusText.textContent = 'AI is analyzing...';
        statusIcon.style.color = '#f59e0b';
    } else {
        statusText.textContent = 'AI Assistant Ready';
        statusIcon.style.color = '#4ade80';
    }
}

function showInitialState() {
    elements.initialState.style.display = 'flex';
    elements.loadingState.style.display = 'none';
    elements.resultsContent.style.display = 'none';
}

function showLoadingState() {
    elements.initialState.style.display = 'none';
    elements.loadingState.style.display = 'flex';
    elements.resultsContent.style.display = 'none';
    
    // Animate loading steps
    const steps = document.querySelectorAll('.loading-steps .step');
    let currentStep = 0;
    
    const stepInterval = setInterval(() => {
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.add('active');
                step.querySelector('i').className = 'fas fa-spinner fa-spin';
            } else if (index < currentStep) {
                step.classList.remove('active');
                step.querySelector('i').className = 'fas fa-check';
            } else {
                step.classList.remove('active');
                step.querySelector('i').className = 'fas fa-sync';
            }
        });
        
        currentStep = (currentStep + 1) % steps.length;
        
        if (!state.isProcessing) {
            clearInterval(stepInterval);
        }
    }, 800);
}

function showResults(result) {
    elements.initialState.style.display = 'none';
    elements.loadingState.style.display = 'none';
    elements.resultsContent.style.display = 'block';
    
    // Format results for display
    const matchedDocs = result.matched_documents || [];
    const missingDocs = result.missing_documents || [];
    const guidance = result.guidance || {};
    
    // Calculate statistics
    const totalRequired = matchedDocs.length + missingDocs.length;
    const completionRate = totalRequired > 0 ? Math.round((matchedDocs.length / totalRequired) * 100) : 0;
    
    // Build results HTML
    let html = `
        <div class="results-header">
            <h2><i class="fas fa-check-circle"></i> Analysis Complete</h2>
            <p>Your query: "${result.query || state.currentQuery}"</p>
            <div class="completion-rate">
                <div class="completion-bar">
                    <div class="completion-fill" style="width: ${completionRate}%"></div>
                </div>
                <p>${completionRate}% Complete (${matchedDocs.length} of ${totalRequired} documents found)</p>
            </div>
        </div>
        
        <div class="results-grid">
    `;
    
    // Matched Documents Card
    html += `
        <div class="result-card matched">
            <div class="card-header">
                <i class="fas fa-check-circle"></i>
                <h3>Documents You Have</h3>
            </div>
            <div class="document-list">
    `;
    
    if (matchedDocs.length > 0) {
        matchedDocs.forEach(doc => {
            html += `
                <div class="document-item matched">
                    <div class="document-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="document-info">
                        <div class="document-name">${doc.type || 'Document'}</div>
                        <div class="document-type">${doc.filename || 'Matched from your uploads'}</div>
                    </div>
                    ${doc.confidence ? `
                        <div class="confidence-badge" style="color: #10b981;">
                            ${Math.round(doc.confidence * 100)}% match
                        </div>
                    ` : ''}
                </div>
            `;
        });
    } else {
        html += `
            <div class="empty-state" style="padding: 1rem;">
                <i class="fas fa-search"></i>
                <p>No matching documents found</p>
            </div>
        `;
    }
    
    html += `</div></div>`;
    
    // Missing Documents Card
    html += `
        <div class="result-card missing">
            <div class="card-header">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Missing Documents</h3>
            </div>
            <div class="document-list">
    `;
    
    if (missingDocs.length > 0) {
        missingDocs.forEach(docType => {
            html += `
                <div class="document-item missing">
                    <div class="document-icon">
                        <i class="fas fa-file-exclamation"></i>
                    </div>
                    <div class="document-info">
                        <div class="document-name">${formatDocumentType(docType)}</div>
                        <div class="document-type">Required document</div>
                    </div>
                    <div class="confidence-badge" style="color: #ef4444;">
                        Required
                    </div>
                </div>
            `;
        });
    } else {
        html += `
            <div class="empty-state" style="padding: 1rem;">
                <i class="fas fa-check-circle"></i>
                <p>All required documents are available!</p>
            </div>
        `;
    }
    
    html += `</div></div>`;
    
    // Guidance Card (only if there are missing documents)
    if (missingDocs.length > 0 && Object.keys(guidance).length > 0) {
        html += `
            <div class="result-card guidance">
                <div class="card-header">
                    <i class="fas fa-lightbulb"></i>
                    <h3>How to Get Missing Documents</h3>
                </div>
                <div class="guidance-grid">
        `;
        
        missingDocs.forEach(docType => {
            const guide = guidance[docType] || {};
            html += `
                <div class="guidance-item">
                    <div class="guidance-header">
                        <i class="fas fa-question-circle"></i>
                        <h4>${formatDocumentType(docType)}</h4>
                    </div>
                    <div class="guidance-details">
                        ${guide.where ? `
                            <div class="guidance-detail">
                                <i class="fas fa-map-marker-alt"></i>
                                <span><strong>Where:</strong> ${guide.where}</span>
                            </div>
                        ` : ''}
                        ${guide.time ? `
                            <div class="guidance-detail">
                                <i class="fas fa-clock"></i>
                                <span><strong>Time:</strong> ${guide.time}</span>
                            </div>
                        ` : ''}
                        ${guide.cost ? `
                            <div class="guidance-detail">
                                <i class="fas fa-money-bill-wave"></i>
                                <span><strong>Cost:</strong> ${guide.cost}</span>
                            </div>
                        ` : ''}
                        ${guide.tips ? `
                            <div class="guidance-detail">
                                <i class="fas fa-lightbulb"></i>
                                <span><strong>Tips:</strong> ${guide.tips}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    html += `</div>`; // Close results-grid
    
    // Summary
    if (result.summary || result.next_steps) {
        html += `
            <div class="summary-box">
                <h3><i class="fas fa-clipboard-list"></i> Summary & Next Steps</h3>
                <p>${result.summary || 'Based on your query and available documents:'}</p>
                ${result.next_steps ? `
                    <ul style="margin-top: 1rem; padding-left: 1.5rem;">
                        ${result.next_steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `;
    }
    
    elements.resultsContent.innerHTML = html;
    
    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// ===== DEMO FUNCTIONS =====
function runDemo() {
    // Reset state
    state.uploadedDocuments = [];
    state.currentQuery = '';
    state.currentResults = null;
    
    // Add demo documents
    const demoDocuments = [
        { name: 'Passport_Scan.pdf', size: '2.1 MB', type: 'pdf', status: 'uploaded' },
        { name: 'Academic_Transcript_2023.pdf', size: '1.8 MB', type: 'pdf', status: 'uploaded' },
        { name: 'Bachelor_Diploma.jpg', size: '3.2 MB', type: 'image', status: 'uploaded' },
        { name: 'CV_Resume.docx', size: '245 KB', type: 'doc', status: 'uploaded' }
    ];
    
    state.uploadedDocuments = demoDocuments.map((doc, index) => ({
        id: 'demo_' + index,
        ...doc,
        uploadProgress: 100
    }));
    
    // Set demo query
    setExample('university');
    
    // Update UI
    updateUploadedFilesList();
    updateUI();
    
    showToast('Demo mode activated! Upload some demo documents.', 'success');
    
    // Auto-process after a delay
    setTimeout(() => {
        processQuery();
    }, 1000);
}

function showDemoResults(query) {
    const demoResult = {
        query: query,
        application_type: "university",
        required_documents: ["passport", "transcript", "diploma", "cv", "recommendation_letter", "english_test"],
        matched_documents: [
            { type: "passport", filename: "Passport_Scan.pdf", confidence: 0.95 },
            { type: "transcript", filename: "Academic_Transcript_2023.pdf", confidence: 0.92 },
            { type: "diploma", filename: "Bachelor_Diploma.jpg", confidence: 0.88 },
            { type: "cv", filename: "CV_Resume.docx", confidence: 0.90 }
        ],
        missing_documents: ["recommendation_letter", "english_test"],
        guidance: {
            recommendation_letter: {
                where: "Your university professors or previous employers",
                time: "2-4 weeks",
                cost: "Usually free",
                tips: "Contact them well in advance, provide your CV and purpose"
            },
            english_test: {
                where: "IELTS/TOEFL test centers",
                time: "Test dates every month, results in 2 weeks",
                cost: "$200-$300",
                tips: "Book early, minimum score requirements vary by university"
            }
        },
        summary: "You have most documents ready for university application. Need recommendation letters and English test scores.",
        next_steps: [
            "Request recommendation letters from 2-3 professors",
            "Register for IELTS/TOEFL test",
            "Check specific university deadlines",
            "Prepare statement of purpose"
        ]
    };
    
    state.currentResults = demoResult;
    state.isProcessing = false;
    
    updateUI();
    showResults(demoResult);
    
    showToast('Demo results loaded!', 'success');
}

// ===== UTILITY FUNCTIONS =====
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['txt', 'rtf'].includes(ext)) return 'text';
    return 'other';
}

function getFileIcon(type) {
    const icons = {
        image: '<i class="fas fa-file-image" style="color: #4ade80;"></i>',
        pdf: '<i class="fas fa-file-pdf" style="color: #ef4444;"></i>',
        doc: '<i class="fas fa-file-word" style="color: #3b82f6;"></i>',
        text: '<i class="fas fa-file-alt" style="color: #6b7280;"></i>',
        other: '<i class="fas fa-file" style="color: #9ca3af;"></i>'
    };
    return icons[type] || icons.other;
}

function formatDocumentType(type) {
    return type.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function showToast(message, type = 'info') {
    const toast = elements.toast;
    
    // Set message and type
    toast.textContent = message;
    toast.className = 'toast';
    toast.classList.add(type);
    
    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_URL}/`, { method: 'GET' });
        if (response.ok) {
            console.log('Backend connected successfully');
            showToast('Connected to AI backend', 'success');
        }
    } catch (error) {
        console.warn('Backend connection failed:', error);
        showToast('Running in demo mode. Backend not connected.', 'warning');
    }
}

// ===== EXPORT FUNCTIONS FOR HTML =====
// Make functions available globally for onclick attributes
window.setExample = setExample;
window.processQuery = processQuery;
window.runDemo = runDemo;