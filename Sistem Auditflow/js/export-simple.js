/**
 * AuditFlow - Simple Export Module
 * Provides basic export functionality without touching existing rendering code
 * 
 * Features:
 * - Export project data as JSON
 * - Export flowchart canvas as PNG (using html2canvas CDN)
 */

const ExportSimple = (function () {
    'use strict';

    /**
     * Export current project as JSON file
     */
    function exportAsJSON() {
        console.log('[ExportSimple] Exporting as JSON...');

        // Get current project from localStorage
        const stored = localStorage.getItem('auditflow_current_project');
        if (!stored) {
            alert('Tidak ada project yang sedang dibuka.');
            return;
        }

        try {
            const project = JSON.parse(stored);
            const projectName = (project.projectInfo && project.projectInfo.projectName) || 'untitled';
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `AuditFlow_${projectName.replace(/\s+/g, '_')}_${timestamp}.json`;

            // Create and trigger download
            const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('[ExportSimple] JSON exported:', filename);
            alert(`Project berhasil diekspor sebagai ${filename}`);
        } catch (e) {
            console.error('[ExportSimple] Error exporting JSON:', e);
            alert('Gagal mengekspor project: ' + e.message);
        }
    }

    /**
     * Export flowchart canvas as PNG using html2canvas
     */
    function exportAsPNG() {
        console.log('[ExportSimple] Exporting as PNG...');

        // Check if html2canvas is loaded
        if (typeof html2canvas === 'undefined') {
            alert('Library html2canvas belum dimuat. Silakan coba lagi dalam beberapa detik.');
            return;
        }

        const canvas = document.getElementById('flowchart-canvas');
        if (!canvas) {
            alert('Canvas flowchart tidak ditemukan.');
            return;
        }

        // Get project name for filename
        const stored = localStorage.getItem('auditflow_current_project');
        let projectName = 'untitled';
        if (stored) {
            try {
                const project = JSON.parse(stored);
                if (project.projectInfo && project.projectInfo.projectName) {
                    projectName = project.projectInfo.projectName;
                }
            } catch (e) {
                // ignore
            }
        }
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `Flowchart_${projectName.replace(/\s+/g, '_')}_${timestamp}.png`;

        // Capture canvas
        html2canvas(canvas, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
            useCORS: true
        }).then(function (exportCanvas) {
            console.log('[ExportSimple] Canvas captured, generating PNG...');

            // Convert to PNG and download
            exportCanvas.toBlob(function (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                console.log('[ExportSimple] PNG exported:', filename);
                alert(`Flowchart berhasil diekspor sebagai ${filename}`);
            }, 'image/png');
        }).catch(function (err) {
            console.error('[ExportSimple] Error capturing canvas:', err);
            alert('Gagal mengekspor flowchart: ' + err.message);
        });
    }

    // Public API
    return {
        exportAsJSON: exportAsJSON,
        exportAsPNG: exportAsPNG
    };
})();

// Load html2canvas from CDN if not already loaded
(function () {
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.async = true;
        document.head.appendChild(script);
        console.log('[ExportSimple] Loading html2canvas from CDN...');
    }
})();
