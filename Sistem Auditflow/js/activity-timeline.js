/**
 * AuditFlow - Activity Timeline Component (Sprint 5)
 * 
 * Reusable timeline component for displaying audit trail activities.
 * Used in both Dashboard (Recent Activity) and Project Detail pages.
 * 
 * Usage:
 * ActivityTimeline.render(containerId, { projectId: 'proj-123', limit: 10 })
 * ActivityTimeline.render('dashboard-timeline', { mode: 'recent', limit: 5 })
 */

const ActivityTimeline = (function () {
    // ============================================
    // Configuration
    // ============================================

    const DEFAULTS = {
        limit: 10,
        showDetails: false,
        showFilter: false,
        dateFormat: 'short', // 'short' | 'long' | 'relative'
        emptyMessage: 'No activities found'
    };

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Format timestamp for display
     */
    function formatTimestamp(timestamp, format) {
        const date = new Date(timestamp);

        switch (format) {
            case 'short':
                return date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            case 'long':
                return date.toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            case 'relative':
                return getRelativeTime(date);
            default:
                return formatTimestamp(timestamp, 'short');
        }
    }

    /**
     * Get relative time string
     */
    function getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString('id-ID');
        } else if (days > 0) {
            return `${days} hari yang lalu`;
        } else if (hours > 0) {
            return `${hours} jam yang lalu`;
        } else if (minutes > 0) {
            return `${minutes} menit yang lalu`;
        } else {
            return 'Baru saja';
        }
    }

    /**
     * Get icon for action type
     */
    function getActionIcon(action) {
        const icons = {
            'session.start': '🔓',
            'session.end': '🔒',
            'project.create': '📁',
            'project.update': '✏️',
            'project.delete': '🗑️',
            'understanding-business.update': '📝',
            'flowchart.generate': '📊',
            'flowchart.manual-edit': '🔧',
            'parser.run': '⚙️',
            'wcgw.detect': '⚠️',
            'wcgw.add': '➕',
            'wcgw.remove': '➖',
            'wcgw.update': '🔄',
            'review.submit': '📤',
            'review.approve': '✅',
            'review.reject': '❌',
            'review.revise': '📋',
            'export.report': '📄',
            'export.flowchart': '🖼️',
            'settings.update': '⚙️',
            'knowledgebase.update': '📚'
        };
        return icons[action] || '📌';
    }

    /**
     * Get CSS class for action type
     */
    function getActionClass(action) {
        if (action.startsWith('session.')) return 'timeline-item--session';
        if (action.startsWith('project.')) return 'timeline-item--project';
        if (action.startsWith('flowchart.')) return 'timeline-item--flowchart';
        if (action.startsWith('wcgw.')) return 'timeline-item--wcgw';
        if (action.startsWith('review.')) return 'timeline-item--review';
        if (action.startsWith('export.')) return 'timeline-item--export';
        return 'timeline-item--default';
    }

    /**
     * Get source badge
     */
    function getSourceBadge(source) {
        const badges = {
            'manual': { text: 'Manual', class: 'badge--manual' },
            'rule-engine': { text: 'Rule Engine', class: 'badge--rule' },
            'ai': { text: 'AI', class: 'badge--ai' },
            'system': { text: 'System', class: 'badge--system' }
        };
        return badges[source] || badges['manual'];
    }

    // ============================================
    // Render Functions
    // ============================================

    /**
     * Render a single timeline item
     */
    function renderTimelineItem(entry, showDetails) {
        const icon = getActionIcon(entry.type);
        const actionClass = getActionClass(entry.type);
        const sourceBadge = getSourceBadge(entry.source);
        const time = formatTimestamp(entry.timestamp, 'short');

        let detailsHtml = '';
        if (showDetails && entry.details) {
            if (entry.details.changes && entry.details.changes.length > 0) {
                detailsHtml = `
                    <div class="timeline-item__changes">
                        ${entry.details.changes.map(change => `
                            <div class="timeline-item__change">${change}</div>
                        `).join('')}
                    </div>
                `;
            }
        }

        return `
            <div class="timeline-item ${actionClass}" data-entry-id="${entry.id}">
                <div class="timeline-item__icon">${icon}</div>
                <div class="timeline-item__content">
                    <div class="timeline-item__header">
                        <span class="timeline-item__summary">${entry.summary}</span>
                        <span class="timeline-item__time">${time}</span>
                    </div>
                    <div class="timeline-item__meta">
                        <span class="timeline-item__user">${entry.userId}</span>
                        <span class="timeline-item__badge ${sourceBadge.class}">${sourceBadge.text}</span>
                        ${entry.entityType ? `<span class="timeline-item__entity">${entry.entityType}</span>` : ''}
                    </div>
                    ${detailsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    function renderEmptyState(message) {
        return `
            <div class="timeline-empty">
                <div class="timeline-empty__icon">📭</div>
                <div class="timeline-empty__message">${message}</div>
            </div>
        `;
    }

    /**
     * Render loading state
     */
    function renderLoading() {
        return `
            <div class="timeline-loading">
                <div class="timeline-loading__spinner"></div>
                <div class="timeline-loading__text">Loading activities...</div>
            </div>
        `;
    }

    // ============================================
    // Core Render Function
    // ============================================

    /**
     * Render timeline in container
     * @param {string} containerId - DOM element ID
     * @param {object} options - Rendering options
     */
    function render(containerId, options = {}) {
        const config = { ...DEFAULTS, ...options };
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn('ActivityTimeline: Container not found:', containerId);
            return;
        }

        container.innerHTML = renderLoading();

        try {
            let entries;

            if (config.mode === 'recent') {
                // Get recent activities across all projects
                entries = AuditTrail.getRecentActivities(config.limit);
            } else if (config.projectId) {
                // Get activities for specific project
                entries = AuditTrail.getTimeline(config.projectId, {
                    limit: config.limit,
                    sort: 'newest'
                });
            } else {
                entries = [];
            }

            if (entries.length === 0) {
                container.innerHTML = renderEmptyState(config.emptyMessage);
                return;
            }

            const html = entries.map(entry =>
                renderTimelineItem(entry, config.showDetails)
            ).join('');

            container.innerHTML = `
                <div class="timeline">
                    <div class="timeline__header">
                        <h3 class="timeline__title">
                            ${config.title || 'Activity Timeline'}
                        </h3>
                        ${config.showFilter ? `
                            <div class="timeline__filter">
                                <select class="timeline__filter-select" onchange="ActivityTimeline.filter(this.value)">
                                    <option value="all">All Activities</option>
                                    <option value="project">Projects</option>
                                    <option value="flowchart">Flowcharts</option>
                                    <option value="wcgw">WCGW</option>
                                    <option value="review">Reviews</option>
                                </select>
                            </div>
                        ` : ''}
                    </div>
                    <div class="timeline__body">
                        ${html}
                    </div>
                </div>
            `;
        } catch (e) {
            console.error('ActivityTimeline: Error rendering:', e);
            container.innerHTML = renderEmptyState('Error loading activities');
        }
    }

    /**
     * Filter timeline by type
     */
    function filter(filterType) {
        // This would be called from the filter dropdown
        // For now, just reload with filter
        console.log('ActivityTimeline: Filter applied:', filterType);
    }

    /**
     * Refresh timeline
     */
    function refresh(containerId, options = {}) {
        render(containerId, options);
    }

    // ============================================
    // Public API
    // ============================================

    return {
        render,
        filter,
        refresh
    };
})();
