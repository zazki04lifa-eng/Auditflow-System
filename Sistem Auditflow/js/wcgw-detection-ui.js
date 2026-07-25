/**
 * AuditFlow - WCGW Detection UI Module
 * Handles rendering and UI management for WCGW detection panel
 */

const WCGWDetectionUI = (function () {
    'use strict';

    // Cached elements
    let elements = {};

    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements = {
            // Detection panel
            detectionPanel: document.getElementById('detection-panel'),
            detectionList: document.getElementById('detection-list'),
            detectionStats: document.getElementById('detection-stats'),
            detectionEmpty: document.getElementById('detection-empty'),
            closeDetectionPanel: document.getElementById('close-detection-panel'),

            // Detection detail modal
            detectionDetailModal: document.getElementById('detection-modal'),
            closeDetectionModal: document.getElementById('close-detection-modal'),
            detectionId: document.getElementById('detection-id'),
            detectionWcgw: document.getElementById('detection-wcgw'),
            detectionAssertion: document.getElementById('detection-assertion'),
            detectionRisk: document.getElementById('detection-risk'),
            detectionStatus: document.getElementById('detection-status'),
            detectionDescription: document.getElementById('detection-description'),
            detectionIndicators: document.getElementById('detection-indicators'),
            detectionControls: document.getElementById('detection-controls'),
            detectionAffectedNodes: document.getElementById('detection-affected-nodes'),

            // Action buttons
            acceptBtn: document.getElementById('accept-detection-btn'),
            rejectBtn: document.getElementById('reject-detection-btn'),
            mitigateBtn: document.getElementById('mitigate-detection-btn'),

            // Export modal
            exportModal: document.getElementById('export-modal'),
            exportFormat: document.getElementById('export-format'),
            exportBtn: document.getElementById('export-report-btn')
        };
    }

    /**
     * Get cached elements
     */
    function getElements() {
        return elements;
    }

    /**
     * Update detection panel statistics
     */
    function updateStats(stats) {
        if (!elements.detectionStats) return;

        const statsHTML = `
            <div class="stat-item">
                <span class="stat-value">${stats.total}</span>
                <span class="stat-label">Total</span>
            </div>
            <div class="stat-item stat-high">
                <span class="stat-value">${stats.byRiskLevel.high}</span>
                <span class="stat-label">High</span>
            </div>
            <div class="stat-item stat-medium">
                <span class="stat-value">${stats.byRiskLevel.medium}</span>
                <span class="stat-label">Medium</span>
            </div>
            <div class="stat-item stat-low">
                <span class="stat-value">${stats.byRiskLevel.low}</span>
                <span class="stat-label">Low</span>
            </div>
        `;

        elements.detectionStats.innerHTML = statsHTML;
    }

    /**
     * Render detection list
     */
    function renderDetectionList(detections) {
        if (!elements.detectionList) return;

        if (!detections || detections.length === 0) {
            elements.detectionList.innerHTML = '';
            if (elements.detectionEmpty) {
                elements.detectionEmpty.classList.remove('hidden');
            }
            return;
        }

        if (elements.detectionEmpty) {
            elements.detectionEmpty.classList.add('hidden');
        }

        const riskColors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };

        const riskLabels = {
            high: 'Tinggi',
            medium: 'Sedang',
            low: 'Rendah'
        };

        const listHTML = detections.map(detection => `
            <div class="detection-item" data-detection-id="${detection.id}" data-risk="${detection.riskLevel}">
                <div class="detection-item-header">
                    <span class="risk-badge" style="background-color: ${riskColors[detection.riskLevel]}">
                        ${riskLabels[detection.riskLevel]}
                    </span>
                    <span class="detection-title">${detection.wcgw[0]?.name || 'Unknown WCGW'}</span>
                </div>
                <div class="detection-item-meta">
                    <span class="assertion-badge">${detection.assertion}</span>
                    <span class="status-badge ${detection.status}">${detection.status}</span>
                </div>
            </div>
        `).join('');

        elements.detectionList.innerHTML = listHTML;

        // Add click listeners
        elements.detectionList.querySelectorAll('.detection-item').forEach(item => {
            item.addEventListener('click', () => {
                const detectionId = item.dataset.detectionId;
                if (typeof WCGWDetection !== 'undefined') {
                    WCGWDetection.showDetectionDetail(detectionId);
                }
            });
        });
    }

    /**
     * Show detection detail modal
     */
    function showDetectionDetail(detection) {
        if (!elements.detectionDetailModal) return;

        const riskColors = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };

        // Update modal content
        if (elements.detectionId) elements.detectionId.textContent = `#${detection.id.slice(-6)}`;
        if (elements.detectionWcgw) elements.detectionWcgw.textContent = detection.wcgw[0]?.name || 'Unknown WCGW';
        if (elements.detectionAssertion) elements.detectionAssertion.textContent = detection.assertion;
        if (elements.detectionRisk) {
            elements.detectionRisk.innerHTML = `
                <span class="risk-badge" style="background-color: ${riskColors[detection.riskLevel]}">
                    ${detection.riskLevel.toUpperCase()}
                </span>
            `;
        }
        if (elements.detectionStatus) {
            elements.detectionStatus.textContent = detection.status;
            elements.detectionStatus.className = `status-badge ${detection.status}`;
        }
        if (elements.detectionDescription && detection.wcgw[0]?.description) {
            elements.detectionDescription.textContent = detection.wcgw[0].description;
        }

        // Render indicators
        if (elements.detectionIndicators && detection.wcgw[0]?.indicators) {
            elements.detectionIndicators.innerHTML = detection.wcgw[0].indicators
                .map(ind => `<li>${ind}</li>`)
                .join('');
        }

        // Render recommended controls
        if (elements.detectionControls && detection.recommendedControls) {
            elements.detectionControls.innerHTML = detection.recommendedControls
                .map(ctrl => `<li>${ctrl.name}</li>`)
                .join('');
        }

        // Update action button states based on current status
        updateActionButtons(detection.status);

        // Show modal
        elements.detectionDetailModal.classList.remove('hidden');
    }

    /**
     * Update action button states
     */
    function updateActionButtons(status) {
        if (elements.acceptBtn) elements.acceptBtn.disabled = status === 'accepted';
        if (elements.rejectBtn) elements.rejectBtn.disabled = status === 'rejected';
        if (elements.mitigateBtn) elements.mitigateBtn.disabled = status === 'mitigated';
    }

    /**
     * Hide detection detail modal
     */
    function hideDetailModal() {
        if (elements.detectionDetailModal) {
            elements.detectionDetailModal.classList.add('hidden');
        }
    }

    /**
     * Show export modal
     */
    function showExportModal() {
        if (elements.exportModal) {
            elements.exportModal.classList.remove('hidden');
        }
    }

    /**
     * Hide export modal
     */
    function hideExportModal() {
        if (elements.exportModal) {
            elements.exportModal.classList.add('hidden');
        }
    }

    /**
     * Show detection panel
     */
    function showDetectionPanel() {
        if (elements.detectionPanel) {
            elements.detectionPanel.classList.remove('hidden');
        }
    }

    /**
     * Hide detection panel
     */
    function hideDetectionPanel() {
        if (elements.detectionPanel) {
            elements.detectionPanel.classList.add('hidden');
        }
    }

    // Public API
    return {
        cacheElements,
        getElements,
        updateStats,
        renderDetectionList,
        showDetectionDetail,
        hideDetailModal,
        showExportModal,
        hideExportModal,
        showDetectionPanel,
        hideDetectionPanel
    };
})();