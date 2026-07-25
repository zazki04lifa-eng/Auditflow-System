/**
 * AuditFlow - Flowchart Preparation Page (Step 3)
 * Handles orientation and output type selection, and triggers flowchart generation
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // State Management
    // ============================================

    let currentProject = AuditFlow.getCurrentProject();
    let selectedOrientation = 'vertical';
    let selectedOutput = 'flowchart-wcgw';
    let autoSaveTimer = null;

    // ============================================
    // DOM Elements
    // ============================================

    const elements = {
        // Summary
        summaryContent: document.getElementById('summary-content'),
        summaryText: document.querySelector('.summary-text'),
        wordCount: document.getElementById('word-count'),
        charCount: document.getElementById('char-count'),
        editUnderstandingBtn: document.getElementById('edit-understanding-btn'),

        // Option Cards - Orientation
        orientationVertical: document.getElementById('orientation-vertical'),
        orientationHorizontal: document.getElementById('orientation-horizontal'),

        // Option Cards - Output
        outputFlowchartOnly: document.getElementById('output-flowchart-only'),
        outputFlowchartWcgw: document.getElementById('output-flowchart-wcgw'),

        // Actions
        saveDraftBtn: document.getElementById('save-draft-btn'),
        backBtn: document.getElementById('back-btn'),
        generateBtn: document.getElementById('generate-btn'),
        autoSaveIndicator: document.getElementById('auto-save-indicator'),

        // Modals
        generatingModal: document.getElementById('generating-modal'),
        generatingStatus: document.getElementById('generating-status'),
        progressFill: document.getElementById('progress-fill'),
        successModal: document.getElementById('success-modal'),
        modalViewEditor: document.getElementById('modal-view-editor'),
        modalContinue: document.getElementById('modal-continue')
    };

    // ============================================
    // Load and Display Summary
    // ============================================

    function loadSummary() {
        if (currentProject && currentProject.understandingBusiness) {
            const description = currentProject.understandingBusiness.description || '';
            elements.summaryText.textContent = description.substring(0, 200) + (description.length > 200 ? '...' : '');
            elements.wordCount.textContent = countWords(description) + ' kata';
            elements.charCount.textContent = description.length + ' karakter';
        } else {
            // Show placeholder
            elements.summaryText.textContent = 'Belum ada deskripsi proses bisnis. Silakan kembali ke Step 2 untuk menambahkan understanding business.';
            elements.wordCount.textContent = '0 kata';
            elements.charCount.textContent = '0 karakter';
        }
    }

    function countWords(text) {
        if (!text || !text.trim()) return 0;
        return text.trim().split(/\s+/).length;
    }

    // ============================================
    // Option Selection
    // ============================================

    function selectOption(card, group) {
        // Remove selection from all cards in the group
        const allCards = card.parentElement.querySelectorAll('.option-card');
        allCards.forEach(c => c.classList.remove('selected'));

        // Add selection to clicked card
        card.classList.add('selected');

        // Update state
        if (group === 'orientation') {
            selectedOrientation = card.dataset.value;
        } else if (group === 'output') {
            selectedOutput = card.dataset.value;
        }

        // Auto save
        scheduleAutoSave();
    }

    // Orientation selection
    elements.orientationVertical.addEventListener('click', function () {
        selectOption(this, 'orientation');
    });

    elements.orientationHorizontal.addEventListener('click', function () {
        selectOption(this, 'orientation');
    });

    // Output selection
    elements.outputFlowchartOnly.addEventListener('click', function () {
        selectOption(this, 'output');
    });

    elements.outputFlowchartWcgw.addEventListener('click', function () {
        selectOption(this, 'output');
    });

    // Set default selections
    elements.orientationVertical.classList.add('selected');
    elements.outputFlowchartWcgw.classList.add('selected');

    // ============================================
    // Auto Save
    // ============================================

    function scheduleAutoSave() {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            saveDraft(true);
        }, 2000);
    }

    function saveDraft(showIndicator = false) {
        if (!currentProject) {
            currentProject = AuditFlow.createProject();
        }

        // Save flowchart preparation settings
        currentProject.flowchartPrep = {
            orientation: selectedOrientation,
            outputType: selectedOutput,
            lastModified: new Date().toISOString()
        };

        AuditFlow.saveProject(currentProject);

        if (showIndicator) {
            elements.autoSaveIndicator.classList.remove('hidden');
            setTimeout(() => {
                elements.autoSaveIndicator.classList.add('hidden');
            }, 2000);
        }
    }

    // ============================================
    // Navigation
    // ============================================

    // Edit Understanding Business button
    elements.editUnderstandingBtn.addEventListener('click', () => {
        window.location.href = 'understanding-business.html';
    });

    // Save Draft button
    elements.saveDraftBtn.addEventListener('click', () => {
        saveDraft(false);
        alert('Draft berhasil disimpan!');
    });

    // Back button
    elements.backBtn.addEventListener('click', () => {
        window.location.href = 'understanding-business.html';
    });

    // Generate button
    console.log('[FlowchartPrep] Setting up Generate button listener');
    elements.generateBtn.addEventListener('click', () => {
        console.log('[FlowchartPrep] Generate button clicked');

        // Validate that understanding business exists
        if (!currentProject || !currentProject.understandingBusiness || !currentProject.understandingBusiness.description) {
            console.log('[FlowchartPrep] Validation failed - no understanding business');
            alert('Understanding Business belum diisi. Silakan lengkapi Step 2 terlebih dahulu.');
            return;
        }

        console.log('[FlowchartPrep] Validation passed, saving draft...');
        // Save current settings
        saveDraft(false);

        console.log('[FlowchartPrep] Showing generating modal...');
        // Show generating modal
        showGeneratingModal();
    });

    // ============================================
    // Generate Flowchart Simulation
    // ============================================

    function showGeneratingModal() {
        elements.generatingModal.classList.remove('hidden');

        // Simulate generation process with status updates
        const statuses = [
            { text: 'Menganalisis proses bisnis...', progress: 10 },
            { text: 'Mengidentifikasi actor dan aktivitas...', progress: 30 },
            { text: 'Menyusun swimlane structure...', progress: 50 },
            { text: 'Membuat connector dan flow...', progress: 70 },
            { text: 'Mendeteksi WCGW...', progress: 85 },
            { text: 'Menyiapkan flowchart...', progress: 95 },
            { text: 'Selesai!', progress: 100 }
        ];

        let step = 0;
        const interval = setInterval(() => {
            if (step < statuses.length) {
                elements.generatingStatus.textContent = statuses[step].text;
                elements.progressFill.style.width = statuses[step].progress + '%';
                step++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    elements.generatingModal.classList.add('hidden');
                    showSuccessModal();
                }, 500);
            }
        }, 800);
    }

    function showSuccessModal() {
        // Generate actual flowchart data using FlowchartGenerator
        let flowchartData = { nodes: [], connectors: [], swimlanes: [] };
        let generationStats = null;

        try {
            if (currentProject && currentProject.understandingBusiness && currentProject.understandingBusiness.description) {
                const description = currentProject.understandingBusiness.description;
                console.log('[FlowchartPrep] Generating flowchart from description:', description.substring(0, 100) + '...');

                const result = FlowchartGenerator.generate(description);
                if (result && result.success && result.flowchart) {
                    flowchartData = result.flowchart;
                    generationStats = result.stats;
                    console.log('[FlowchartPrep] Flowchart generated successfully:', generationStats);
                } else {
                    console.warn('[FlowchartPrep] Flowchart generation returned no data');
                }
            }
        } catch (e) {
            console.error('[FlowchartPrep] Error generating flowchart:', e);
        }

        // Save flowchart settings to project
        if (currentProject) {
            currentProject.flowchart = {
                orientation: selectedOrientation,
                outputType: selectedOutput,
                status: 'generated',
                generatedAt: new Date().toISOString(),
                // Actual flowchart data from generator
                nodes: flowchartData.nodes || [],
                connectors: flowchartData.connectors || [],
                swimlanes: flowchartData.swimlanes || [],
                // Store stats for reference
                stats: generationStats
            };
            AuditFlow.saveProject(currentProject);
            console.log('[FlowchartPrep] Project saved with flowchart data:', currentProject.flowchart.nodes.length, 'nodes');

            // Audit Trail: Record flowchart.generate (Sprint 5)
            if (typeof AuditTrail !== 'undefined') {
                try {
                    const user = AuditFlow.getUser();
                    AuditTrail.record('flowchart.generate', {
                        userId: user ? user.id : null,
                        projectId: currentProject.id,
                        orientation: selectedOrientation,
                        outputType: selectedOutput,
                        description: currentProject.understandingBusiness?.description || '',
                        wordCount: countWords(currentProject.understandingBusiness?.description || ''),
                        source: 'rule-engine'
                    });
                } catch (e) {
                    console.warn('AuditTrail flowchart.generate failed:', e);
                }
            }
        }

        elements.successModal.classList.remove('hidden');
    }

    elements.modalViewEditor.addEventListener('click', () => {
        elements.successModal.classList.add('hidden');
    });

    elements.modalContinue.addEventListener('click', () => {
        // Navigate to flowchart editor - project is already saved to localStorage
        // AuditFlow.getCurrentProject() will load it on the next page
        console.log('[FlowchartPrep] Navigating to flowchart-editor.html');
        console.log('[FlowchartPrep] Current project before navigation:', currentProject ? {
            id: currentProject.id,
            hasProjectInfo: !!currentProject.projectInfo,
            hasFlowchart: !!currentProject.flowchart
        } : 'null');
        window.location.href = 'flowchart-editor.html';
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && overlay.id !== 'generating-modal') {
                overlay.classList.add('hidden');
            }
        });
    });

    // ============================================
    // Initialization
    // ============================================

    function init() {
        loadSummary();

        // Load saved preferences if available
        if (currentProject && currentProject.flowchartPrep) {
            const prep = currentProject.flowchartPrep;

            // Select saved orientation
            if (prep.orientation === 'horizontal') {
                elements.orientationHorizontal.classList.add('selected');
                elements.orientationVertical.classList.remove('selected');
                selectedOrientation = 'horizontal';
            }

            // Select saved output
            if (prep.outputType === 'flowchart-only') {
                elements.outputFlowchartOnly.classList.add('selected');
                elements.outputFlowchartWcgw.classList.remove('selected');
                selectedOutput = 'flowchart-only';
            }
        }
    }

    init();
});
