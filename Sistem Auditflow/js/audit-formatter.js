/**
 * AuditFlow - Audit Summary Formatter (Sprint 5)
 * 
 * Centralized formatter for generating consistent audit entry summaries.
 * All audit summaries must be generated through this module to ensure
 * consistency across the application and future AI integration.
 * 
 * Usage:
 * AuditFormatter.format('flowchart.generate', { actorCount: 4, activityCount: 5 })
 * // Returns: "Flowchart generated with 4 actors and 5 activities"
 */

const AuditFormatter = (function () {
    // ============================================
    // Action Summary Templates
    // ============================================

    const TEMPLATES = {
        // Session
        'session.start': (ctx) => `Session started by ${ctx.userName || 'user'}`,
        'session.end': (ctx) => `Session ended by ${ctx.userName || 'user'}`,

        // Project
        'project.create': (ctx) => `Project "${ctx.projectName || 'New Project'}" created`,
        'project.update': (ctx) => `Project "${ctx.projectName || ctx.projectId}' updated`,
        'project.delete': (ctx) => `Project "${ctx.projectName || ctx.projectId}' deleted`,

        // Understanding Business
        'understanding-business.update': (ctx) => `Business understanding updated`,

        // Flowchart
        'flowchart.generate': (ctx) => {
            const parts = [];
            if (ctx.actorCount !== undefined) parts.push(`${ctx.actorCount} actors`);
            if (ctx.activityCount !== undefined) parts.push(`${ctx.activityCount} activities`);
            if (ctx.decisionCount !== undefined) parts.push(`${ctx.decisionCount} decisions`);
            if (ctx.documentCount !== undefined) parts.push(`${ctx.documentCount} documents`);
            return `Flowchart generated with ${parts.join(', ')}`;
        },
        'flowchart.auto-generate': (ctx) => `Flowchart auto-generated`,
        'flowchart.manual-edit': (ctx) => {
            if (ctx.nodeType && ctx.nodeName) {
                return `Flowchart edited: ${ctx.nodeType} "${ctx.nodeName}" modified`;
            }
            return `Flowchart manually edited`;
        },
        'flowchart.lock': (ctx) => `Flowchart locked by ${ctx.userName || 'user'}`,
        'flowchart.unlock': (ctx) => `Flowchart unlocked by ${ctx.userName || 'user'}`,

        // Parser
        'parser.run': (ctx) => `Parser executed in ${ctx.duration || 0}ms`,

        // WCGW
        'wcgw.detect': (ctx) => {
            if (ctx.riskCount !== undefined) {
                return `${ctx.riskCount} WCGW risks detected`;
            }
            return `WCGW detection run completed`;
        },
        'wcgw.add': (ctx) => `WCGW risk added: ${ctx.riskName || 'Unknown risk'}`,
        'wcgw.remove': (ctx) => `WCGW risk removed: ${ctx.riskName || 'Unknown risk'}`,
        'wcgw.update': (ctx) => `WCGW risk updated: ${ctx.riskName || 'Unknown risk'}`,

        // Review
        'review.submit': (ctx) => `Review submitted by ${ctx.userName || 'user'}`,
        'review.approve': (ctx) => `Project approved by ${ctx.userName || ctx.reviewerName || 'reviewer'}`,
        'review.reject': (ctx) => `Project rejected by ${ctx.userName || ctx.reviewerName || 'reviewer'}`,
        'review.revise': (ctx) => `Project revision requested by ${ctx.userName || ctx.reviewerName || 'reviewer'}`,

        // Export
        'export.report': (ctx) => `Report exported as ${ctx.format || 'PDF'}`,
        'export.flowchart': (ctx) => `Flowchart exported as ${ctx.format || 'PNG'}`,

        // Settings
        'settings.update': (ctx) => `Settings updated: ${ctx.settingName || 'unknown'}`,
        'knowledgebase.update': (ctx) => `Knowledge base updated`
    };

    // ============================================
    // Formatter Functions
    // ============================================

    /**
     * Format an audit action into a human-readable summary
     * @param {string} action - AuditActionType
     * @param {object} context - Context data for formatting
     * @returns {string} Formatted summary
     */
    function format(action, context = {}) {
        const template = TEMPLATES[action];
        if (template) {
            try {
                return template(context);
            } catch (e) {
                console.warn('AuditFormatter: Error formatting action:', action, e);
            }
        }

        // Fallback for unknown actions
        return `Action: ${action}`;
    }

    /**
     * Format a change summary for version history
     * @param {string} entityType - Type of entity changed
     * @param {string} changeType - Type of change (added, removed, modified)
     * @param {object} details - Change details
     * @returns {string} Formatted change summary
     */
    function formatChange(entityType, changeType, details = {}) {
        const templates = {
            node: {
                added: `+ Node Added: ${details.name || 'Unknown'}`,
                removed: `- Node Removed: ${details.name || 'Unknown'}`,
                modified: `~ Node Modified: ${details.name || 'Unknown'}`
            },
            connector: {
                added: `+ Connector Added`,
                removed: `- Connector Removed`,
                modified: `~ Connector Modified`
            },
            swimlane: {
                added: `+ Swimlane Added: ${details.name || 'Unknown'}`,
                removed: `- Swimlane Removed: ${details.name || 'Unknown'}`,
                modified: `~ Swimlane Modified: ${details.name || 'Unknown'}`
            },
            wcgw: {
                added: `+ WCGW Added: ${details.name || 'Unknown'}`,
                removed: `- WCGW Removed: ${details.name || 'Unknown'}`,
                modified: `~ WCGW Updated: ${details.name || 'Unknown'}`
            }
        };

        const entityTemplate = templates[entityType];
        if (entityTemplate && entityTemplate[changeType]) {
            return entityTemplate[changeType];
        }

        return `${changeType} ${entityType}`;
    }

    /**
     * Format parser metadata summary for audit
     * @param {object} parserMetadata - Parser metadata from Sprint 4
     * @returns {string} Formatted summary
     */
    function formatParserMetadata(parserMetadata) {
        if (!parserMetadata || !parserMetadata.validationSummary) {
            return 'Parser executed';
        }

        const summary = parserMetadata.validationSummary;
        const parts = [];

        if (summary.actors > 0) parts.push(`${summary.actors} actors`);
        if (summary.activities > 0) parts.push(`${summary.activities} activities`);
        if (summary.decisions > 0) parts.push(`${summary.decisions} decisions`);
        if (summary.documents > 0) parts.push(`${summary.documents} documents`);
        if (summary.databases > 0) parts.push(`${summary.databases} databases`);

        return `Flowchart generated with ${parts.join(', ')}`;
    }

    // ============================================
    // Public API
    // ============================================

    return {
        format,
        formatChange,
        formatParserMetadata
    };
})();
