/**
 * AuditFlow - Global Application Utilities
 * Version: 2.0 (Architecture Refinement - Sprint 3)
 * Includes: Schema validation, data migration, and safe data access
 */

// ============================================
// Application State Management
// ============================================
const AuditFlow = {
    // Current user state
    currentUser: null,

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    },

    // Set current user
    setUser(user) {
        this.currentUser = user;
        localStorage.setItem('auditflow_user', JSON.stringify(user));
    },

    // Get current user from storage (uses DataMigration safe getter if available)
    getUser() {
        if (this.currentUser) return this.currentUser;

        // Use DataMigration safe getter if available
        if (typeof DataMigration !== 'undefined') {
            this.currentUser = DataMigration.getCurrentUser();
        } else {
            // Fallback to direct localStorage access
            const stored = localStorage.getItem('auditflow_user');
            if (stored) {
                try {
                    this.currentUser = JSON.parse(stored);
                } catch (e) {
                    console.warn('AuditFlow: Error parsing user data:', e);
                    this.currentUser = null;
                }
            }
        }
        return this.currentUser;
    },

    // Clear user session
    logout() {
        // Audit Trail: Record session.end (Sprint 5)
        if (typeof AuditTrail !== 'undefined' && this.currentUser) {
            try {
                AuditTrail.record('session.end', {
                    userId: this.currentUser.id,
                    email: this.currentUser.email,
                    sessionDuration: null, // Could calculate if session start stored
                    reason: 'user_initiated'
                });
            } catch (e) {
                console.warn('AuditTrail session.end failed:', e);
            }
        }

        this.currentUser = null;
        localStorage.removeItem('auditflow_user');
        window.location.href = 'index.html';
    },

    // Initialize app with data migration and validation
    init() {
        // Initialize data migration system (checks schema versions, migrates old data)
        if (typeof DataMigration !== 'undefined') {
            DataMigration.init();
            console.log('AuditFlow: Data migration system initialized');
        }

        // Initialize Audit Trail system (Sprint 5)
        if (typeof AuditTrail !== 'undefined') {
            AuditTrail.init();
            console.log('AuditFlow: Audit Trail system initialized');
        }

        // Load current user
        this.getUser();
    },

    // ============================================
    // Project State Management (Wizard Navigation)
    // ============================================

    // Get current project from localStorage
    getCurrentProject() {
        const stored = localStorage.getItem('auditflow_current_project');
        if (stored) {
            return JSON.parse(stored);
        }
        return null;
    },

    // Save current project to localStorage
    saveProject(project) {
        if (!project) return;
        localStorage.setItem('auditflow_current_project', JSON.stringify(project));

        // Also update in projects list
        this.updateProjectInList(project);
    },

    // Create a new project with default structure
    createProject(projectInfo = {}) {
        const project = {
            id: 'proj-' + Utils.generateId(),
            status: 'draft',
            progress: 0,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            projectInfo: null,
            understandingBusiness: null,
            flowchartPrep: null,
            flowchart: null,
            auditAnalysis: null,
            review: null,
            export: null
        };

        this.saveProject(project);

        // Record audit trail for project creation (FR-18 compliance)
        if (typeof AuditTrail !== 'undefined') {
            try {
                const user = this.getUser();
                AuditTrail.record('project.create', {
                    projectId: project.id,
                    projectName: projectInfo.projectName || 'Untitled Project',
                    industry: projectInfo.industry || '-',
                    auditFrequency: projectInfo.auditFrequency || '-',
                    businessCycle: projectInfo.businessCycle || '-',
                    createdBy: user?.email || 'unknown',
                    auditorName: projectInfo.auditorName || user?.name || 'unknown'
                });
            } catch (e) {
                console.warn('AuditTrail project.create failed:', e);
            }
        }

        return project;
    },

    // Update project in the projects list
    updateProjectInList(project) {
        let projects = this.getProjectsList();

        const index = projects.findIndex(p => p.id === project.id);
        if (index >= 0) {
            projects[index] = { ...projects[index], ...project, lastModified: new Date().toISOString() };
        } else {
            projects.push({
                id: project.id,
                name: project.projectInfo?.projectName || 'Untitled Project',
                company: project.projectInfo?.companyName || '-',
                industry: project.projectInfo?.industry || '-',
                auditor: project.projectInfo?.auditorName || '-',
                status: project.status || 'draft',
                progress: project.progress || 0,
                cycle: project.projectInfo?.auditCycle || '-',
                startDate: project.projectInfo?.startDate || '-',
                endDate: project.projectInfo?.endDate || '-',
                lastUpdated: new Date().toISOString()
            });
        }

        localStorage.setItem('auditflow_projects', JSON.stringify(projects));
    },

    // Get projects list from localStorage (uses DataMigration safe getter if available)
    getProjectsList() {
        console.log('[AuditFlow.getProjectsList] Called');

        // Use DataMigration safe getter if available
        if (typeof DataMigration !== 'undefined') {
            const projects = DataMigration.getProjects();
            console.log('[AuditFlow.getProjectsList] DataMigration.getProjects() returned:', projects.length, 'projects');
            console.log('[AuditFlow.getProjectsList] Projects:', projects.map(p => ({ id: p.id, name: p.name, status: p.status })));
            // Return projects if found, otherwise return dummy data
            return projects.length > 0 ? projects : DummyData.getProjects();
        }

        // Fallback to direct localStorage access
        try {
            const stored = localStorage.getItem('auditflow_projects');
            console.log('[AuditFlow.getProjectsList] localStorage raw:', stored ? stored.substring(0, 200) + '...' : 'null');
            if (stored) {
                const projects = JSON.parse(stored);
                console.log('[AuditFlow.getProjectsList] Parsed projects:', projects.length, 'items');
                console.log('[AuditFlow.getProjectsList] Projects detail:', projects.map(p => ({ id: p.id, name: p.name, status: p.status })));
                if (Array.isArray(projects) && projects.length > 0) {
                    console.log('[AuditFlow.getProjectsList] Returning localStorage projects');
                    return projects;
                }
            }
        } catch (e) {
            console.warn('AuditFlow: Error reading projects:', e);
        }

        // Return dummy data if no stored projects
        console.log('[AuditFlow.getProjectsList] Returning dummy data');
        return DummyData.getProjects();
    },

    // Get project by ID (uses DataMigration safe getter if available)
    getProjectById(projectId) {
        if (typeof DataMigration !== 'undefined') {
            return DataMigration.getProjectById(projectId);
        }

        // Fallback to direct lookup
        const projects = this.getProjectsList();
        return projects.find(p => p.id === projectId);
    },

    // Delete project
    deleteProject(projectId) {
        let projects = this.getProjectsList();
        projects = projects.filter(p => p.id !== projectId);

        // Save using DataMigration if available, otherwise direct localStorage
        if (typeof DataMigration !== 'undefined') {
            DataMigration.saveProject({ id: 'dummy', name: 'dummy' }, 'system'); // Trigger save
            localStorage.setItem('auditflow_projects', JSON.stringify(projects));
        } else {
            localStorage.setItem('auditflow_projects', JSON.stringify(projects));
        }

        // Also remove current project if it's the deleted one
        const currentProject = this.getCurrentProject();
        if (currentProject && currentProject.id === projectId) {
            localStorage.removeItem('auditflow_current_project');
        }
    },

    // Clear current project
    clearCurrentProject() {
        localStorage.removeItem('auditflow_current_project');
    },

    // Calculate project progress based on completed steps
    calculateProgress(project) {
        let completed = 0;
        const total = 7;

        if (project.projectInfo) completed++;
        if (project.understandingBusiness) completed++;
        if (project.flowchartPrep) completed++;
        if (project.flowchart) completed++;
        if (project.auditAnalysis) completed++;
        if (project.review) completed++;
        if (project.export) completed++;

        return Math.round((completed / total) * 100);
    }
};

// ============================================
// Utility Functions
// ============================================
const Utils = {
    // Show alert message
    showAlert(elementId, message, type = 'error') {
        const alertEl = document.getElementById(elementId);
        if (!alertEl) return;

        alertEl.textContent = message;
        alertEl.className = `alert alert-${type}`;
        alertEl.classList.remove('hidden');

        // Auto hide after 5 seconds
        setTimeout(() => {
            alertEl.classList.add('hidden');
        }, 5000);
    },

    // Hide alert message
    hideAlert(elementId) {
        const alertEl = document.getElementById(elementId);
        if (alertEl) {
            alertEl.classList.add('hidden');
        }
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Show field error
    showFieldError(fieldId, errorId, message) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);

        if (field) {
            field.style.borderColor = 'var(--color-risk-high)';
        }
        if (error) {
            error.textContent = message;
        }
    },

    // Clear field error
    clearFieldError(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const error = document.getElementById(errorId);

        if (field) {
            field.style.borderColor = '';
        }
        if (error) {
            error.textContent = '';
        }
    },

    // Clear all form errors
    clearAllErrors(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        const errors = form.querySelectorAll('.form-error');

        fields.forEach(field => {
            field.style.borderColor = '';
        });

        errors.forEach(error => {
            error.textContent = '';
        });
    },

    // Set button loading state
    setButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (isLoading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    },

    // Format date to Indonesian locale
    formatDate(date) {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Format date range
    formatDateRange(startDate, endDate) {
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
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// ============================================
// Navigation Helpers
// ============================================
const Navigation = {
    // Navigate to dashboard
    goToDashboard() {
        window.location.href = 'dashboard.html';
    },

    // Navigate to create project
    goToCreateProject() {
        window.location.href = 'create-project.html';
    },

    // Navigate to login
    goToLogin() {
        window.location.href = 'index.html';
    },

    // Navigate back
    goBack() {
        window.history.back();
    }
};

// ============================================
// Dummy Data Generator
// ============================================
const DummyData = {
    // Generate dummy projects
    getProjects() {
        return [
            {
                id: 'proj-001',
                name: 'Audit PT Maju Jaya',
                company: 'PT Maju Jaya',
                industry: 'Manufaktur',
                auditor: 'Andi Pratama',
                status: 'in-progress',
                progress: 70,
                cycle: 'Annual',
                startDate: '2024-01-15',
                endDate: '2024-02-28',
                lastUpdated: '2024-01-20T10:30:00'
            },
            {
                id: 'proj-002',
                name: 'Audit Bank Nusantara',
                company: 'Bank Nusantara',
                industry: 'Perbankan',
                auditor: 'Siti Nurhaliza',
                status: 'review',
                progress: 90,
                cycle: 'Annual',
                startDate: '2024-01-10',
                endDate: '2024-02-15',
                lastUpdated: '2024-01-19T14:45:00'
            },
            {
                id: 'proj-003',
                name: 'Audit CV Karya Mandiri',
                company: 'CV Karya Mandiri',
                industry: 'Retail',
                auditor: 'Budi Santoso',
                status: 'completed',
                progress: 100,
                cycle: 'Semi-Annual',
                startDate: '2023-11-01',
                endDate: '2023-12-15',
                lastUpdated: '2023-12-15T16:00:00'
            },
            {
                id: 'proj-004',
                name: 'Audit PT Sejahtera Abadi',
                company: 'PT Sejahtera Abadi',
                industry: 'Teknologi',
                auditor: 'Dewi Lestari',
                status: 'draft',
                progress: 15,
                cycle: 'Annual',
                startDate: '2024-01-20',
                endDate: '2024-03-20',
                lastUpdated: '2024-01-18T09:15:00'
            },
            {
                id: 'proj-005',
                name: 'Audit PT Global Industri',
                company: 'PT Global Industri',
                industry: 'Manufaktur',
                auditor: 'Eko Prasetyo',
                status: 'in-progress',
                progress: 45,
                cycle: 'Annual',
                startDate: '2024-01-05',
                endDate: '2024-02-28',
                lastUpdated: '2024-01-19T11:30:00'
            }
        ];
    },

    // Get industries list
    getIndustries() {
        return [
            'Manufaktur',
            'Perbankan',
            'Retail',
            'Teknologi',
            'Kesehatan',
            'Pertambangan',
            'Properti',
            'Transportasi',
            'Pertanian',
            'Lainnya'
        ];
    },

    // Get audit cycles
    getAuditCycles() {
        return [
            'Annual',
            'Semi-Annual',
            'Quarterly',
            'Monthly',
            'Ad-hoc'
        ];
    },

    // Get recent activities
    getRecentActivities() {
        return [
            {
                id: 1,
                type: 'update',
                message: 'Flowchart PT Maju Jaya diperbarui',
                time: '2 jam yang lalu',
                project: 'Audit PT Maju Jaya'
            },
            {
                id: 2,
                type: 'comment',
                message: 'Supervisor menambahkan komentar pada Audit Bank Nusantara',
                time: '4 jam yang lalu',
                project: 'Audit Bank Nusantara'
            },
            {
                id: 3,
                type: 'complete',
                message: 'Audit CV Karya Mandiri selesai',
                time: '1 hari yang lalu',
                project: 'Audit CV Karya Mandiri'
            },
            {
                id: 4,
                type: 'create',
                message: 'Project baru dibuat: PT Sejahtera Abadi',
                time: '2 hari yang lalu',
                project: 'Audit PT Sejahtera Abadi'
            }
        ];
    }
};

// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    AuditFlow.init();
});

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuditFlow, Utils, Navigation, DummyData };
}