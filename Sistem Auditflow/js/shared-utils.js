/**
 * AuditFlow - Shared Utilities
 * Common patterns and helpers used across multiple modules
 */

const SharedUtils = (function () {
    'use strict';

    // ============================================
    // Status Maps (used in dashboard.js, wcgw-detection.js, etc.)
    // ============================================

    const statusConfig = {
        draft: {
            label: 'Draft',
            color: '#6b7280',
            bgColor: '#f3f4f6',
            textColor: '#374151'
        },
        in_progress: {
            label: 'Dalam Progress',
            color: '#3b82f6',
            bgColor: '#dbeafe',
            textColor: '#1e40af'
        },
        review: {
            label: 'Review',
            color: '#f59e0b',
            bgColor: '#fef3c7',
            textColor: '#92400e'
        },
        completed: {
            label: 'Selesai',
            color: '#10b981',
            bgColor: '#d1fae5',
            textColor: '#065f46'
        }
    };

    /**
     * Get status configuration
     */
    function getStatusConfig(status) {
        return statusConfig[status] || statusConfig.draft;
    }

    /**
     * Get status label
     */
    function getStatusLabel(status) {
        return getStatusConfig(status).label;
    }

    /**
     * Get status class for CSS
     */
    function getStatusClass(status) {
        const classMap = {
            draft: 'status-draft',
            in_progress: 'status-progress',
            review: 'status-review',
            completed: 'status-completed'
        };
        return classMap[status] || 'status-draft';
    }

    // ============================================
    // Risk Level Configuration
    // ============================================

    const riskConfig = {
        high: {
            label: 'Tinggi',
            color: '#ef4444',
            bgColor: '#fee2e2',
            textColor: '#991b1b'
        },
        medium: {
            label: 'Sedang',
            color: '#f59e0b',
            bgColor: '#fef3c7',
            textColor: '#92400e'
        },
        low: {
            label: 'Rendah',
            color: '#10b981',
            bgColor: '#d1fae5',
            textColor: '#065f46'
        }
    };

    /**
     * Get risk configuration
     */
    function getRiskConfig(riskLevel) {
        return riskConfig[riskLevel] || riskConfig.medium;
    }

    /**
     * Get risk label
     */
    function getRiskLabel(riskLevel) {
        return getRiskConfig(riskLevel).label;
    }

    // ============================================
    // Activity Type Icons (used in dashboard.js)
    // ============================================

    const activityIcons = {
        project_created: `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>`,
        draft_saved: `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg>`,
        flowchart_generated: `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>`,
        wcgw_detected: `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`,
        project_completed: `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>`
    };

    /**
     * Get activity icon SVG
     */
    function getActivityIcon(type) {
        return activityIcons[type] || activityIcons.project_created;
    }

    // ============================================
    // Date Formatting Utilities
    // ============================================

    /**
     * Format date to Indonesian locale
     */
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Format relative time (e.g., "2 jam yang lalu")
     */
    function formatRelativeTime(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;
        return formatDate(dateString);
    }

    /**
     * Format date range
     */
    function formatDateRange(startDate, endDate) {
        const start = new Date(startDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
        const end = new Date(endDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        return `${start} - ${end}`;
    }

    // ============================================
    // Progress Utilities
    // ============================================

    /**
     * Get progress bar CSS class
     */
    function getProgressBarClass(progress) {
        if (progress < 30) return 'progress-low';
        if (progress < 70) return 'progress-medium';
        return 'progress-high';
    }

    /**
     * Calculate progress percentage from project steps
     */
    function calculateProgress(project) {
        let completed = 0;
        const total = 7; // Total steps in wizard

        if (project.projectInfo) completed++;
        if (project.understandingBusiness) completed++;
        if (project.flowchartPrep) completed++;
        if (project.flowchart) completed++;
        if (project.wcgwDetections && project.wcgwDetections.length > 0) completed++;
        if (project.review && project.review.completed) completed++;
        if (project.status === 'completed') completed++;

        return Math.round((completed / total) * 100);
    }

    // ============================================
    // Auto-Save Utilities
    // ============================================

    let autoSaveTimeout = null;

    /**
     * Schedule auto-save with debounce
     */
    function scheduleAutoSave(callback, delay = 1000) {
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        autoSaveTimeout = setTimeout(callback, delay);
    }

    /**
     * Show auto-save indicator
     */
    function showAutoSaveIndicator(elementId) {
        const indicator = document.getElementById(elementId);
        if (indicator) {
            indicator.classList.remove('hidden');
            setTimeout(() => {
                indicator.classList.add('hidden');
            }, 2000);
        }
    }

    // ============================================
    // Modal Utilities
    // ============================================

    /**
     * Show modal by ID
     */
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    /**
     * Hide modal by ID
     */
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Setup modal close handlers
     */
    function setupModalCloseHandlers(modalId, closeButtonIds = []) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });

        // Close on button click
        closeButtonIds.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        });
    }

    // ============================================
    // Validation Utilities
    // ============================================

    /**
     * Validate email format
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show field error
     */
    function showFieldError(fieldId, errorId, message) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);

        if (field) {
            field.classList.add('error');
        }
        if (error) {
            error.textContent = message;
            error.classList.remove('hidden');
        }
    }

    /**
     * Clear field error
     */
    function clearFieldError(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);

        if (field) {
            field.classList.remove('error');
        }
        if (error) {
            error.classList.add('hidden');
            error.textContent = '';
        }
    }

    /**
     * Clear all form errors
     */
    function clearAllErrors(form) {
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        form.querySelectorAll('.form-error').forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });
    }

    // ============================================
    // String Utilities
    // ============================================

    /**
     * Truncate string with ellipsis
     */
    function truncate(str, maxLength) {
        if (!str || str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    }

    /**
     * Capitalize first letter
     */
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Generate initials from name
     */
    function getInitials(name) {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    // Public API
    return {
        // Status
        getStatusConfig,
        getStatusLabel,
        getStatusClass,

        // Risk
        getRiskConfig,
        getRiskLabel,

        // Activity
        getActivityIcon,

        // Date
        formatDate,
        formatRelativeTime,
        formatDateRange,

        // Progress
        getProgressBarClass,
        calculateProgress,

        // Auto-save
        scheduleAutoSave,
        showAutoSaveIndicator,

        // Modal
        showModal,
        hideModal,
        setupModalCloseHandlers,

        // Validation
        isValidEmail,
        showFieldError,
        clearFieldError,
        clearAllErrors,

        // String
        truncate,
        capitalize,
        getInitials
    };
})();