/**
 * Data Migration Module
 * Handles localStorage data migration between schema versions
 * Provides safe getters that fallback to defaults if data is missing or malformed
 * Current schema version: 3 (as per docs/DATA_SCHEMAS.md v3.0)
 */

const DataMigration = (function () {
    'use strict';

    const CURRENT_SCHEMA_VERSION = 3;
    const STORAGE_KEY = 'auditflow_projects';
    const USER_KEY = 'auditflow_user';

    /**
     * Normalize assertion format from capitalized to lowercase-dash
     * e.g., "Occurrence" -> "occurrence", "Rights and Obligations" -> "rights-and-obligations"
     * @param {string} assertion - Assertion string to normalize
     * @returns {string} Normalized assertion in lowercase-dash format
     */
    function normalizeAssertion(assertion) {
        if (!assertion || typeof assertion !== 'string') return '';

        // Convert to lowercase and replace spaces/ special chars with dashes
        return assertion
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')          // Replace spaces with dashes
            .replace(/-+/g, '-')           // Replace multiple dashes with single
            .trim();
    }

    /**
     * Format user name from email prefix
     * e.g., "zazkia.nur.alifa" -> "Zazkia Nur Alifa"
     * @param {string} emailOrPrefix - Email or email prefix
     * @returns {string} Formatted name
     */
    function formatUserName(emailOrPrefix) {
        if (!emailOrPrefix || typeof emailOrPrefix !== 'string') return 'Unknown User';

        // Extract prefix if full email provided
        const prefix = emailOrPrefix.split('@')[0];

        // Split by dots, underscores, or hyphens and capitalize each word
        return prefix
            .split(/[._-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Migration from v0/v1 to v2
     * Adds schemaVersion, createdBy/updatedBy, and normalizes assertions
     * @param {Object} project - Project object to migrate
     * @returns {Object} Migrated project with v2 schema
     */
    function migrateToV2(project) {
        const migrated = { ...project };

        // Set schema version
        migrated.schemaVersion = 2;

        // Add audit trail fields if missing
        if (!migrated.createdBy) {
            migrated.createdBy = 'system';
        }
        if (!migrated.updatedBy) {
            migrated.updatedBy = migrated.createdBy;
        }
        if (!migrated.createdAt) {
            migrated.createdAt = new Date().toISOString();
        }
        if (!migrated.updatedAt) {
            migrated.updatedAt = migrated.createdAt;
        }

        // Normalize assertions in WCGW detections
        if (migrated.wcgwDetections && Array.isArray(migrated.wcgwDetections)) {
            migrated.wcgwDetections = migrated.wcgwDetections.map(detection => ({
                ...detection,
                assertion: normalizeAssertion(detection.assertion),
                // Ensure all required fields exist
                id: detection.id || `det_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: detection.status || 'open',
                riskLevel: detection.riskLevel || 'medium',
                wcgw: detection.wcgw || []
            }));
        }

        // Migrate flowchart if exists
        if (migrated.flowchart) {
            migrated.flowchart = migrateFlowchartToV2(migrated.flowchart);
        }

        // Initialize version history if missing
        if (!migrated.versionHistory || !Array.isArray(migrated.versionHistory)) {
            migrated.versionHistory = [];
        }

        return migrated;
    }

    /**
     * Migration from v2 to v3
     * Renames auditCycle → auditFrequency, adds businessCycle field
     * @param {Object} project - Project object to migrate
     * @returns {Object} Migrated project with v3 schema
     */
    function migrateToV3(project) {
        const migrated = { ...project };

        // Set schema version
        migrated.schemaVersion = 3;

        // Rename auditCycle → auditFrequency in projectInfo
        if (migrated.projectInfo) {
            const info = migrated.projectInfo;

            // Rename auditCycle to auditFrequency if exists
            if (info.auditCycle !== undefined) {
                info.auditFrequency = info.auditCycle;
                delete info.auditCycle;
            }

            // Ensure auditFrequency has a default if neither exists
            if (!info.auditFrequency) {
                info.auditFrequency = 'Annual'; // Default fallback
            }

            // Add businessCycle if missing
            if (!info.businessCycle) {
                info.businessCycle = 'Revenue Cycle'; // Default fallback - sesuai schema v3.0
            }

            // Ensure businessCycleOther exists (optional field)
            if (!info.businessCycleOther) {
                info.businessCycleOther = '';
            }
        }

        return migrated;
    }

    /**
     * Migrate flowchart data to v2 schema
     * @param {Object} flowchart - Flowchart object to migrate
     * @returns {Object} Migrated flowchart
     */
    function migrateFlowchartToV2(flowchart) {
        const migrated = { ...flowchart };

        // Add audit trail
        if (!migrated.createdBy) {
            migrated.createdBy = 'system';
        }
        if (!migrated.updatedBy) {
            migrated.updatedBy = migrated.createdBy;
        }

        // Initialize locked state if missing
        if (migrated.locked === undefined) {
            migrated.locked = false;
        }

        // Initialize version history if missing
        if (!migrated.versionHistory || !Array.isArray(migrated.versionHistory)) {
            migrated.versionHistory = [];
        }

        // Migrate nodes - convert wcgw object to wcgwDetectionIds array
        if (migrated.nodes && Array.isArray(migrated.nodes)) {
            migrated.nodes = migrated.nodes.map(node => {
                const migratedNode = { ...node };

                // Convert old wcgw object to wcgwDetectionIds array
                if (migratedNode.wcgw && typeof migratedNode.wcgw === 'object' && !Array.isArray(migratedNode.wcgw)) {
                    // This is old format - create detection IDs from wcgw data
                    migratedNode.wcgwDetectionIds = [`wcgw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`];
                    delete migratedNode.wcgw;
                } else if (!migratedNode.wcgwDetectionIds) {
                    // Ensure array exists
                    migratedNode.wcgwDetectionIds = [];
                }

                return migratedNode;
            });
        }

        return migrated;
    }

    /**
     * Safe getter for projects list with fallback to empty array
     * @returns {Array} Array of projects (empty if none exist or data is invalid)
     */
    function getProjects() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];

            const projects = JSON.parse(stored);
            if (!Array.isArray(projects)) return [];

            // Filter out invalid projects
            return projects.filter(project => {
                return project && typeof project === 'object' && project.id;
            });
        } catch (error) {
            console.warn('DataMigration: Error reading projects from localStorage:', error);
            return [];
        }
    }

    /**
     * Safe getter for current user with fallback to null
     * @returns {Object|null} User object or null if not set
     */
    function getCurrentUser() {
        try {
            const stored = localStorage.getItem(USER_KEY);
            if (!stored) return null;

            const user = JSON.parse(stored);
            if (!user || typeof user !== 'object' || !user.id) return null;

            return user;
        } catch (error) {
            console.warn('DataMigration: Error reading user from localStorage:', error);
            return null;
        }
    }

    /**
     * Safe getter for project by ID with validation
     * @param {string} projectId - ID of project to retrieve
     * @returns {Object|null} Project object or null if not found or invalid
     */
    function getProjectById(projectId) {
        try {
            const projects = getProjects();
            const project = projects.find(p => p.id === projectId);

            if (!project) return null;

            // Basic validation
            if (typeof project !== 'object' || !project.id) return null;

            return project;
        } catch (error) {
            console.warn(`DataMigration: Error reading project ${projectId}:`, error);
            return null;
        }
    }

    /**
     * Initialize data migration - check schema versions and migrate if needed
     * Should be called on app startup
     */
    function init() {
        console.log('DataMigration: Initializing with schema version', CURRENT_SCHEMA_VERSION);

        try {
            const projects = getProjects();
            let needsMigration = false;
            let migratedCount = 0;

            // Check each project for schema version
            projects.forEach((project, index) => {
                const version = project.schemaVersion || 0;

                if (version < CURRENT_SCHEMA_VERSION) {
                    console.log(`DataMigration: Project "${project.name || project.id}" needs migration from v${version} to v${CURRENT_SCHEMA_VERSION}`);
                    needsMigration = true;

                    // Migrate project through all versions
                    let migrated = project;

                    // v0/v1 → v2
                    if (version < 2) {
                        migrated = migrateToV2(migrated);
                    }

                    // v2 → v3
                    if (migrated.schemaVersion < 3) {
                        migrated = migrateToV3(migrated);
                    }

                    projects[index] = migrated;
                    migratedCount++;
                }
            });

            // Save migrated projects back to localStorage
            if (needsMigration) {
                console.log(`DataMigration: Migrating ${migratedCount} project(s) to v${CURRENT_SCHEMA_VERSION}`);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
            }

            // Check and fix user name formatting
            const user = getCurrentUser();
            if (user) {
                // Check if name needs formatting (contains dots, underscores, or @)
                if (user.name && (user.name.includes('.') || user.name.includes('_') || user.name.includes('@'))) {
                    console.log('DataMigration: Formatting user name:', user.name);
                    user.name = formatUserName(user.name);
                    localStorage.setItem(USER_KEY, JSON.stringify(user));
                }
            }

            console.log(`DataMigration: Initialization complete. Migrated ${migratedCount} project(s).`);

        } catch (error) {
            console.error('DataMigration: Critical error during initialization:', error);
            // Don't crash the app - just log the error
        }
    }

    /**
     * Save project with automatic schema versioning and audit trail
     * @param {Object} project - Project to save
     * @param {string} userId - ID of user making the change
     */
    function saveProject(project, userId = 'system') {
        try {
            // Ensure schema version is current
            project.schemaVersion = CURRENT_SCHEMA_VERSION;

            // Update audit trail
            project.updatedAt = new Date().toISOString();
            project.updatedBy = userId;

            // Add creation timestamp if new project
            if (!project.createdAt) {
                project.createdAt = project.updatedAt;
                project.createdBy = userId;
            }

            // Get existing projects
            const projects = getProjects();

            // Find and replace existing project or add new one
            const existingIndex = projects.findIndex(p => p.id === project.id);
            if (existingIndex >= 0) {
                projects[existingIndex] = project;
            } else {
                projects.push(project);
            }

            // Save back to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

        } catch (error) {
            console.error('DataMigration: Error saving project:', error);
            throw error;
        }
    }

    /**
     * Create a version snapshot for version history
     * @param {Object} project - Project to snapshot
     * @param {string} label - Label for this version (e.g., "Before WCGW Detection")
     * @param {string} userId - ID of user creating snapshot
     * @returns {string} ID of created snapshot
     */
    function createVersionSnapshot(project, label, userId = 'system') {
        try {
            const snapshot = {
                id: `v${Date.now()}`,
                timestamp: new Date().toISOString(),
                label: label || `Version ${project.versionHistory ? project.versionHistory.length + 1 : 1}`,
                createdBy: userId,
                snapshot: {
                    flowchart: project.flowchart ? JSON.parse(JSON.stringify(project.flowchart)) : null,
                    wcgwDetections: project.wcgwDetections ? JSON.parse(JSON.stringify(project.wcgwDetections)) : [],
                    understandingBusiness: project.understandingBusiness ? JSON.parse(JSON.stringify(project.understandingBusiness)) : null,
                    flowchartPrep: project.flowchartPrep ? JSON.parse(JSON.stringify(project.flowchartPrep)) : null
                }
            };

            // Initialize version history if needed
            if (!project.versionHistory) {
                project.versionHistory = [];
            }

            // Add snapshot
            project.versionHistory.push(snapshot);

            // Save project
            saveProject(project, userId);

            return snapshot.id;

        } catch (error) {
            console.error('DataMigration: Error creating version snapshot:', error);
            return null;
        }
    }

    /**
     * Restore project from version snapshot
     * @param {Object} project - Project to restore
     * @param {string} snapshotId - ID of snapshot to restore
     * @param {string} userId - ID of user performing restore
     * @returns {boolean} Success status
     */
    function restoreFromSnapshot(project, snapshotId, userId = 'system') {
        try {
            if (!project.versionHistory || !Array.isArray(project.versionHistory)) {
                console.error('DataMigration: No version history found');
                return false;
            }

            const snapshot = project.versionHistory.find(s => s.id === snapshotId);
            if (!snapshot) {
                console.error('DataMigration: Snapshot not found:', snapshotId);
                return false;
            }

            // Restore data from snapshot
            if (snapshot.snapshot.flowchart) {
                project.flowchart = JSON.parse(JSON.stringify(snapshot.snapshot.flowchart));
            }
            if (snapshot.snapshot.wcgwDetections) {
                project.wcgwDetections = JSON.parse(JSON.stringify(snapshot.snapshot.wcgwDetections));
            }
            if (snapshot.snapshot.understandingBusiness) {
                project.understandingBusiness = JSON.parse(JSON.stringify(snapshot.snapshot.understandingBusiness));
            }
            if (snapshot.snapshot.flowchartPrep) {
                project.flowchartPrep = JSON.parse(JSON.stringify(snapshot.snapshot.flowchartPrep));
            }

            // Update audit trail
            project.updatedAt = new Date().toISOString();
            project.updatedBy = userId;

            // Save restored project
            saveProject(project, userId);

            return true;

        } catch (error) {
            console.error('DataMigration: Error restoring from snapshot:', error);
            return false;
        }
    }

    /**
     * Clear all data from localStorage (for testing or reset)
     */
    function clearAll() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(USER_KEY);
            console.log('DataMigration: All data cleared');
        } catch (error) {
            console.error('DataMigration: Error clearing data:', error);
        }
    }

    /**
     * Export data for backup
     * @returns {Object} Complete data export
     */
    function exportData() {
        try {
            return {
                version: CURRENT_SCHEMA_VERSION,
                exportedAt: new Date().toISOString(),
                projects: getProjects(),
                user: getCurrentUser()
            };
        } catch (error) {
            console.error('DataMigration: Error exporting data:', error);
            return null;
        }
    }

    // Public API
    return {
        init,
        getProjects,
        getProjectById,
        getCurrentUser,
        saveProject,
        createVersionSnapshot,
        restoreFromSnapshot,
        clearAll,
        exportData,
        formatUserName,
        normalizeAssertion,
        CURRENT_SCHEMA_VERSION
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataMigration;
}