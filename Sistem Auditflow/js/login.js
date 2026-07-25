/**
 * AuditFlow - Login Page JavaScript
 * Version: 1.0 (MVP)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // DOM Elements
    // ============================================
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const roleSelect = document.getElementById('role');
    const rememberCheckbox = document.getElementById('remember-me');
    const loginBtn = document.getElementById('login-btn');
    const passwordToggle = document.getElementById('password-toggle');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const registerLink = document.getElementById('register-link');
    const modal = document.getElementById('forgot-password-modal');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const modalSubmit = document.getElementById('modal-submit');
    const resetEmailInput = document.getElementById('reset-email');

    // ============================================
    // Password Toggle
    // ============================================
    passwordToggle.addEventListener('click', () => {
        const eyeIcon = passwordToggle.querySelector('.eye-icon');
        const eyeOffIcon = passwordToggle.querySelector('.eye-off-icon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    });

    // ============================================
    // Form Validation
    // ============================================
    function validateEmail() {
        const email = emailInput.value.trim();
        const errorId = 'email-error';

        if (!email) {
            Utils.showFieldError('email', errorId, 'Email wajib diisi');
            return false;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showFieldError('email', errorId, 'Format email tidak valid');
            return false;
        }

        Utils.clearFieldError('email', errorId);
        return true;
    }

    function validatePassword() {
        const password = passwordInput.value;
        const errorId = 'password-error';

        if (!password) {
            Utils.showFieldError('password', errorId, 'Password wajib diisi');
            return false;
        }

        if (password.length < 6) {
            Utils.showFieldError('password', errorId, 'Password minimal 6 karakter');
            return false;
        }

        Utils.clearFieldError('password', errorId);
        return true;
    }

    function validateRole() {
        const role = roleSelect.value;
        const errorId = 'role-error';

        if (!role) {
            Utils.showFieldError('role', errorId, 'Peran wajib dipilih');
            return false;
        }

        Utils.clearFieldError('role', errorId);
        return true;
    }

    // Real-time validation on blur
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);
    roleSelect.addEventListener('blur', validateRole);

    // Clear errors on input
    emailInput.addEventListener('input', () => Utils.clearFieldError('email', 'email-error'));
    passwordInput.addEventListener('input', () => Utils.clearFieldError('password', 'password-error'));
    roleSelect.addEventListener('change', () => Utils.clearFieldError('role', 'role-error'));

    // ============================================
    // Form Submission
    // ============================================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isRoleValid = validateRole();

        if (!isEmailValid || !isPasswordValid || !isRoleValid) {
            Utils.showAlert('login-alert', 'Mohon periksa kembali input Anda', 'error');
            return;
        }

        // Show loading state
        Utils.setButtonLoading('login-btn', true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Dummy authentication - accept any valid input
        // Extract and format name from email (e.g., "zazkia.nur.alifa@company.com" -> "Zazkia Nur Alifa")
        const emailPrefix = emailInput.value.trim().split('@')[0];
        const formattedName = emailPrefix
            .split(/[._-]/) // Split by dots, underscores, or hyphens
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        const user = {
            id: Utils.generateId(),
            email: emailInput.value.trim(),
            name: formattedName,
            role: roleSelect.value,
            remember: rememberCheckbox.checked
        };

        // Store user in app state
        AuditFlow.setUser(user);

        // Audit Trail: Record session.start (Sprint 5)
        if (typeof AuditTrail !== 'undefined') {
            try {
                AuditTrail.record('session.start', {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            } catch (e) {
                console.warn('AuditTrail session.start failed:', e);
            }
        }

        // Show success message
        Utils.hideAlert('login-alert');

        // Redirect to dashboard
        setTimeout(() => {
            Navigation.goToDashboard();
        }, 500);
    });

    // ============================================
    // Modal (Forgot Password)
    // ============================================
    function openModal() {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        resetEmailInput.value = '';
        Utils.clearFieldError('reset-email', 'reset-email-error');
    }

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    modalClose.addEventListener('click', closeModal);
    modalCancel.addEventListener('click', closeModal);

    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Modal submit (forgot password)
    modalSubmit.addEventListener('click', async () => {
        const email = resetEmailInput.value.trim();
        const errorId = 'reset-email-error';

        if (!email) {
            Utils.showFieldError('reset-email', errorId, 'Email wajib diisi');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showFieldError('reset-email', errorId, 'Format email tidak valid');
            return;
        }

        Utils.clearFieldError('reset-email', errorId);

        // Show loading state
        modalSubmit.disabled = true;
        modalSubmit.textContent = 'Mengirim...';

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Show success message
        alert(`Link reset password telah dikirim ke ${email}`); // Using alert for simplicity
        closeModal();

        modalSubmit.disabled = false;
        modalSubmit.textContent = 'Kirim Link';
    });

    // ============================================
    // Register Link
    // ============================================
    registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Fitur registrasi akan segera tersedia!'); // Placeholder
    });

    // ============================================
    // Check if already logged in
    // ============================================
    if (AuditFlow.isAuthenticated()) {
        Navigation.goToDashboard();
    }
});