/**
 * AuditFlow - Create Project Page JavaScript
 * Version: 1.0 (MVP)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // Check Authentication
    // ============================================
    if (!AuditFlow.isAuthenticated()) {
        Navigation.goToLogin();
        return;
    }

    // ============================================
    // DOM Elements
    // ============================================
    const projectForm = document.getElementById('project-form');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const autoSaveIndicator = document.getElementById('auto-save-indicator');
    const successModal = document.getElementById('success-modal');
    const modalBackDashboard = document.getElementById('modal-back-dashboard');
    const modalContinue = document.getElementById('modal-continue');

    // Form fields
    const fields = {
        projectName: document.getElementById('project-name'),
        auditorName: document.getElementById('auditor-name'),
        companyName: document.getElementById('company-name'),
        industry: document.getElementById('industry'),
        industryOther: document.getElementById('industry-other'),
        auditFrequency: document.getElementById('audit-frequency'),
        businessCycle: document.getElementById('business-cycle'),
        businessCycleOther: document.getElementById('business-cycle-other'),
        startDate: document.getElementById('start-date'),
        endDate: document.getElementById('end-date'),
        notes: document.getElementById('notes')
    };

    // Error elements
    const errors = {
        projectName: document.getElementById('project-name-error'),
        auditorName: document.getElementById('auditor-name-error'),
        companyName: document.getElementById('company-name-error'),
        industry: document.getElementById('industry-error'),
        industryOther: document.getElementById('industry-other-error'),
        auditFrequency: document.getElementById('audit-frequency-error'),
        businessCycle: document.getElementById('business-cycle-error'),
        businessCycleOther: document.getElementById('business-cycle-other-error'),
        startDate: document.getElementById('start-date-error'),
        endDate: document.getElementById('end-date-error')
    };

    // Industry other group (shown when "Lainnya" is selected)
    const industryOtherGroup = document.getElementById('industry-other-group');

    // Business cycle other group (shown when "Other" is selected)
    const businessCycleOtherGroup = document.getElementById('business-cycle-other-group');

    // ============================================
    // Initialize Form
    // ============================================
    function initForm() {
        // Set default auditor name from logged-in user
        const user = AuditFlow.getUser();
        if (user) {
            fields.auditorName.value = user.name;
        }

        // Set min date for start date (today)
        const today = new Date().toISOString().split('T')[0];
        fields.startDate.setAttribute('min', today);
        fields.endDate.setAttribute('min', today);

        // Set default dates (3 months from now)
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        fields.endDate.value = threeMonthsLater.toISOString().split('T')[0];

        // Setup auto-save
        setupAutoSave();

        // Setup validation
        setupValidation();

        // Setup event listeners
        setupEventListeners();
    }

    // ============================================
    // Auto-Save Functionality
    // ============================================
    let autoSaveTimeout = null;

    function setupAutoSave() {
        // Auto-save on any form change (debounced 2 seconds)
        Object.values(fields).forEach(field => {
            if (field) {
                field.addEventListener('input', () => {
                    clearTimeout(autoSaveTimeout);
                    autoSaveTimeout = setTimeout(() => {
                        if (validateForm(false)) {
                            showAutoSaveIndicator();
                        }
                    }, 2000);
                });
            }
        });
    }

    function showAutoSaveIndicator() {
        autoSaveIndicator.classList.remove('hidden');
        setTimeout(() => {
            autoSaveIndicator.classList.add('hidden');
        }, 3000);
    }

    // ============================================
    // Validation
    // ============================================
    function setupValidation() {
        // Real-time validation on blur
        fields.projectName.addEventListener('blur', () => validateField('projectName', 'Project name wajib diisi'));
        fields.auditorName.addEventListener('blur', () => validateField('auditorName', 'Nama auditor wajib diisi'));
        fields.companyName.addEventListener('blur', () => validateField('companyName', 'Nama perusahaan wajib diisi'));
        fields.industry.addEventListener('blur', () => validateSelect('industry', 'Industri wajib dipilih'));
        fields.auditFrequency.addEventListener('blur', () => validateSelect('auditFrequency', 'Frekuensi audit wajib dipilih'));
        fields.businessCycle.addEventListener('blur', () => validateSelect('businessCycle', 'Siklus bisnis wajib dipilih'));
        fields.startDate.addEventListener('blur', validateDates);
        fields.endDate.addEventListener('blur', validateDates);

        // Industry other validation (only when "Lainnya" is selected)
        fields.industryOther.addEventListener('blur', () => {
            if (fields.industry.value === 'Lainnya') {
                validateField('industryOther', 'Industri wajib diisi');
            }
        });

        // Business cycle other validation (only when "Other" is selected)
        fields.businessCycleOther.addEventListener('blur', () => {
            if (fields.businessCycle.value === 'Other') {
                validateField('businessCycleOther', 'Siklus bisnis wajib diisi');
            }
        });

        // Clear error on input
        Object.keys(fields).forEach(key => {
            if (fields[key]) {
                fields[key].addEventListener('input', () => clearError(key));
            }
        });
    }

    function validateField(fieldName, message) {
        const field = fields[fieldName];
        const error = errors[fieldName];

        if (!field.value.trim()) {
            showError(fieldName, message);
            return false;
        }

        clearError(fieldName);
        return true;
    }

    function validateSelect(fieldName, message) {
        const field = fields[fieldName];
        const error = errors[fieldName];

        if (!field.value) {
            showError(fieldName, message);
            return false;
        }

        clearError(fieldName);
        return true;
    }

    function validateDates() {
        const startDate = new Date(fields.startDate.value);
        const endDate = new Date(fields.endDate.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let isValid = true;

        if (!fields.startDate.value) {
            showError('startDate', 'Tanggal mulai wajib diisi');
            isValid = false;
        } else if (startDate < today) {
            showError('startDate', 'Tanggal mulai tidak boleh di masa lalu');
            isValid = false;
        } else {
            clearError('startDate');
        }

        if (!fields.endDate.value) {
            showError('endDate', 'Tanggal selesai wajib diisi');
            isValid = false;
        } else if (endDate < startDate) {
            showError('endDate', 'Tanggal selesai tidak boleh sebelum tanggal mulai');
            isValid = false;
        } else {
            clearError('endDate');
        }

        return isValid;
    }

    function showError(fieldName, message) {
        const field = fields[fieldName];
        const error = errors[fieldName];

        if (field) {
            field.classList.add('has-error');
        }
        if (error) {
            error.textContent = message;
        }
    }

    function clearError(fieldName) {
        const field = fields[fieldName];
        const error = errors[fieldName];

        if (field) {
            field.classList.remove('has-error');
        }
        if (error) {
            error.textContent = '';
        }
    }

    function clearAllErrors() {
        Object.keys(errors).forEach(key => clearError(key));
    }

    function validateForm(showErrors = true) {
        let isValid = true;

        // Validate required fields
        if (!fields.projectName.value.trim()) {
            if (showErrors) showError('projectName', 'Project name wajib diisi');
            isValid = false;
        }

        if (!fields.auditorName.value.trim()) {
            if (showErrors) showError('auditorName', 'Nama auditor wajib diisi');
            isValid = false;
        }

        if (!fields.companyName.value.trim()) {
            if (showErrors) showError('companyName', 'Nama perusahaan wajib diisi');
            isValid = false;
        }

        if (!fields.industry.value) {
            if (showErrors) showError('industry', 'Industri wajib dipilih');
            isValid = false;
        }

        // Validate industry other if "Lainnya" is selected
        if (fields.industry.value === 'Lainnya' && !fields.industryOther.value.trim()) {
            if (showErrors) showError('industryOther', 'Industri wajib diisi');
            isValid = false;
        }

        if (!fields.auditFrequency.value) {
            if (showErrors) showError('auditFrequency', 'Frekuensi audit wajib dipilih');
            isValid = false;
        }

        if (!fields.businessCycle.value) {
            if (showErrors) showError('businessCycle', 'Siklus bisnis wajib dipilih');
            isValid = false;
        }

        // Validate business cycle other if "Other" is selected
        if (fields.businessCycle.value === 'Other' && !fields.businessCycleOther.value.trim()) {
            if (showErrors) showError('businessCycleOther', 'Siklus bisnis wajib diisi');
            isValid = false;
        }

        // Validate dates
        if (!validateDates() && showErrors) {
            isValid = false;
        }

        return isValid;
    }

    // ============================================
    // Get Form Data
    // ============================================
    function getFormData() {
        // Determine final industry value
        const industryValue = fields.industry.value === 'Lainnya'
            ? fields.industryOther.value.trim()
            : fields.industry.value;

        // Determine final business cycle value
        const businessCycleValue = fields.businessCycle.value === 'Other'
            ? fields.businessCycleOther.value.trim()
            : fields.businessCycle.value;

        return {
            projectName: fields.projectName.value.trim(),
            auditorName: fields.auditorName.value.trim(),
            companyName: fields.companyName.value.trim(),
            industry: industryValue,
            auditFrequency: fields.auditFrequency.value,
            businessCycle: businessCycleValue,
            startDate: fields.startDate.value,
            endDate: fields.endDate.value,
            notes: fields.notes.value.trim(),
            status: 'draft',
            progress: 15, // Step 1 of 7 ≈ 15%
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    // ============================================
    // Save Draft
    // ============================================
    async function saveDraft() {
        // Disable button to prevent multiple submissions
        saveDraftBtn.disabled = true;
        const originalContent = saveDraftBtn.innerHTML;
        saveDraftBtn.innerHTML = `
            <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32">
                    <animate attributeName="stroke-dashoffset" dur="0.8s" from="32" to="0" repeatCount="indefinite"/>
                </circle>
            </svg>
            Menyimpan...
        `;

        try {
            if (!validateForm()) {
                Utils.showAlert('form-alert', 'Mohon lengkapi semua field yang wajib diisi', 'error');
                return;
            }

            const formData = getFormData();

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Store in localStorage (dummy)
            const savedProjects = JSON.parse(localStorage.getItem('auditflow_projects') || '[]');
            savedProjects.push({
                id: Utils.generateId(),
                ...formData
            });
            localStorage.setItem('auditflow_projects', JSON.stringify(savedProjects));

            // Show success modal
            showSuccessModal('Draft Tersimpan', 'Project Anda telah disimpan sebagai draft.', false);
        } catch (error) {
            console.error('[CreateProject] Error in saveDraft:', error);
            Utils.showAlert('form-alert', 'Terjadi kesalahan saat menyimpan draft', 'error');
        } finally {
            // Re-enable button
            saveDraftBtn.disabled = false;
            saveDraftBtn.innerHTML = originalContent;
        }
    }

    // ============================================
    // Next Step
    // ============================================
    async function goToNextStep() {
        console.log('[CreateProject] goToNextStep() called');

        // Disable button to prevent multiple submissions
        nextBtn.disabled = true;
        nextBtn.innerHTML = `
            <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32">
                    <animate attributeName="stroke-dashoffset" dur="0.8s" from="32" to="0" repeatCount="indefinite"/>
                </circle>
            </svg>
            Memproses...
        `;

        try {
            if (!validateForm()) {
                console.log('[CreateProject] Form validation failed');
                Utils.showAlert('form-alert', 'Mohon lengkapi semua field yang wajib diisi', 'error');
                return;
            }

            console.log('[CreateProject] Form validation passed');
            const formData = getFormData();
            console.log('[CreateProject] Form data:', formData);

            // Simulate API call
            console.log('[CreateProject] Simulating API call (1s delay)');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Store in localStorage (dummy)
            const savedProjects = JSON.parse(localStorage.getItem('auditflow_projects') || '[]');
            savedProjects.push({
                id: Utils.generateId(),
                ...formData
            });
            localStorage.setItem('auditflow_projects', JSON.stringify(savedProjects));
            console.log('[CreateProject] Project saved to localStorage');

            // Show success modal with continue option
            console.log('[CreateProject] Calling showSuccessModal()');
            showSuccessModal('Step 1 Selesai', 'Informasi project telah disimpan. Lanjutkan ke step berikutnya?', true);
            console.log('[CreateProject] showSuccessModal() completed');
        } catch (error) {
            console.error('[CreateProject] Error in goToNextStep:', error);
            Utils.showAlert('form-alert', 'Terjadi kesalahan saat memproses data', 'error');
        } finally {
            // Re-enable button
            nextBtn.disabled = false;
            nextBtn.innerHTML = `
                Next Step
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            `;
        }
    }

    // ============================================
    // Modal
    // ============================================
    function showSuccessModal(title, message, showContinue) {
        console.log('[CreateProject] showSuccessModal() called with:', { title, message, showContinue });

        // Debug: Check if elements exist
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalOverlay = document.getElementById('success-modal');

        console.log('[CreateProject] Modal elements:', {
            modalTitle: modalTitle ? 'found' : 'NULL',
            modalMessage: modalMessage ? 'found' : 'NULL',
            modalOverlay: modalOverlay ? 'found' : 'NULL',
            modalContinue: modalContinue ? 'found' : 'NULL',
            successModal: successModal ? 'found' : 'NULL'
        });

        if (!modalTitle || !modalMessage || !modalOverlay) {
            console.error('[CreateProject] Modal elements not found!');
            return;
        }

        modalTitle.textContent = title;
        modalMessage.textContent = message;

        if (showContinue) {
            modalContinue.classList.remove('hidden');
        } else {
            modalContinue.classList.add('hidden');
        }

        console.log('[CreateProject] Setting modal visibility and body overflow');
        successModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        console.log('[CreateProject] Modal should now be visible');
        console.log('[CreateProject] successModal.classList.contains("hidden"):', successModal.classList.contains('hidden'));
        console.log('[CreateProject] document.body.style.overflow:', document.body.style.overflow);
    }

    function hideSuccessModal() {
        console.log('[CreateProject] hideSuccessModal() called');
        successModal.classList.add('hidden');
        document.body.style.overflow = '';
        console.log('[CreateProject] Modal hidden, body overflow restored');
    }

    // ============================================
    // Event Listeners
    // ============================================
    function setupEventListeners() {
        console.log('[CreateProject] Setting up event listeners');

        // Save draft
        saveDraftBtn.addEventListener('click', saveDraft);

        // Next step
        nextBtn.addEventListener('click', goToNextStep);
        console.log('[CreateProject] Next button listener attached to:', nextBtn);

        // Back button (disabled on step 1)
        backBtn.addEventListener('click', () => {
            Navigation.goToDashboard();
        });

        // Modal actions
        modalBackDashboard.addEventListener('click', () => {
            hideSuccessModal();
            Navigation.goToDashboard();
        });

        modalContinue.addEventListener('click', () => {
            hideSuccessModal();
            // Navigate to Step 2: Understanding Business
            window.location.href = 'understanding-business.html';
        });

        // Close modal on overlay click
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                hideSuccessModal();
            }
        });

        // Close modal on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
                hideSuccessModal();
            }
        });

        // Update end date min when start date changes
        fields.startDate.addEventListener('change', () => {
            fields.endDate.setAttribute('min', fields.startDate.value);
            if (fields.endDate.value && fields.endDate.value < fields.startDate.value) {
                fields.endDate.value = fields.startDate.value;
            }
        });

        // Show/hide industry other input based on selection
        fields.industry.addEventListener('change', () => {
            if (fields.industry.value === 'Lainnya') {
                industryOtherGroup.classList.remove('hidden');
                fields.industryOther.focus();
            } else {
                industryOtherGroup.classList.add('hidden');
                fields.industryOther.value = '';
            }
        });

        // Show/hide business cycle other input based on selection
        fields.businessCycle.addEventListener('change', () => {
            if (fields.businessCycle.value === 'Other') {
                businessCycleOtherGroup.classList.remove('hidden');
                fields.businessCycleOther.focus();
            } else {
                businessCycleOtherGroup.classList.add('hidden');
                fields.businessCycleOther.value = '';
            }
        });
    }

    // ============================================
    // Initialize
    // ============================================
    initForm();
});