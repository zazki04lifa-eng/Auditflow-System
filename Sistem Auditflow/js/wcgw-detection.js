/**
 * AuditFlow - WCGW Detection Module (Main Entry Point)
 * Orchestrates UI and actions modules for WCGW detection
 */

const WCGWDetection = (function () {
    'use strict';

    // Private state
    let _flowchartEditor = null;
    let _selectedDetection = null;
    let _detections = [];

    /**
     * Initialize WCGW Detection module
     */
    function init(flowchartEditor) {
        _flowchartEditor = flowchartEditor;

        // Initialize UI module
        if (typeof WCGWDetectionUI !== 'undefined') {
            WCGWDetectionUI.cacheElements();
        }

        // Initialize actions module
        if (typeof WCGWDetectionActions !== 'undefined') {
            WCGWDetectionActions.init({
                onDetectionUpdate: updateFromEngine
            });
        }

        // Setup event listeners
        _setupEventListeners();

        console.log('WCGWDetection: Initialized');
    }

    /**
     * Setup event listeners
     */
    function _setupEventListeners() {
        const elements = typeof WCGWDetectionUI !== 'undefined'
            ? WCGWDetectionUI.getElements()
            : {};

        // Run detection button
        if (elements.runDetectionBtn) {
            elements.runDetectionBtn.addEventListener('click', runDetection);
        }

        // Close detection panel
        if (elements.closeDetectionPanel) {
            elements.closeDetectionPanel.addEventListener('click', () => {
                WCGWDetectionUI.hideDetectionPanel();
            });
        }

        // Close detail modal
        if (elements.closeDetectionModal) {
            elements.closeDetectionModal.addEventListener('click', () => {
                WCGWDetectionUI.hideDetailModal();
            });
        }

        // Accept detection
        if (elements.acceptBtn) {
            elements.acceptBtn.addEventListener('click', () => {
                if (_selectedDetection) {
                    WCGWDetectionActions.acceptDetection(_selectedDetection.id);
                    recordWCGWAudit('wcgw.accept', _selectedDetection);
                    WCGWDetectionUI.hideDetailModal();
                    updateFromEngine();
                }
            });
        }

        // Reject detection
        if (elements.rejectBtn) {
            elements.rejectBtn.addEventListener('click', () => {
                if (_selectedDetection) {
                    WCGWDetectionActions.rejectDetection(_selectedDetection.id);
                    recordWCGWAudit('wcgw.reject', _selectedDetection);
                    WCGWDetectionUI.hideDetailModal();
                    updateFromEngine();
                }
            });
        }

        // Mitigate detection
        if (elements.mitigateBtn) {
            elements.mitigateBtn.addEventListener('click', () => {
                if (_selectedDetection) {
                    WCGWDetectionActions.mitigateDetection(_selectedDetection.id);
                    recordWCGWAudit('wcgw.mitigate', _selectedDetection);
                    WCGWDetectionUI.hideDetailModal();
                    updateFromEngine();
                }
            });
        }

        // Export button
        if (elements.exportBtn) {
            elements.exportBtn.addEventListener('click', () => {
                const format = elements.exportFormat?.value || 'json';
                WCGWDetectionActions.exportReport(format);
                WCGWDetectionUI.hideExportModal();
            });
        }
    }

    /**
     * Run WCGW detection
     */
    function runDetection() {
        console.log('[WCGWDetection] runDetection called');

        if (!_flowchartEditor) {
            console.error('[WCGWDetection] Flowchart editor not initialized');
            return;
        }
        console.log('[WCGWDetection] Flowchart editor is available');

        if (typeof RiskEngine === 'undefined') {
            console.error('[WCGWDetection] RiskEngine not available');
            return;
        }
        console.log('[WCGWDetection] RiskEngine is available');

        const flowchartData = _flowchartEditor.getFlowchartData();
        const projectInfo = _flowchartEditor.getProjectInfo();

        console.log('[WCGWDetection] Flowchart data:', {
            nodes: flowchartData.nodes ? flowchartData.nodes.length : 0,
            connectors: flowchartData.connectors ? flowchartData.connectors.length : 0,
            swimlanes: flowchartData.swimlanes ? flowchartData.swimlanes.length : 0
        });

        console.log('[WCGWDetection] Project info:', projectInfo ? 'available' : 'null');

        if (!projectInfo) {
            console.error('[WCGWDetection] Project info is null - cannot initialize RiskEngine');
            return;
        }

        // Initialize risk engine
        RiskEngine.init(projectInfo, flowchartData);
        console.log('[WCGWDetection] RiskEngine.init() called');

        // Run detection
        const results = RiskEngine.runDetection();
        console.log('[WCGWDetection] RiskEngine.runDetection() returned');

        if (!results) {
            console.error('[WCGWDetection] RiskEngine.runDetection() returned null/undefined');
            return;
        }

        if (!results.detections) {
            console.error('[WCGWDetection] RiskEngine.runDetection() returned without detections array');
            return;
        }

        console.log('[WCGWDetection] Detection results:', results.detections.length, 'detections');

        // Update UI
        updateFromEngine();

        // Show detection panel
        if (typeof WCGWDetectionUI !== 'undefined') {
            WCGWDetectionUI.showDetectionPanel();
            console.log('[WCGWDetection] Detection panel shown');
        }

        // Audit Trail: Record wcgw.detect (Sprint 5)
        recordWCGWAudit('wcgw.detect', null, {
            detectionCount: results.detections.length,
            highRiskCount: results.detections.filter(d => d.riskLevel === 'high').length,
            mediumRiskCount: results.detections.filter(d => d.riskLevel === 'medium').length,
            lowRiskCount: results.detections.filter(d => d.riskLevel === 'low').length
        });

        console.log('WCGWDetection: Detection complete. Found', results.detections.length, 'detections');
    }

    /**
     * Helper function to record WCGW audit actions (non-blocking)
     */
    function recordWCGWAudit(action, detection, additionalDetails = {}) {
        if (typeof AuditTrail === 'undefined') return;

        try {
            const user = AuditFlow.getUser();
            const project = AuditFlow.getCurrentProject();
            AuditTrail.record(action, {
                userId: user ? user.id : null,
                projectId: project ? project.id : null,
                detectionId: detection ? detection.id : null,
                riskLevel: detection ? detection.riskLevel : null,
                assertion: detection ? detection.assertion : null,
                ...additionalDetails,
                source: 'manual'
            });
        } catch (e) {
            // Silent fail - audit should not affect main functionality
            console.warn('AuditTrail WCGW action failed:', e);
        }
    }

    /**
     * Update detections from RiskEngine
     */
    function updateFromEngine() {
        if (typeof RiskEngine === 'undefined') return;

        _detections = RiskEngine.getDetections();

        // Update UI
        if (typeof WCGWDetectionUI !== 'undefined') {
            const stats = RiskEngine.getStatistics();
            WCGWDetectionUI.updateStats(stats);
            WCGWDetectionUI.renderDetectionList(_detections);
        }
    }

    /**
     * Show detection detail modal
     */
    function showDetectionDetail(detectionId) {
        if (typeof RiskEngine === 'undefined') return;

        _selectedDetection = RiskEngine.getDetectionById(detectionId);

        if (_selectedDetection && typeof WCGWDetectionUI !== 'undefined') {
            WCGWDetectionUI.showDetectionDetail(_selectedDetection);
        }
    }

    /**
     * Hide detection detail modal
     */
    function hideDetailModal() {
        if (typeof WCGWDetectionUI !== 'undefined') {
            WCGWDetectionUI.hideDetailModal();
        }
        _selectedDetection = null;
    }

    /**
     * Show export modal
     */
    function showExportModal() {
        if (typeof WCGWDetectionUI !== 'undefined') {
            WCGWDetectionUI.showExportModal();
        }
    }

    /**
     * Get current detections
     */
    function getDetections() {
        return _detections;
    }

    /**
     * Get selected detection
     */
    function getSelectedDetection() {
        return _selectedDetection;
    }

    // Public API
    return {
        init,
        runDetection,
        showDetectionDetail,
        hideDetailModal,
        showExportModal,
        getDetections,
        getSelectedDetection
    };
})();