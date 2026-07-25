/**
 * AuditFlow - Flowchart Editor (Main Entry Point)
 * Orchestrates state, rendering, interactions, and undo/redo modules
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // Initialize Modules
    // ============================================

    console.log('[FlowchartEditor] Initializing...');
    const currentProject = AuditFlow.getCurrentProject();
    console.log('[FlowchartEditor] Current project:', currentProject ? {
        id: currentProject.id,
        hasProjectInfo: !!currentProject.projectInfo,
        hasFlowchart: !!currentProject.flowchart,
        flowchartNodes: currentProject.flowchart?.nodes?.length || 0
    } : 'null');

    let zoom = 100;
    let nodeCounter = 0;

    // Initialize state
    FlowchartState.init(currentProject);
    FlowchartUndoRedo.init();
    FlowchartInteractions.init({
        onNodeClick: (node) => showPropertyPanel(node),
        onNodeDelete: () => updateCounts(),
        onNodeUpdate: () => updateCounts()
    });

    // ============================================
    // DOM Elements
    // ============================================

    const elements = {
        // Toolbar
        projectName: document.getElementById('project-name'),
        zoomOut: document.getElementById('zoom-out'),
        zoomIn: document.getElementById('zoom-in'),
        zoomFit: document.getElementById('zoom-fit'),
        zoomLevel: document.getElementById('zoom-level'),
        undoBtn: document.getElementById('undo-btn'),
        redoBtn: document.getElementById('redo-btn'),
        saveBtn: document.getElementById('save-btn'),
        nextStepBtn: document.getElementById('next-step-btn'),
        runDetectionBtn: document.getElementById('run-detection-btn'),
        generateControlsBtn: document.getElementById('generate-controls-btn'),
        exportBtn: document.getElementById('export-btn'),

        // Canvas
        canvasContainer: document.getElementById('canvas-container'),
        canvasWrapper: document.getElementById('canvas-wrapper'),
        canvas: document.getElementById('flowchart-canvas'),
        swimlanesGroup: document.getElementById('swimlanes-group'),
        connectorsGroup: document.getElementById('connectors-group'),
        nodesGroup: document.getElementById('nodes-group'),

        // Shape Library
        shapeItems: document.querySelectorAll('.shape-item'),
        shapeSearch: document.getElementById('shape-search'),

        // Property Panel
        propertyPanel: document.getElementById('property-panel'),
        closePanel: document.getElementById('close-panel'),
        nodeType: document.getElementById('node-type'),
        nodeText: document.getElementById('node-text'),
        nodeSwimlane: document.getElementById('node-swimlane'),
        deleteNode: document.getElementById('delete-node'),

        // Status Bar
        nodeCount: document.getElementById('node-count'),
        swimlaneCount: document.getElementById('swimlane-count'),
        cursorPosition: document.getElementById('cursor-position'),
        saveStatus: document.getElementById('save-status'),

        // Context Menu
        contextMenu: document.getElementById('context-menu'),

        // Control Panel (Phase 6A)
        controlPanel: document.getElementById('control-panel'),
        closeControlPanel: document.getElementById('close-control-panel'),
        controlCount: document.getElementById('control-count'),
        controlList: document.getElementById('control-list'),
        controlEmpty: document.getElementById('control-empty'),

        // Effectiveness Panel (Phase 6B)
        effectivenessBtn: document.getElementById('effectiveness-btn'),
        effectivenessPanel: document.getElementById('effectiveness-panel'),
        closeEffectivenessPanel: document.getElementById('close-effectiveness-panel'),
        effectivenessCount: document.getElementById('effectiveness-count'),
        effectivenessEmpty: document.getElementById('effectiveness-empty'),
        effectivenessStats: document.getElementById('effectiveness-stats'),
        effectivenessList: document.getElementById('effectiveness-list'),
        coverageSection: document.getElementById('coverage-section'),
        coveragePercent: document.getElementById('coverage-percent'),
        coverageFill: document.getElementById('coverage-fill'),
        coverageDetections: document.getElementById('coverage-detections'),
        statHigh: document.getElementById('stat-high'),
        statMedium: document.getElementById('stat-medium'),
        statLow: document.getElementById('stat-low'),

        // Residual Risk Panel (Phase 6C)
        residualRiskBtn: document.getElementById('residual-risk-btn'),
        residualRiskPanel: document.getElementById('residual-risk-panel'),
        closeResidualRiskPanel: document.getElementById('close-residual-risk-panel'),
        residualRiskCount: document.getElementById('residual-risk-count'),
        residualRiskEmpty: document.getElementById('residual-risk-empty'),
        residualRiskSummary: document.getElementById('residual-risk-summary'),
        residualRiskList: document.getElementById('residual-risk-list'),
        riskDistribution: document.getElementById('risk-distribution'),
        statusSummary: document.getElementById('status-summary'),
        avgResidualScore: document.getElementById('avg-residual-score'),
        avgRiskReduction: document.getElementById('avg-risk-reduction'),
        highRiskFill: document.getElementById('high-risk-fill'),
        highRiskCount: document.getElementById('high-risk-count'),
        mediumRiskFill: document.getElementById('medium-risk-fill'),
        mediumRiskCount: document.getElementById('medium-risk-count'),
        lowRiskFill: document.getElementById('low-risk-fill'),
        lowRiskCount: document.getElementById('low-risk-count'),
        acceptableCount: document.getElementById('acceptable-count'),
        needControlCount: document.getElementById('need-control-count'),

        // Audit Recommendation Panel (Phase 6D)
        auditRecommendationBtn: document.getElementById('audit-recommendation-btn'),
        auditRecommendationPanel: document.getElementById('audit-recommendation-panel'),
        closeAuditRecommendationPanel: document.getElementById('close-audit-recommendation-panel'),
        auditRecommendationCount: document.getElementById('audit-recommendation-count'),
        auditRecommendationEmpty: document.getElementById('audit-recommendation-empty'),
        auditRecSummary: document.getElementById('audit-rec-summary'),
        totalRecommendations: document.getElementById('total-recommendations'),
        highPriorityCount: document.getElementById('high-priority-count'),
        priorityDistribution: document.getElementById('priority-distribution'),
        highPriorityFill: document.getElementById('high-priority-fill'),
        highPriorityFillCount: document.getElementById('high-priority-fill-count'),
        mediumPriorityFill: document.getElementById('medium-priority-fill'),
        mediumPriorityFillCount: document.getElementById('medium-priority-fill-count'),
        lowPriorityFill: document.getElementById('low-priority-fill'),
        lowPriorityFillCount: document.getElementById('low-priority-fill-count'),
        testTypeSummary: document.getElementById('test-type-summary'),
        substantiveCount: document.getElementById('substantive-count'),
        tocCount: document.getElementById('toc-count'),
        analyticalCount: document.getElementById('analytical-count'),
        auditRecommendationList: document.getElementById('audit-recommendation-list')
    };

    // ============================================
    // Initialize
    // ============================================

    function init() {
        // Load project name
        if (currentProject && currentProject.projectInfo) {
            elements.projectName.textContent = currentProject.projectInfo.projectName || 'Untitled Project';
        }

        // Create sample flowchart if empty
        if (FlowchartState.getFlowchartData().nodes.length === 0) {
            FlowchartState.createSampleFlowchart();
        }

        // Render everything
        renderAll();
        updateCounts();

        // Setup event listeners
        setupEventListeners();
    }

    // ============================================
    // Rendering
    // ============================================

    function renderAll() {
        const flowchartData = FlowchartState.getFlowchartData();
        FlowchartRenderer.renderSwimlanes(elements.swimlanesGroup, flowchartData.swimlanes);
        FlowchartRenderer.renderNodes(elements.nodesGroup, flowchartData.nodes);
        FlowchartRenderer.renderConnectors(elements.connectorsGroup, flowchartData.connectors, flowchartData.nodes);
    }

    function updateCounts() {
        const flowchartData = FlowchartState.getFlowchartData();
        elements.nodeCount.textContent = flowchartData.nodes.length;
        elements.swimlaneCount.textContent = flowchartData.swimlanes.length;
    }

    // ============================================
    // Event Listeners
    // ============================================

    function setupEventListeners() {
        // Zoom controls
        elements.zoomIn.addEventListener('click', () => setZoom(zoom + 25));
        elements.zoomOut.addEventListener('click', () => setZoom(zoom - 25));
        elements.zoomFit.addEventListener('click', fitToScreen);

        // Undo/Redo
        elements.undoBtn.addEventListener('click', undo);
        elements.redoBtn.addEventListener('click', redo);

        // Save
        elements.saveBtn.addEventListener('click', saveFlowchart);

        // Next step - Navigate to Audit Summary
        elements.nextStepBtn.addEventListener('click', () => {
            console.log('[FlowchartEditor] Next step button clicked - navigating to audit-summary.html');
            window.location.href = 'audit-summary.html';
        });

        // Run detection
        console.log('[FlowchartEditor] Setting up WCGW Detection button listener');
        elements.runDetectionBtn.addEventListener('click', () => {
            console.log('[FlowchartEditor] WCGW Detection button clicked');
            if (typeof WCGWDetection !== 'undefined') {
                console.log('[FlowchartEditor] Calling WCGWDetection.runDetection()');
                WCGWDetection.runDetection();
            } else {
                console.error('[FlowchartEditor] WCGWDetection module not defined!');
            }
        });

        // Export (WCGW Report)
        console.log('[FlowchartEditor] Setting up Export button listener');
        elements.exportBtn.addEventListener('click', () => {
            console.log('[FlowchartEditor] Export button clicked');
            if (typeof WCGWDetection !== 'undefined') {
                console.log('[FlowchartEditor] Calling WCGWDetection.showExportModal()');
                WCGWDetection.showExportModal();
            } else {
                console.error('[FlowchartEditor] WCGWDetection module not available');
            }
        });

        // Export Simple (Flowchart PNG/JSON)
        console.log('[FlowchartEditor] Setting up Export Simple button listener');
        if (typeof ExportSimple !== 'undefined') {
            const exportSimpleBtn = document.getElementById('export-simple-btn');
            if (exportSimpleBtn) {
                exportSimpleBtn.addEventListener('click', () => {
                    console.log('[FlowchartEditor] Export Simple button clicked');
                    // Show simple menu
                    const choice = confirm('Export flowchart sebagai:\n\nOK = PNG (gambar)\nCancel = JSON (data)');
                    if (choice) {
                        ExportSimple.exportAsPNG();
                    } else {
                        ExportSimple.exportAsJSON();
                    }
                });
                console.log('[FlowchartEditor] Export Simple button listener attached');
            }
        } else {
            console.warn('[FlowchartEditor] ExportSimple module not available');
        }

        // Generate Control Recommendations (Phase 6A)
        elements.generateControlsBtn.addEventListener('click', () => {
            generateControlRecommendations();
        });

        // Close Control Panel
        elements.closeControlPanel.addEventListener('click', () => {
            elements.controlPanel.classList.add('hidden');
        });

        // Effectiveness Assessment (Phase 6B)
        elements.effectivenessBtn.addEventListener('click', () => {
            showEffectivenessPanel();
        });

        // Close Effectiveness Panel
        elements.closeEffectivenessPanel.addEventListener('click', () => {
            elements.effectivenessPanel.classList.add('hidden');
        });

        // Residual Risk Assessment (Phase 6C)
        elements.residualRiskBtn.addEventListener('click', () => {
            showResidualRiskPanel();
        });

        // Close Residual Risk Panel
        elements.closeResidualRiskPanel.addEventListener('click', () => {
            elements.residualRiskPanel.classList.add('hidden');
        });

        // Audit Recommendation (Phase 6D)
        elements.auditRecommendationBtn.addEventListener('click', () => {
            showAuditRecommendationPanel();
        });

        // Close Audit Recommendation Panel
        elements.closeAuditRecommendationPanel.addEventListener('click', () => {
            elements.auditRecommendationPanel.classList.add('hidden');
        });

        // Property panel
        elements.closePanel.addEventListener('click', () => {
            elements.propertyPanel.classList.add('hidden');
            FlowchartInteractions.clearSelection();
        });

        elements.deleteNode.addEventListener('click', () => {
            if (FlowchartInteractions.deleteSelectedNode(FlowchartState)) {
                elements.propertyPanel.classList.add('hidden');
                renderAll();
                FlowchartUndoRedo.saveState(FlowchartState.getFlowchartData());
            }
        });

        // Node type change
        elements.nodeType.addEventListener('change', (e) => {
            FlowchartInteractions.updateSelectedNode({ type: e.target.value }, FlowchartState);
            renderAll();
            FlowchartUndoRedo.saveState(FlowchartState.getFlowchartData());
        });

        // Node text change
        elements.nodeText.addEventListener('input', (e) => {
            FlowchartInteractions.updateSelectedNode({ text: e.target.value }, FlowchartState);
            renderAll();
        });

        // Node text change (save on blur)
        elements.nodeText.addEventListener('blur', () => {
            FlowchartUndoRedo.saveState(FlowchartState.getFlowchartData());
        });

        // Shape library - drag to add
        elements.shapeItems.forEach(item => {
            item.addEventListener('click', () => {
                const shape = item.dataset.shape;
                const canvasRect = elements.canvas.getBoundingClientRect();
                const x = (canvasRect.width / 2 - 80) / (zoom / 100);
                const y = (canvasRect.height / 2 - 30) / (zoom / 100);

                const newNode = FlowchartInteractions.addNodeAtPosition(
                    shape, x, y, FlowchartState, FlowchartRenderer
                );

                renderAll();
                updateCounts();
                FlowchartUndoRedo.saveState(FlowchartState.getFlowchartData());

                // Select the new node
                const nodeGroup = elements.nodesGroup.querySelector(`[data-node-id="${newNode.id}"]`);
                if (nodeGroup) {
                    FlowchartInteractions.selectNode(newNode, nodeGroup);
                    showPropertyPanel(newNode);
                }
            });
        });

        // Context menu actions
        document.querySelectorAll('.context-menu-item').forEach(menuItem => {
            menuItem.addEventListener('click', () => {
                const action = menuItem.dataset.action;
                handleContextAction(action);
                FlowchartInteractions.hideContextMenu(elements.contextMenu);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            }
            if (e.key === 'Delete' && FlowchartInteractions.getSelectedNode()) {
                FlowchartInteractions.deleteSelectedNode(FlowchartState);
                renderAll();
                updateCounts();
                elements.propertyPanel.classList.add('hidden');
                FlowchartUndoRedo.saveState(FlowchartState.getFlowchartData());
            }
        });

        // Canvas cursor position
        elements.canvas.addEventListener('mousemove', (e) => {
            const pt = FlowchartInteractions.getMousePosition(e, elements.canvas);
            elements.cursorPosition.textContent = `X: ${Math.round(pt.x)} Y: ${Math.round(pt.y)}`;
        });
    }

    // ============================================
    // Actions
    // ============================================

    function setZoom(newZoom) {
        zoom = Math.max(25, Math.min(400, newZoom));
        elements.canvasWrapper.style.transform = `scale(${zoom / 100})`;
        elements.zoomLevel.textContent = `${zoom}%`;
    }

    function fitToScreen() {
        setZoom(100);
    }

    function undo() {
        const previousState = FlowchartUndoRedo.undo(FlowchartState.getFlowchartData());
        if (previousState) {
            FlowchartState.setFlowchartData(previousState);
            renderAll();
            updateCounts();
            updateUndoRedoButtons();
        }
    }

    function redo() {
        const nextState = FlowchartUndoRedo.redo(FlowchartState.getFlowchartData());
        if (nextState) {
            FlowchartState.setFlowchartData(nextState);
            renderAll();
            updateCounts();
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        elements.undoBtn.disabled = !FlowchartUndoRedo.canUndo();
        elements.redoBtn.disabled = !FlowchartUndoRedo.canRedo();
    }

    function saveFlowchart() {
        FlowchartState.saveToProject();
        elements.saveStatus.textContent = 'Saved';
        setTimeout(() => {
            elements.saveStatus.textContent = '';
        }, 2000);
    }

    // ============================================
    // Control Recommendations (Phase 6A)
    // ============================================

    function generateControlRecommendations() {
        // Check if WCGW Detection has been run
        if (typeof WCGWDetection === 'undefined') {
            alert('WCGW Detection module not available. Please run detection first.');
            return;
        }

        const detections = WCGWDetection.getDetections();
        if (!detections || detections.length === 0) {
            alert('No WCGW detections found. Please run WCGW Detection first.');
            return;
        }

        // Initialize Control Recommender
        if (typeof ControlRecommender === 'undefined') {
            alert('Control Recommender module not available.');
            return;
        }

        ControlRecommender.init(currentProject);
        ControlRecommender.clearRecommendations(); // Clear previous recommendations to prevent duplicates
        const recommendations = ControlRecommender.recommendControls(detections);

        // Show control panel
        elements.controlPanel.classList.remove('hidden');

        // Render recommendations
        renderControlRecommendations(recommendations);

        console.log('[FlowchartEditor] Generated', recommendations.length, 'control recommendations');

        // Record Audit Trail event
        if (typeof AuditTrail !== 'undefined' && currentProject) {
            AuditTrail.record('control.recommend.generated', {
                projectId: currentProject.id,
                detectionCount: detections.length,
                recommendationCount: recommendations.length,
                timestamp: new Date().toISOString()
            });
        }
    }

    function renderControlRecommendations(recommendations) {
        // Update count
        elements.controlCount.textContent = recommendations.length;

        // Clear list
        elements.controlList.innerHTML = '';

        if (!recommendations || recommendations.length === 0) {
            elements.controlEmpty.style.display = 'flex';
            elements.controlList.style.display = 'none';
            return;
        }

        elements.controlEmpty.style.display = 'none';
        elements.controlList.style.display = 'flex';

        // Render each recommendation
        recommendations.forEach(rec => {
            const controlItem = document.createElement('div');
            controlItem.className = 'control-item';
            controlItem.innerHTML = `
                <div class="control-item-header">
                    <div class="control-item-rank">#${rec.rank}</div>
                    <div class="control-item-info">
                        <h4 class="control-item-name">${rec.name}</h4>
                        <div class="control-item-category">
                            <span class="category-dot ${rec.category.toLowerCase()}"></span>
                            ${rec.category}
                        </div>
                    </div>
                </div>
                <div class="control-item-stats">
                    <div class="control-stat">
                        <span>Score:</span>
                        <span class="control-stat-value">${rec.score}</span>
                    </div>
                    <div class="control-stat">
                        <span>Confidence:</span>
                        <span class="control-stat-value">${rec.confidence}%</span>
                    </div>
                    <div class="control-stat">
                        <span>Coverage:</span>
                        <span class="control-stat-value">${rec.coverage}%</span>
                    </div>
                </div>
                <div class="control-score-bar">
                    <div class="control-score-bar-label">
                        <span>Match Score</span>
                        <span>${rec.score}/100</span>
                    </div>
                    <div class="control-score-bar-track">
                        <div class="control-score-bar-fill" style="width: ${rec.score}%"></div>
                    </div>
                </div>
                ${rec.reasons && rec.reasons.length > 0 ? `
                <div class="control-item-reasons">
                    <div class="control-item-reasons-title">Why Recommended:</div>
                    <ul>
                        ${rec.reasons.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${rec.matchedAssertions && rec.matchedAssertions.length > 0 ? `
                <div class="control-tags">
                    ${rec.matchedAssertions.map(assertion =>
                `<span class="control-tag assertion">${assertion}</span>`
            ).join('')}
                    ${rec.matchedRisks.map(risk =>
                `<span class="control-tag risk ${risk}">${risk}</span>`
            ).join('')}
                </div>
                ` : ''}
                ${rec.whyNot && rec.whyNot.length > 0 ? `
                <div class="control-item-why-not">
                    <div class="control-item-why-not-title">Why Not Higher Rank:</div>
                    <ul>
                        ${rec.whyNot.map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            `;
            elements.controlList.appendChild(controlItem);
        });
    }

    function showPropertyPanel(node) {
        elements.propertyPanel.classList.remove('hidden');
        elements.nodeType.value = node.type;
        elements.nodeText.value = node.text;
    }

    // ============================================
    // Effectiveness Assessment (Phase 6B)
    // ============================================

    function showEffectivenessPanel() {
        // Check if Control Recommender has been run
        if (typeof ControlRecommender === 'undefined') {
            alert('Control Recommender module not available.');
            return;
        }

        const recommendations = ControlRecommender.getRecommendations();
        if (!recommendations || recommendations.length === 0) {
            alert('No control recommendations found. Please run "Recommend Controls" first.');
            return;
        }

        // Initialize Effectiveness Assessor
        if (typeof EffectivenessAssessor === 'undefined') {
            alert('Effectiveness Assessor module not available.');
            return;
        }

        // Initialize with project context
        EffectivenessAssessor.init(currentProject);

        // Show effectiveness panel
        elements.effectivenessPanel.classList.remove('hidden');

        // Render control selection list (controls that can be assessed)
        renderEffectivenessPanel(recommendations);

        console.log('[FlowchartEditor] Opened effectiveness assessment panel');
    }

    function renderEffectivenessPanel(recommendations) {
        // Get existing assessments
        const assessments = EffectivenessAssessor.getAssessments();
        const assessedControlIds = assessments.map(function (a) { return a.controlId; });

        // Filter to only show top controls (not whyNot controls)
        const assessableControls = recommendations.filter(function (r) { return r.score > 0; });

        // Update count
        elements.effectivenessCount.textContent = assessments.length;

        // Clear list
        elements.effectivenessList.innerHTML = '';

        if (assessableControls.length === 0) {
            elements.effectivenessEmpty.style.display = 'flex';
            elements.effectivenessStats.classList.add('hidden');
            elements.coverageSection.classList.add('hidden');
            return;
        }

        elements.effectivenessEmpty.style.display = 'none';

        // Show stats if there are assessments
        if (assessments.length > 0) {
            elements.effectivenessStats.classList.remove('hidden');
            updateEffectivenessStats(assessments);
        } else {
            elements.effectivenessStats.classList.add('hidden');
            elements.coverageSection.classList.add('hidden');
        }

        // Render each control that can be assessed
        assessableControls.forEach(function (control) {
            const isAssessed = assessedControlIds.includes(control.controlId);
            const existingAssessment = assessments.find(function (a) { return a.controlId === control.controlId; });

            const controlItem = document.createElement('div');
            controlItem.className = 'effectiveness-item ' + (isAssessed ? 'assessed' : '');

            let itemContent = '';
            itemContent += '<div class="effectiveness-item-header">';
            itemContent += '<div class="effectiveness-item-rank">#' + control.rank + '</div>';
            itemContent += '<div class="effectiveness-item-info">';
            itemContent += '<h4 class="effectiveness-item-name">' + control.name + '</h4>';
            itemContent += '<div class="effectiveness-item-category">';
            itemContent += '<span class="category-dot ' + control.category.toLowerCase() + '"></span>';
            itemContent += control.category;
            itemContent += '</div></div>';

            if (isAssessed) {
                itemContent += '<div class="effectiveness-badge ' + existingAssessment.effectivenessCategory + '">';
                itemContent += existingAssessment.effectivenessLabel;
                itemContent += '</div>';
            } else {
                itemContent += '<span class="not-assessed-badge">Not Assessed</span>';
            }

            itemContent += '</div>';
            itemContent += '<div class="effectiveness-item-score">';
            itemContent += '<span>Recommendation Score:</span>';
            itemContent += '<span class="score-value">' + control.score + '/100</span>';
            itemContent += '</div>';

            if (isAssessed) {
                itemContent += '<div class="effectiveness-assessed-details">';
                itemContent += '<div class="assessed-score">';
                itemContent += '<span>Effectiveness:</span>';
                itemContent += '<span class="effectiveness-value">' + existingAssessment.effectivenessScore + '</span>';
                itemContent += '</div>';

                if (existingAssessment.rationale) {
                    itemContent += '<div class="assessed-rationale">';
                    itemContent += '<span>Rationale:</span>';
                    itemContent += '<p>' + existingAssessment.rationale + '</p>';
                    itemContent += '</div>';
                }

                itemContent += '<button class="btn btn-sm btn-secondary reassess-btn" data-control-id="' + control.controlId + '">';
                itemContent += 'Re-assess';
                itemContent += '</button></div>';
            } else {
                itemContent += '<div class="effectiveness-input-section">';
                itemContent += '<div class="effectiveness-slider-container">';
                itemContent += '<label>Effectiveness Score (0-100):</label>';
                itemContent += '<input type="range" class="effectiveness-slider" ';
                itemContent += 'min="0" max="100" value="50" ';
                itemContent += 'data-control-id="' + control.controlId + '" ';
                itemContent += 'id="slider-' + control.controlId + '">';
                itemContent += '<span class="slider-value" id="slider-value-' + control.controlId + '">50</span>';
                itemContent += '</div>';
                itemContent += '<div class="effectiveness-category-preview" id="category-preview-' + control.controlId + '">';
                itemContent += 'Category: <span class="category-medium">Medium</span>';
                itemContent += '</div>';
                itemContent += '<textarea class="effectiveness-rationale" ';
                itemContent += 'placeholder="Enter rationale for effectiveness score..." ';
                itemContent += 'data-control-id="' + control.controlId + '" ';
                itemContent += 'rows="2"></textarea>';
                itemContent += '<button class="btn btn-primary btn-sm assess-btn" data-control-id="' + control.controlId + '">';
                itemContent += 'Assess Control';
                itemContent += '</button></div>';
            }

            controlItem.innerHTML = itemContent;
            elements.effectivenessList.appendChild(controlItem);
        });

        // Setup event listeners for sliders
        document.querySelectorAll('.effectiveness-slider').forEach(function (slider) {
            slider.addEventListener('input', function (e) {
                const value = e.target.value;
                const controlId = e.target.dataset.controlId;
                document.getElementById('slider-value-' + controlId).textContent = value;

                // Update category preview
                const category = EffectivenessAssessor.getEffectivenessCategory(parseInt(value));
                const label = EffectivenessAssessor.getEffectivenessLabel(category);
                const preview = document.getElementById('category-preview-' + controlId);
                preview.innerHTML = 'Category: <span class="category-' + category + '">' + label + '</span>';
            });
        });

        // Setup event listeners for assess buttons
        document.querySelectorAll('.assess-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                const controlId = e.target.dataset.controlId;
                assessControlAction(controlId, recommendations);
            });
        });

        // Setup event listeners for reassess buttons
        document.querySelectorAll('.reassess-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                const controlId = e.target.dataset.controlId;
                // Remove existing assessment
                const assessmentsList = EffectivenessAssessor.getAssessments();
                const assessmentIndex = assessmentsList.findIndex(function (a) { return a.controlId === controlId; });
                if (assessmentIndex > -1) {
                    assessmentsList.splice(assessmentIndex, 1);
                    // Re-render
                    renderEffectivenessPanel(recommendations);
                }
            });
        });
    }

    function assessControlAction(controlId, recommendations) {
        const slider = document.getElementById('slider-' + controlId);
        const rationaleEl = document.querySelector('textarea[data-control-id="' + controlId + '"]');

        if (!slider) return;

        const score = parseInt(slider.value);
        const rationale = rationaleEl ? rationaleEl.value : '';

        // Find the control
        const control = recommendations.find(function (c) { return c.controlId === controlId; });
        if (!control) {
            alert('Control not found.');
            return;
        }

        // Assess the control
        const assessment = EffectivenessAssessor.assessControl(control, score, rationale);

        if (assessment) {
            // Record audit trail event
            if (typeof AuditTrail !== 'undefined' && currentProject) {
                AuditTrail.record('control.effectiveness.assessed', {
                    projectId: currentProject.id,
                    controlId: control.controlId,
                    controlName: control.name,
                    effectivenessScore: score,
                    effectivenessCategory: assessment.effectivenessCategory,
                    rationale: rationale,
                    timestamp: new Date().toISOString()
                });
            }

            // Update coverage if detections exist
            if (typeof WCGWDetection !== 'undefined') {
                const detections = WCGWDetection.getDetections();
                if (detections && detections.length > 0) {
                    updateCoverageDisplay(detections);
                }
            }

            // Re-render panel
            renderEffectivenessPanel(recommendations);

            console.log('[FlowchartEditor] Assessed control:', control.name, 'Score:', score);
        }
    }

    function updateEffectivenessStats(assessments) {
        const highCount = assessments.filter(function (a) { return a.effectivenessCategory === 'high'; }).length;
        const mediumCount = assessments.filter(function (a) { return a.effectivenessCategory === 'medium'; }).length;
        const lowCount = assessments.filter(function (a) { return a.effectivenessCategory === 'low'; }).length;

        elements.statHigh.textContent = highCount;
        elements.statMedium.textContent = mediumCount;
        elements.statLow.textContent = lowCount;
    }

    function updateCoverageDisplay(detections) {
        const coverage = EffectivenessAssessor.calculateCoverage(detections);

        if (coverage.totalDetections > 0) {
            elements.coverageSection.classList.remove('hidden');
            elements.coveragePercent.textContent = coverage.coveragePercentage + '%';
            elements.coverageFill.style.width = coverage.coveragePercentage + '%';
            elements.coverageDetections.textContent = coverage.coveredDetections + ' of ' + coverage.totalDetections + ' detections covered';
        } else {
            elements.coverageSection.classList.add('hidden');
        }
    }

    // ============================================
    // Residual Risk Assessment (Phase 6C)
    // ============================================

    function showResidualRiskPanel() {
        // Check if WCGW Detection has been run
        if (typeof WCGWDetection === 'undefined') {
            alert('WCGW Detection module not available. Please run detection first.');
            return;
        }

        const detections = WCGWDetection.getDetections();
        if (!detections || detections.length === 0) {
            alert('No WCGW detections found. Please run WCGW Detection first.');
            return;
        }

        // Check if Effectiveness Assessor has assessments
        if (typeof EffectivenessAssessor === 'undefined') {
            alert('Effectiveness Assessor module not available.');
            return;
        }

        const assessments = EffectivenessAssessor.getAssessments();
        if (!assessments || assessments.length === 0) {
            alert('No control effectiveness assessments found. Please assess controls first.');
            return;
        }

        // Check if Residual Risk Assessor is available
        if (typeof ResidualRiskAssessor === 'undefined') {
            alert('Residual Risk Assessor module not available.');
            return;
        }

        // Initialize with project context
        ResidualRiskAssessor.init(currentProject);

        // Show panel
        elements.residualRiskPanel.classList.remove('hidden');

        // Calculate and render residual risk
        calculateAndRenderResidualRisk(detections, assessments);

        console.log('[FlowchartEditor] Opened residual risk assessment panel');
    }

    function calculateAndRenderResidualRisk(detections, assessments) {
        // Calculate residual risk for all detections
        const residualRiskResults = ResidualRiskAssessor.assessAll(detections);

        if (!residualRiskResults || residualRiskResults.length === 0) {
            elements.residualRiskEmpty.style.display = 'flex';
            elements.residualRiskSummary.classList.add('hidden');
            elements.riskDistribution.classList.add('hidden');
            elements.statusSummary.classList.add('hidden');
            return;
        }

        elements.residualRiskEmpty.style.display = 'none';
        elements.residualRiskSummary.classList.remove('hidden');
        elements.riskDistribution.classList.remove('hidden');
        elements.statusSummary.classList.remove('hidden');

        // Update count
        elements.residualRiskCount.textContent = residualRiskResults.length;

        // Get summary statistics
        const summary = ResidualRiskAssessor.getSummary();

        // Update summary cards
        elements.avgResidualScore.textContent = summary.averageResidualRisk;
        elements.avgRiskReduction.textContent = summary.averageRiskReduction + '%';

        // Update risk distribution bars
        const highCount = residualRiskResults.filter(r => r.riskLevel === 'high').length;
        const mediumCount = residualRiskResults.filter(r => r.riskLevel === 'medium').length;
        const lowCount = residualRiskResults.filter(r => r.riskLevel === 'low').length;
        const total = residualRiskResults.length;

        const highPercent = total > 0 ? Math.round((highCount / total) * 100) : 0;
        const mediumPercent = total > 0 ? Math.round((mediumCount / total) * 100) : 0;
        const lowPercent = total > 0 ? Math.round((lowCount / total) * 100) : 0;

        elements.highRiskFill.style.width = highPercent + '%';
        elements.highRiskCount.textContent = highCount + ' (' + highPercent + '%)';
        elements.mediumRiskFill.style.width = mediumPercent + '%';
        elements.mediumRiskCount.textContent = mediumCount + ' (' + mediumPercent + '%)';
        elements.lowRiskFill.style.width = lowPercent + '%';
        elements.lowRiskCount.textContent = lowCount + ' (' + lowPercent + '%)';

        // Update status summary
        const acceptableCount = residualRiskResults.filter(r => r.status === 'acceptable').length;
        const needControlCount = residualRiskResults.filter(r => r.status === 'need-control').length;

        elements.acceptableCount.textContent = acceptableCount;
        elements.needControlCount.textContent = needControlCount;

        // Render risk list
        renderResidualRiskList(residualRiskResults);

        // Record audit trail event
        if (typeof AuditTrail !== 'undefined' && currentProject) {
            AuditTrail.record('risk.residual.calculated', {
                projectId: currentProject.id,
                detectionCount: detections.length,
                assessmentCount: assessments.length,
                residualRiskCount: residualRiskResults.length,
                averageResidualRisk: summary.averageResidualRisk,
                averageRiskReduction: summary.averageRiskReduction,
                highRiskCount: highCount,
                mediumRiskCount: mediumCount,
                lowRiskCount: lowCount,
                timestamp: new Date().toISOString()
            });
        }

        console.log('[FlowchartEditor] Calculated residual risk for', residualRiskResults.length, 'detections');
    }

    function renderResidualRiskList(results) {
        elements.residualRiskList.innerHTML = '';

        results.forEach(result => {
            const riskItem = document.createElement('div');
            riskItem.className = 'residual-risk-item';

            // Status field uses 'Acceptable' or 'Need Additional Control'
            const statusClass = result.status === 'Acceptable' ? 'status-acceptable' : 'status-need-control';
            const statusLabel = result.status;

            // Get values from nested structure
            const inherentScore = result.inherentRisk?.score || 0;
            const controlEff = result.controlEffectiveness || 0;
            const residualScore = result.residualRisk?.score || 0;
            const riskLevel = result.residualRisk?.category || 'medium';

            riskItem.innerHTML = `
                <div class="risk-item-header">
                    <div class="risk-item-detection">
                        <span class="detection-id">DET-${String(result.detectionId).slice(-4)}</span>
                        <span class="detection-name">${result.detectionDescription || 'Unknown Detection'}</span>
                    </div>
                    <div class="risk-item-status ${statusClass}">${statusLabel}</div>
                </div>
                <div class="risk-item-scores">
                    <div class="risk-score-item">
                        <span class="score-label">Inherent Risk</span>
                        <span class="score-value inherent">${inherentScore}</span>
                    </div>
                    <div class="risk-score-arrow">→</div>
                    <div class="risk-score-item">
                        <span class="score-label">Control Eff.</span>
                        <span class="score-value effectiveness">${controlEff}%</span>
                    </div>
                    <div class="risk-score-arrow">→</div>
                    <div class="risk-score-item">
                        <span class="score-label">Residual</span>
                        <span class="score-value residual ${riskLevel}">${residualScore}</span>
                    </div>
                </div>
                <div class="risk-item-reduction">
                    <span>Risk Reduction: ${result.riskReduction}%</span>
                </div>
            `;

            elements.residualRiskList.appendChild(riskItem);
        });
    }

    // ============================================
    // Audit Recommendation (Phase 6D)
    // ============================================

    function showAuditRecommendationPanel() {
        // Check if Residual Risk Assessor has been run
        if (typeof ResidualRiskAssessor === 'undefined') {
            alert('Residual Risk Assessor module not available.');
            return;
        }

        const residualRisks = ResidualRiskAssessor.getResidualAssessments();
        if (!residualRisks || residualRisks.length === 0) {
            alert('No residual risk assessments found. Please calculate residual risk first.');
            return;
        }

        // Check if WCGW Detection has detections
        if (typeof WCGWDetection === 'undefined') {
            alert('WCGW Detection module not available.');
            return;
        }

        const detections = WCGWDetection.getDetections();
        if (!detections || detections.length === 0) {
            alert('No WCGW detections found. Please run WCGW Detection first.');
            return;
        }

        // Check if Audit Recommendation Engine is available
        if (typeof AuditRecommendationEngine === 'undefined') {
            alert('Audit Recommendation Engine module not available.');
            return;
        }

        // Initialize with project context
        AuditRecommendationEngine.init(currentProject);

        // Show panel
        elements.auditRecommendationPanel.classList.remove('hidden');

        // Generate and render recommendations
        calculateAndRenderAuditRecommendations(residualRisks, detections);

        console.log('[FlowchartEditor] Opened audit recommendation panel');
    }

    function calculateAndRenderAuditRecommendations(residualRisks, detections) {
        // Generate audit recommendations
        const recommendations = AuditRecommendationEngine.generateAll(residualRisks, detections);

        if (!recommendations || recommendations.length === 0) {
            elements.auditRecommendationEmpty.style.display = 'flex';
            elements.auditRecSummary.classList.add('hidden');
            elements.priorityDistribution.classList.add('hidden');
            elements.testTypeSummary.classList.add('hidden');
            return;
        }

        elements.auditRecommendationEmpty.style.display = 'none';
        elements.auditRecSummary.classList.remove('hidden');
        elements.priorityDistribution.classList.remove('hidden');
        elements.testTypeSummary.classList.remove('hidden');

        // Update count
        elements.auditRecommendationCount.textContent = recommendations.length;

        // Get summary statistics
        const summary = AuditRecommendationEngine.getSummary();

        // Update summary cards
        elements.totalRecommendations.textContent = summary.totalRecommendations;
        elements.highPriorityCount.textContent = summary.byPriority.high;

        // Update priority distribution
        const total = summary.totalRecommendations;
        const highPercent = total > 0 ? Math.round((summary.byPriority.high / total) * 100) : 0;
        const mediumPercent = total > 0 ? Math.round((summary.byPriority.medium / total) * 100) : 0;
        const lowPercent = total > 0 ? Math.round((summary.byPriority.low / total) * 100) : 0;

        elements.highPriorityFill.style.width = highPercent + '%';
        elements.highPriorityFillCount.textContent = summary.byPriority.high + ' (' + highPercent + '%)';
        elements.mediumPriorityFill.style.width = mediumPercent + '%';
        elements.mediumPriorityFillCount.textContent = summary.byPriority.medium + ' (' + mediumPercent + '%)';
        elements.lowPriorityFill.style.width = lowPercent + '%';
        elements.lowPriorityFillCount.textContent = summary.byPriority.low + ' (' + lowPercent + '%)';

        // Update test type summary
        elements.substantiveCount.textContent = summary.byTestType.substantive;
        elements.tocCount.textContent = summary.byTestType.testOfControls;
        elements.analyticalCount.textContent = summary.byTestType.analytical;

        // Render recommendations list
        renderAuditRecommendationList(recommendations);

        // Record audit trail event
        if (typeof AuditTrail !== 'undefined' && currentProject) {
            AuditTrail.record('audit.recommendation.generated', {
                projectId: currentProject.id,
                detectionCount: detections.length,
                residualRiskCount: residualRisks.length,
                recommendationCount: recommendations.length,
                highPriorityCount: summary.byPriority.high,
                mediumPriorityCount: summary.byPriority.medium,
                lowPriorityCount: summary.byPriority.low,
                timestamp: new Date().toISOString()
            });
        }

        console.log('[FlowchartEditor] Generated', recommendations.length, 'audit recommendations');
    }

    function renderAuditRecommendationList(recommendations) {
        elements.auditRecommendationList.innerHTML = '';

        recommendations.forEach(rec => {
            const recItem = document.createElement('div');
            recItem.className = 'audit-recommendation-item';

            recItem.innerHTML = `
                <div class="rec-item-header">
                    <div class="rec-item-assertion">
                        <span class="assertion-badge">${rec.assertion}</span>
                        <div>
                            <div class="assertion-name">${rec.assertionName}</div>
                            <div class="rec-item-description">${rec.detectionDescription || ''}</div>
                        </div>
                    </div>
                    <span class="priority-badge ${rec.priority}">${rec.priorityLabel}</span>
                </div>

                <div class="rec-item-objective">
                    <div class="objective-label">Audit Objective</div>
                    <div class="objective-text">${rec.auditObjective}</div>
                </div>

                <div class="rec-item-details">
                    <div class="rec-detail">
                        <div class="detail-label">Test Type</div>
                        <span class="test-type-badge">${formatTestType(rec.testType)}</span>
                    </div>
                    <div class="rec-detail">
                        <div class="detail-label">Residual Risk</div>
                        <div class="detail-value">${rec.residualRiskScore} (${rec.priorityLabel})</div>
                    </div>
                    <div class="rec-detail">
                        <div class="detail-label">Sample Size</div>
                        <div class="detail-value" style="font-size: 10px;">${rec.sampleSizeGuidance.substring(0, 30)}...</div>
                    </div>
                </div>

                <div class="rec-item-procedures">
                    <div class="procedures-title">Recommended Procedures:</div>
                    <ul>
                        ${rec.recommendedProcedures.map(proc => `<li>${proc}</li>`).join('')}
                    </ul>
                </div>

                <div class="rec-item-evidence">
                    <div class="evidence-title">Evidence Required:</div>
                    <ul>
                        ${rec.evidenceRequired.map(ev => `<li>${ev}</li>`).join('')}
                    </ul>
                </div>

                ${rec.auditorNotes ? `
                <div class="rec-item-notes">
                    <div class="notes-title">Auditor Notes:</div>
                    <div class="notes-text">${rec.auditorNotes}</div>
                </div>
                ` : ''}
            `;

            elements.auditRecommendationList.appendChild(recItem);
        });
    }

    function formatTestType(testType) {
        const labels = {
            'substantive': 'Substantive',
            'test-of-controls': 'Test of Controls',
            'analytical': 'Analytical'
        };
        return labels[testType] || testType;
    }

    function handleContextAction(action) {
        const selectedNode = FlowchartInteractions.getSelectedNode();
        if (!selectedNode) return;

        switch (action) {
            case 'edit':
                showPropertyPanel(selectedNode);
                break;
            case 'duplicate':
                const newNode = FlowchartInteractions.duplicateSelectedNode(FlowchartState);
                if (newNode) {
                    renderAll();
                    updateCounts();
                    FlowchartUndoRedo.saveState(FlowchartState.getFlowchartData());
                }
                break;
            case 'delete':
                FlowchartInteractions.deleteSelectedNode(FlowchartState);
                renderAll();
                updateCounts();
                FlowchartUndoRedo.saveState(FlowchartState.getFlowchartData());
                break;
        }
    }

    // ============================================
    // Public API (for other modules)
    // ============================================

    window.FlowchartEditor = {
        getFlowchartData: () => {
            const data = FlowchartState.getFlowchartData();
            console.log('[FlowchartEditor.getFlowchartData] Returning:', {
                nodes: data.nodes ? data.nodes.length : 0,
                connectors: data.connectors ? data.connectors.length : 0,
                swimlanes: data.swimlanes ? data.swimlanes.length : 0
            });
            return data;
        },
        getProjectInfo: () => {
            const project = FlowchartState.getProject();
            console.log('[FlowchartEditor.getProjectInfo] Returning:', project ? 'project available' : 'null');
            if (project) {
                console.log('[FlowchartEditor.getProjectInfo] Project keys:', Object.keys(project));
            }
            return project;
        },
        save: saveFlowchart,
        renderAll: renderAll,
        updateCounts: updateCounts
    };

    // ============================================
    // Start Application
    // ============================================

    init();
    updateUndoRedoButtons();

    // ============================================
    // Initialize WCGW Detection Module
    // ============================================

    // WCGWDetection needs to be initialized AFTER FlowchartEditor is ready
    // This was missing - the init() was never called!
    if (typeof WCGWDetection !== 'undefined') {
        console.log('[FlowchartEditor] Initializing WCGWDetection module...');
        WCGWDetection.init(window.FlowchartEditor);
        console.log('[FlowchartEditor] WCGWDetection module initialized');
    } else {
        console.warn('[FlowchartEditor] WCGWDetection module not available');
    }
});
