/**
 * AuditFlow - Audit Trail Service (Sprint 5)
 * 
 * Immutable audit trail system for tracking all user and system activities.
 * Uses parserMetadata from Sprint 4 - no re-parsing required.
 * 
 * Architecture:
 * - Immutable entries (record once, read many)
 * - Non-blocking (failures don't affect main features)
 * - Single source of truth for all activity tracking
 * - Reusable timeline component for Dashboard and Project Detail
 * 
 * Storage: localStorage 'auditflow_audit_trail'
 * Structure: { entries: AuditEntry[], versions: VersionEntry[], approvals: ApprovalEntry[] }
 */

const AuditTrail = (function () {
    // ============================================
    // Constants & Configuration
    // ============================================

    const STORAGE_KEY = 'auditflow_audit_trail';
    const MAX_ENTRIES = 10000; // Limit to prevent localStorage overflow
    const SNAPSHOT_MAX_SIZE = 100 * 1024; // 100KB max for snapshots

    // ID prefixes for database migration readiness
    const ID_PREFIXES = {
        entry: 'audit',
        version: 'version',
        approval: 'approval'
    };

    // Actions that require full snapshot
    const SNAPSHOT_ACTIONS = [
        'flowchart.generate',
        'review.approve',
        'review.reject'
    ];

    // ============================================
    // Private State
    // ============================================

    let _initialized = false;
    let _storage = null;

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Generate stable ID with prefix
     * Format: prefix_timestamp_randomSuffix
     */
    function generateId(prefix) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${randomSuffix}`;
    }

    /**
     * Get current timestamp in ISO 8601 format
     */
    function getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Estimate object size in bytes
     */
    function estimateSize(obj) {
        return new Blob([JSON.stringify(obj)]).size;
    }

    /**
     * Load storage from localStorage
     */
    function loadStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                _storage = JSON.parse(stored);
            } else {
                _storage = {
                    entries: [],
                    versions: [],
                    approvals: []
                };
            }
        } catch (e) {
            console.warn('AuditTrail: Error loading storage:', e);
            _storage = {
                entries: [],
                versions: [],
                approvals: []
            };
        }
    }

    /**
     * Save storage to localStorage (non-blocking)
     */
    function saveStorage() {
        try {
            // Prune old entries if exceeding limit
            if (_storage.entries.length > MAX_ENTRIES) {
                _storage.entries = _storage.entries.slice(-MAX_ENTRIES);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(_storage));
        } catch (e) {
            // Non-blocking: don't throw, just log
            console.warn('AuditTrail: Error saving storage:', e);
        }
    }

    /**
     * Determine action source
     */
    function determineSource(context = {}) {
        if (context.source) return context.source;
        if (context.isAI) return 'ai';
        if (context.isRuleEngine) return 'rule-engine';
        if (context.isSystem) return 'system';
        return 'manual';
    }

    // ============================================
    // Core Audit Trail Functions
    // ============================================

    /**
     * Record a new audit entry (immutable - creates once)
     * @param {string} action - AuditActionType
     * @param {object} context - Context including projectId, userId, details, etc.
     * @returns {string} Entry ID
     */
    function record(action, context = {}) {
        console.log('[AuditTrail.record] Called with action:', action, 'context:', context);

        if (!_initialized) {
            console.warn('AuditTrail: Not initialized. Call AuditTrail.init() first.');
            return null;
        }

        try {
            const entry = {
                id: generateId(ID_PREFIXES.entry),
                projectId: context.projectId,
                type: action,
                timestamp: getTimestamp(),
                userId: context.userId || 'system',
                source: determineSource(context),
                status: context.status || 'active',
                entityType: context.entityType,
                entityId: context.entityId,
                summary: context.summary || AuditFormatter.format(action, context),
                details: {
                    before: context.before,
                    after: context.after,
                    changes: context.changes,
                    parserMetadata: context.parserMetadata,
                    wcgwMetadata: context.wcgwMetadata,
                    exportMetadata: context.exportMetadata
                }
            };

            _storage.entries.push(entry);

            // Create version entry for snapshot actions
            if (SNAPSHOT_ACTIONS.includes(action) && context.snapshot) {
                const snapshotSize = estimateSize(context.snapshot);
                const versionEntry = {
                    id: generateId(ID_PREFIXES.version),
                    projectId: context.projectId,
                    versionNumber: context.versionNumber || (_storage.versions.length + 1),
                    timestamp: getTimestamp(),
                    userId: context.userId || 'system',
                    action: action,
                    changeSummary: context.changes || [],
                    // Only store snapshot if under size limit
                    snapshot: snapshotSize < SNAPSHOT_MAX_SIZE ? context.snapshot : null,
                    snapshotOmitted: snapshotSize >= SNAPSHOT_MAX_SIZE
                };
                _storage.versions.push(versionEntry);
            }

            // Create approval entry for review actions
            if (action.startsWith('review.') && context.approvalData) {
                const approvalEntry = {
                    id: generateId(ID_PREFIXES.approval),
                    projectId: context.projectId,
                    status: action.replace('review.', ''),
                    timestamp: getTimestamp(),
                    userId: context.userId || 'system',
                    reviewerId: context.reviewerId,
                    comments: context.comments,
                    approvalData: context.approvalData
                };
                _storage.approvals.push(approvalEntry);
            }

            saveStorage();
            return entry.id;
        } catch (e) {
            // Non-blocking: log error but don't throw
            console.error('AuditTrail: Error recording entry:', e);
            return null;
        }
    }

    /**
     * Get timeline entries for a project with optional filters
     * @param {string} projectId
     * @param {object} filters - Optional filters
     * @returns {AuditEntry[]}
     */
    function getTimeline(projectId, filters = {}) {
        if (!_initialized) return [];

        let entries = _storage.entries.filter(e => e.projectId === projectId);

        // Apply filters
        if (filters.user) {
            entries = entries.filter(e => e.userId === filters.user);
        }
        if (filters.action) {
            entries = entries.filter(e => e.type === filters.action);
        }
        if (filters.entityType) {
            entries = entries.filter(e => e.entityType === filters.entityType);
        }
        if (filters.dateFrom) {
            const from = new Date(filters.dateFrom).getTime();
            entries = entries.filter(e => new Date(e.timestamp).getTime() >= from);
        }
        if (filters.dateTo) {
            const to = new Date(filters.dateTo).getTime();
            entries = entries.filter(e => new Date(e.timestamp).getTime() <= to);
        }
        if (filters.status) {
            entries = entries.filter(e => e.status === filters.status);
        }

        // Sort
        const sortDesc = filters.sort !== 'oldest';
        entries.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return sortDesc ? timeB - timeA : timeA - timeB;
        });

        // Limit
        if (filters.limit) {
            entries = entries.slice(0, filters.limit);
        }

        return entries;
    }

    /**
     * Get version history for a project
     * @param {string} projectId
     * @returns {VersionEntry[]}
     */
    function getVersions(projectId) {
        if (!_initialized) return [];

        const versions = _storage.versions
            .filter(v => v.projectId === projectId)
            .sort((a, b) => a.versionNumber - b.versionNumber);

        return versions;
    }

    /**
     * Get approval history for a project
     * @param {string} projectId
     * @returns {ApprovalEntry[]}
     */
    function getApprovals(projectId) {
        if (!_initialized) return [];

        const approvals = _storage.approvals
            .filter(a => a.projectId === projectId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return approvals;
    }

    /**
     * Export audit data for a project (stub for Sprint 9)
     * @param {string} projectId
     * @returns {object}
     */
    function exportData(projectId) {
        if (!_initialized) return null;

        return {
            projectId: projectId,
            exportedAt: getTimestamp(),
            entries: getTimeline(projectId),
            versions: getVersions(projectId),
            approvals: getApprovals(projectId),
            summary: {
                totalEntries: _storage.entries.filter(e => e.projectId === projectId).length,
                totalVersions: _storage.versions.filter(v => v.projectId === projectId).length,
                totalApprovals: _storage.approvals.filter(a => a.projectId === projectId).length
            }
        };
    }

    /**
     * Prune old entries (maintenance)
     * @param {number} maxAge - Maximum age in days
     */
    function prune(maxAge = 90) {
        if (!_initialized) return;

        const cutoff = Date.now() - (maxAge * 24 * 60 * 60 * 1000);

        _storage.entries = _storage.entries.filter(e =>
            new Date(e.timestamp).getTime() >= cutoff
        );
        _storage.versions = _storage.versions.filter(v =>
            new Date(v.timestamp).getTime() >= cutoff
        );
        _storage.approvals = _storage.approvals.filter(a =>
            new Date(a.timestamp).getTime() >= cutoff
        );

        saveStorage();
    }

    /**
     * Get recent activities across all projects (for Dashboard)
     * @param {number} limit
     * @returns {AuditEntry[]}
     */
    function getRecentActivities(limit = 10) {
        console.log('[AuditTrail.getRecentActivities] Called, initialized:', _initialized, 'entries count:', _storage.entries.length);

        if (!_initialized) {
            console.log('[AuditTrail.getRecentActivities] Not initialized, returning []');
            return [];
        }

        const entries = [..._storage.entries]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        console.log('[AuditTrail.getRecentActivities] Returning', entries.length, 'entries');
        console.log('[AuditTrail.getRecentActivities] Entries:', entries.map(e => ({
            id: e.id,
            type: e.type,
            timestamp: e.timestamp,
            summary: e.summary
        })));

        return entries;
    }

    /**
     * Get audit statistics for a project
     * @param {string} projectId
     * @returns {object}
     */
    function getStatistics(projectId) {
        if (!_initialized) return null;

        const projectEntries = _storage.entries.filter(e => e.projectId === projectId);

        const actionCounts = {};
        const sourceCounts = {};
        const entityCounts = {};

        projectEntries.forEach(entry => {
            actionCounts[entry.type] = (actionCounts[entry.type] || 0) + 1;
            sourceCounts[entry.source] = (sourceCounts[entry.source] || 0) + 1;
            if (entry.entityType) {
                entityCounts[entry.entityType] = (entityCounts[entry.entityType] || 0) + 1;
            }
        });

        return {
            totalEntries: projectEntries.length,
            totalVersions: _storage.versions.filter(v => v.projectId === projectId).length,
            totalApprovals: _storage.approvals.filter(a => a.projectId === projectId).length,
            actionCounts,
            sourceCounts,
            entityCounts,
            firstActivity: projectEntries.length > 0 ? projectEntries[0].timestamp : null,
            lastActivity: projectEntries.length > 0 ? projectEntries[projectEntries.length - 1].timestamp : null
        };
    }

    // ============================================
    // Initialization
    // ============================================

    function init() {
        if (_initialized) return;

        loadStorage();
        _initialized = true;
        console.log('AuditTrail: Initialized');
    }

    // ============================================
    // Public API
    // ============================================

    return {
        // Core operations
        record,
        getTimeline,
        getVersions,
        getApprovals,
        exportData,

        // Maintenance
        prune,

        // Dashboard
        getRecentActivities,
        getStatistics,

        // Initialization
        init
    };
})();

// Auto-initialize when script loads
(function () {
    if (typeof AuditTrail !== 'undefined') {
        AuditTrail.init();
    }
})();
