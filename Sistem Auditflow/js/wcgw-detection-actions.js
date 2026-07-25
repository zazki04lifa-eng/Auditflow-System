/**
 * AuditFlow - WCGW Detection Actions Module
 * Handles detection actions: accept, reject, mitigate, export
 */

const WCGWDetectionActions = (function () {
    'use strict';

    // Private state
    let _onDetectionUpdateCallback = null;

    /**
     * Initialize actions module
     */
    function init(callbacks = {}) {
        _onDetectionUpdateCallback = callbacks.onDetectionUpdate || null;
    }

    /**
     * Accept a detection
     */
    function acceptDetection(detectionId, notes = '') {
        if (typeof RiskEngine === 'undefined') return false;

        RiskEngine.acceptDetection(detectionId, notes);

        if (_onDetectionUpdateCallback) {
            _onDetectionUpdateCallback();
        }

        return true;
    }

    /**
     * Reject a detection
     */
    function rejectDetection(detectionId, notes = '') {
        if (typeof RiskEngine === 'undefined') return false;

        RiskEngine.rejectDetection(detectionId, notes);

        if (_onDetectionUpdateCallback) {
            _onDetectionUpdateCallback();
        }

        return true;
    }

    /**
     * Mark detection as mitigated
     */
    function mitigateDetection(detectionId, mitigationPlan = '') {
        if (typeof RiskEngine === 'undefined') return false;

        RiskEngine.mitigateDetection(detectionId, mitigationPlan);

        if (_onDetectionUpdateCallback) {
            _onDetectionUpdateCallback();
        }

        return true;
    }

    /**
     * Export detection report
     */
    function exportReport(format = 'json') {
        if (typeof RiskEngine === 'undefined') return null;

        const reportData = RiskEngine.exportData(format);

        if (!reportData) {
            console.error('WCGWDetectionActions: Failed to export report');
            return null;
        }

        // Generate filename
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `wcgw-report-${timestamp}`;

        switch (format) {
            case 'json':
                downloadAsFile(`${filename}.json`, JSON.stringify(reportData, null, 2), 'application/json');
                break;
            case 'pdf':
                // For PDF, we'd need a library like jsPDF
                // For now, export as JSON with note
                alert('PDF export requires additional library. Exporting as JSON instead.');
                downloadAsFile(`${filename}.json`, JSON.stringify(reportData, null, 2), 'application/json');
                break;
            case 'docx':
                // For DOCX, we'd need a library like docx.js
                // For now, export as JSON with note
                alert('DOCX export requires additional library. Exporting as JSON instead.');
                downloadAsFile(`${filename}.json`, JSON.stringify(reportData, null, 2), 'application/json');
                break;
            default:
                downloadAsFile(`${filename}.json`, JSON.stringify(reportData, null, 2), 'application/json');
        }

        return reportData;
    }

    /**
     * Download content as file
     */
    function downloadAsFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Set detection update callback
     */
    function setOnDetectionUpdateCallback(callback) {
        _onDetectionUpdateCallback = callback;
    }

    // Public API
    return {
        init,
        acceptDetection,
        rejectDetection,
        mitigateDetection,
        exportReport,
        setOnDetectionUpdateCallback
    };
})();