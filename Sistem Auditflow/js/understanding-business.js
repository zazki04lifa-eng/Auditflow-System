/**
 * AuditFlow - Understanding Business Page (Step 2)
 * Handles business process description input, file upload, and text extraction simulation
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // State Management
    // ============================================

    let currentProject = AuditFlow.getCurrentProject();
    let uploadedFile = null;
    let extractedText = '';
    let version = 1.0;
    let autoSaveTimer = null;

    // ============================================
    // DOM Elements
    // ============================================

    const elements = {
        // Tabs
        tabText: document.getElementById('tab-text'),
        tabUpload: document.getElementById('tab-upload'),
        panelText: document.getElementById('panel-text'),
        panelUpload: document.getElementById('panel-upload'),

        // Text Input
        businessDescription: document.getElementById('business-description'),
        charCount: document.getElementById('char-count'),
        businessDescriptionError: document.getElementById('business-description-error'),

        // Upload
        uploadZone: document.getElementById('upload-zone'),
        fileInput: document.getElementById('file-input'),
        filePreview: document.getElementById('file-preview'),
        fileName: document.getElementById('file-name'),
        fileSize: document.getElementById('file-size'),
        fileStatus: document.getElementById('file-status'),
        removeFile: document.getElementById('remove-file'),
        extractedTextContainer: document.getElementById('extracted-text-container'),
        extractedText: document.getElementById('extracted-text'),
        confidenceScore: document.getElementById('confidence-score'),
        reExtractBtn: document.getElementById('re-extract-btn'),
        useExtractedBtn: document.getElementById('use-extracted-btn'),

        // Edit Section
        editSection: document.getElementById('edit-section'),
        finalDescription: document.getElementById('final-description'),

        // Version & Save
        versionNumber: document.getElementById('version-number'),
        autoSaveIndicator: document.getElementById('auto-save-indicator'),

        // Navigation
        saveDraftBtn: document.getElementById('save-draft-btn'),
        backBtn: document.getElementById('back-btn'),
        nextBtn: document.getElementById('next-btn'),

        // Modals
        successModal: document.getElementById('success-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalMessage: document.getElementById('modal-message'),
        modalBackDashboard: document.getElementById('modal-back-dashboard'),
        modalContinue: document.getElementById('modal-continue'),

        validationModal: document.getElementById('validation-modal'),
        validationMessage: document.getElementById('validation-message'),
        validationDismiss: document.getElementById('validation-dismiss'),
        validationContinue: document.getElementById('validation-continue')
    };

    // ============================================
    // Tab Switching
    // ============================================

    function switchTab(tab) {
        // Update tab buttons
        elements.tabText.classList.toggle('active', tab === 'text');
        elements.tabUpload.classList.toggle('active', tab === 'upload');

        // Update panels
        elements.panelText.classList.toggle('active', tab === 'text');
        elements.panelUpload.classList.toggle('active', tab === 'upload');
    }

    elements.tabText.addEventListener('click', () => switchTab('text'));
    elements.tabUpload.addEventListener('click', () => switchTab('upload'));

    // ============================================
    // Text Input Handling
    // ============================================

    function updateCharCount() {
        const count = elements.businessDescription.value.length;
        elements.charCount.textContent = count;
    }

    elements.businessDescription.addEventListener('input', () => {
        updateCharCount();
        scheduleAutoSave();
    });

    // ============================================
    // File Upload Handling
    // ============================================

    // Drag and drop
    elements.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.add('drag-over');
    });

    elements.uploadZone.addEventListener('dragleave', () => {
        elements.uploadZone.classList.remove('drag-over');
    });

    elements.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    // Click to upload
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    function handleFileUpload(file) {
        // Validate file type
        const validTypes = ['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const validExtensions = ['.pdf', '.doc', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            showError('Format file tidak didukung. Gunakan PDF atau DOCX.');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('Ukuran file terlalu besar. Maksimal 10MB.');
            return;
        }

        uploadedFile = file;
        showFilePreview(file);
        simulateTextExtraction(file);
    }

    function showFilePreview(file) {
        // Hide upload zone, show preview
        elements.uploadZone.classList.add('hidden');
        elements.filePreview.classList.remove('hidden');

        // Set file info
        elements.fileName.textContent = file.name;
        elements.fileSize.textContent = formatFileSize(file.size);

        // Reset status
        const statusBadge = elements.fileStatus.querySelector('.status-badge');
        statusBadge.className = 'status-badge processing';
        statusBadge.innerHTML = `
            <svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
            </svg>
            Memproses...
        `;
    }

    function simulateTextExtraction(file) {
        // Simulate text extraction with dummy data
        setTimeout(() => {
            // Generate dummy extracted text based on file name
            const dummyText = generateDummyExtractedText(file.name);
            extractedText = dummyText;

            // Show extracted text
            elements.extractedText.textContent = dummyText;
            elements.extractedTextContainer.classList.remove('hidden');

            // Set confidence score
            const confidence = Math.floor(Math.random() * 15) + 80; // 80-95%
            elements.confidenceScore.textContent = confidence + '%';

            // Update status to success
            const statusBadge = elements.fileStatus.querySelector('.status-badge');
            statusBadge.className = 'status-badge success';
            statusBadge.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                Selesai
            `;

            // Show edit section
            elements.finalDescription.value = dummyText;
            elements.editSection.classList.remove('hidden');

        }, 2000); // Simulate 2 second processing time
    }

    function generateDummyExtractedText(fileName) {
        // Return different dummy text based on file name
        return `Proses pembelian PT ${fileName.replace(/\.[^/.]+$/, '').toUpperCase()} dimulai ketika departemen pembelian menerima permintaan pembelian dari departemen lain.

Staff pembelian akan memilih vendor dari daftar vendor yang telah disetujui berdasarkan kriteria harga, kualitas, dan waktu pengiriman. Setelah vendor dipilih, staff pembelian membuat purchase order (PO) yang berisi detail barang, jumlah, harga, dan syarat pengiriman.

PO harus disetujui oleh manajer pembelian sebelum dikirim ke vendor. Jika nilai PO melebihi 50 juta rupiah, diperlukan persetujuan tambahan dari direktur keuangan.

Ketika barang diterima di gudang, staff gudang akan memeriksa kuantitas dan kualitas barang dengan membandingkan terhadap PO. Jika sesuai, staff gudang membuat receiving report. Jika terdapat ketidaksesuaian, barang dikembalikan dan vendor diminta mengirim pengganti.

Invoice dari vendor diterima oleh bagian akuntansi dan dicocokkan dengan PO serta receiving report (three-way matching). Jika semua dokumen sesuai, pembayaran diproses sesuai termin yang disepakati.`;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Remove file
    elements.removeFile.addEventListener('click', () => {
        uploadedFile = null;
        extractedText = '';
        elements.uploadZone.classList.remove('hidden');
        elements.filePreview.classList.add('hidden');
        elements.extractedTextContainer.classList.add('hidden');
        elements.editSection.classList.add('hidden');
        elements.fileInput.value = '';
    });

    // Re-extract
    elements.reExtractBtn.addEventListener('click', () => {
        if (uploadedFile) {
            simulateTextExtraction(uploadedFile);
        }
    });

    // Use extracted text
    elements.useExtractedBtn.addEventListener('click', () => {
        elements.businessDescription.value = extractedText;
        updateCharCount();
        switchTab('text');
    });

    // ============================================
    // Auto Save
    // ============================================

    function scheduleAutoSave() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            saveDraft(true);
        }, 2000);
    }

    function saveDraft(showIndicator = false) {
        if (!currentProject) {
            currentProject = AuditFlow.createProject();
        }

        // Save business description
        const description = elements.businessDescription.value || elements.finalDescription.value;
        currentProject.understandingBusiness = {
            description: description,
            version: version,
            lastModified: new Date().toISOString(),
            fileName: uploadedFile ? uploadedFile.name : null
        };

        AuditFlow.saveProject(currentProject);

        // Audit Trail: Record understanding-business.update (Sprint 5)
        recordUnderstandingAudit(description);

        if (showIndicator) {
            elements.autoSaveIndicator.classList.remove('hidden');
            setTimeout(() => {
                elements.autoSaveIndicator.classList.add('hidden');
            }, 2000);
        }
    }

    /**
     * Helper function to record understanding-business audit actions (non-blocking)
     */
    function recordUnderstandingAudit(description) {
        if (typeof AuditTrail === 'undefined') return;

        try {
            const user = AuditFlow.getUser();
            const wordCount = description ? description.trim().split(/\s+/).length : 0;
            AuditTrail.record('understanding-business.update', {
                userId: user ? user.id : null,
                projectId: currentProject ? currentProject.id : null,
                wordCount: wordCount,
                characterCount: description ? description.length : 0,
                hasFile: uploadedFile ? true : false,
                version: version,
                source: 'manual'
            });
        } catch (e) {
            // Silent fail - audit should not affect main functionality
            console.warn('AuditTrail understanding-business action failed:', e);
        }
    }

    // ============================================
    // Validation
    // ============================================

    function validateInput() {
        const description = elements.businessDescription.value || elements.finalDescription.value;
        console.log('[UnderstandingBusiness.validateInput] Description:', description ? description.substring(0, 100) + '...' : 'EMPTY');

        if (!description.trim()) {
            console.log('[UnderstandingBusiness.validateInput] FAILED - empty description');
            return {
                valid: false,
                message: 'Deskripsi proses bisnis tidak boleh kosong.'
            };
        }

        console.log('[UnderstandingBusiness.validateInput] Length:', description.trim().length);
        if (description.trim().length < 50) {
            console.log('[UnderstandingBusiness.validateInput] FAILED - too short:', description.trim().length, '< 50');
            return {
                valid: false,
                message: 'Deskripsi terlalu pendek. Minimal 50 karakter untuk analisis yang memadai.'
            };
        }

        // Check for basic process elements
        const hasProcess = description.toLowerCase().includes('kemudian') ||
            description.toLowerCase().includes('setelah') ||
            description.toLowerCase().includes('lalu');

        console.log('[UnderstandingBusiness.validateInput] Has process words:', hasProcess);
        if (!hasProcess) {
            console.log('[UnderstandingBusiness.validateInput] FAILED - no process words');
            return {
                valid: false,
                message: 'Deskripsi tampaknya tidak mengandung urutan proses yang jelas. Gunakan kata hubung seperti "kemudian", "setelah", "lalu" untuk menghubungkan aktivitas.'
            };
        }

        console.log('[UnderstandingBusiness.validateInput] PASSED - all checks OK');
        return { valid: true };
    }

    // ============================================
    // Navigation
    // ============================================

    // Save Draft button
    elements.saveDraftBtn.addEventListener('click', () => {
        saveDraft(false);
        showSuccessModal('Draft Tersimpan', 'Understanding Business telah disimpan sebagai draft.', false);
    });

    // Back button
    elements.backBtn.addEventListener('click', () => {
        window.location.href = 'create-project.html';
    });

    // Next button
    console.log('[UnderstandingBusiness] Setting up Next button listener');
    elements.nextBtn.addEventListener('click', () => {
        console.log('[UnderstandingBusiness] Next button clicked');

        // Always save and navigate - validation is advisory, not blocking
        console.log('[UnderstandingBusiness] Saving draft and navigating to flowchart-prep.html');
        saveDraft(false);
        window.location.href = 'flowchart-prep.html';
    });

    // ============================================
    // Modals
    // ============================================

    function showSuccessModal(title, message, continueToNext) {
        elements.modalTitle.textContent = title;
        elements.modalMessage.textContent = message;
        elements.successModal.classList.remove('hidden');

        // Update continue button text
        elements.modalContinue.textContent = continueToNext ? 'Lanjutkan ke Step 3' : 'Lanjutkan Edit';
        elements.modalContinue.onclick = () => {
            elements.successModal.classList.add('hidden');
            if (continueToNext) {
                window.location.href = 'flowchart-prep.html';
            }
        };
    }

    function showValidationModal(message) {
        elements.validationMessage.textContent = message;
        elements.validationModal.classList.remove('hidden');
    }

    elements.modalBackDashboard.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    elements.validationDismiss.addEventListener('click', () => {
        elements.validationModal.classList.add('hidden');
    });

    elements.validationContinue.addEventListener('click', () => {
        elements.validationModal.classList.add('hidden');
        saveDraft(false);
        window.location.href = 'flowchart-prep.html';
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
    });

    // ============================================
    // Initialization
    // ============================================

    function init() {
        // Load existing data if available
        if (currentProject && currentProject.understandingBusiness) {
            const data = currentProject.understandingBusiness;
            elements.businessDescription.value = data.description || '';
            elements.finalDescription.value = data.description || '';
            version = data.version || 1.0;
            elements.versionNumber.textContent = version.toFixed(1);

            if (data.fileName) {
                // Show file was uploaded
                elements.fileName.textContent = data.fileName;
                elements.uploadZone.classList.add('hidden');
                elements.filePreview.classList.remove('hidden');
                elements.extractedTextContainer.classList.remove('hidden');
                elements.editSection.classList.remove('hidden');

                const statusBadge = elements.fileStatus.querySelector('.status-badge');
                statusBadge.className = 'status-badge success';
                statusBadge.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Tersimpan
                `;
            }
        }

        updateCharCount();
    }

    init();
});
