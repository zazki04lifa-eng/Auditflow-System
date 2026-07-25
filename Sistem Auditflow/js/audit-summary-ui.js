/**
 * AuditFlow - Audit Summary UI Module (Sprint 7)
 * 
 * UI controller for the Audit Summary page. Handles rendering
 * and user interactions for the audit summary report.
 */

(function () {
    // ============================================
    // Element References
    // ============================================

    const elements = {
        loadingState: document.getElementById('loading-state'),
        summaryContent: document.getElementById('summary-content'),
        emptyState: document.getElementById('empty-state'),
        executiveCards: document.getElementById('executive-cards'),
        conclusionBox: document.getElementById('conclusion-box'),
        projectInfo: document.getElementById('project-info'),
        businessSummary: document.getElementById('business-summary'),
        flowchartSummary: document.getElementById('flowchart-summary'),
        wcgwAnalysis: document.getElementById('wcgw-analysis'),
        riskSummary: document.getElementById('risk-summary'),
        controlRecommendations: document.getElementById('control-recommendations'),
        controlEffectiveness: document.getElementById('control-effectiveness'),
        residualRisk: document.getElementById('residual-risk'),
        auditRecommendations: document.getElementById('audit-recommendations'),
        finalConclusion: document.getElementById('final-conclusion'),
        projectSubtitle: document.getElementById('project-subtitle'),
        exportJsonBtn: document.getElementById('export-json-btn'),
        exportHtmlBtn: document.getElementById('export-html-btn'),
        printReportBtn: document.getElementById('print-report-btn')
    };

    // ============================================
    // Initialization
    // ============================================

    function init() {
        console.log('[AuditSummaryUI] Initializing...');

        // Setup event listeners
        setupEventListeners();

        // Generate and display summary
        generateAndDisplaySummary();
    }

    function setupEventListeners() {
        elements.exportJsonBtn.addEventListener('click', exportJSON);
        elements.exportHtmlBtn.addEventListener('click', exportHTML);
        elements.printReportBtn.addEventListener('click', printReport);
    }

    // ============================================
    // Data Generation
    // ============================================

    function generateAndDisplaySummary() {
        console.log('[AuditSummaryUI] generateAndDisplaySummary called');

        // Show loading state
        elements.loadingState.classList.remove('hidden');
        elements.summaryContent.classList.add('hidden');
        elements.emptyState.classList.add('hidden');

        // Simulate async operation for better UX
        setTimeout(() => {
            try {
                console.log('[AuditSummaryUI] Loading project context...');

                // Get project context from localStorage or app state
                const projectContext = loadProjectContext();
                console.log('[AuditSummaryUI] Project context loaded:', projectContext ? 'found' : 'null');

                if (!projectContext) {
                    console.warn('[AuditSummaryUI] No project context found, showing empty state');
                    showEmptyState();
                    return;
                }

                console.log('[AuditSummaryUI] Initializing AuditSummary module...');
                // Initialize Audit Summary module
                AuditSummary.init(projectContext);

                console.log('[AuditSummaryUI] Generating summary...');
                // Generate summary
                const summary = AuditSummary.generateSummary();
                console.log('[AuditSummaryUI] Summary generated:', summary ? 'success' : 'failed');

                if (!summary) {
                    console.error('[AuditSummaryUI] Summary generation returned null');
                    showEmptyState();
                    return;
                }

                console.log('[AuditSummaryUI] Rendering sections...');
                // Render all sections
                renderExecutiveCards(summary);
                renderConclusion(summary);
                renderProjectInfo(summary);
                renderBusinessUnderstanding(summary);
                renderFlowchartSummary(summary);
                renderWCGWAnalysis(summary);
                renderRiskSummary(summary);
                renderControlRecommendations(summary);
                renderControlEffectiveness(summary);
                renderResidualRisk(summary);
                renderAuditRecommendations(summary);
                renderFinalConclusion(summary);

                // Update subtitle
                elements.projectSubtitle.textContent = `${summary.projectInfo.projectName} - ${new Date(summary.metadata.generatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`;

                // Show content
                elements.loadingState.classList.add('hidden');
                elements.summaryContent.classList.remove('hidden');

                console.log('[AuditSummaryUI] Summary displayed successfully');

            } catch (error) {
                console.error('[AuditSummaryUI] Error generating summary:', error);
                showEmptyState();
            }
        }, 500);
    }

    function loadProjectContext() {
        console.log('[AuditSummaryUI] loadProjectContext called');

        // Try to load from localStorage
        try {
            const savedData = localStorage.getItem('auditflow_current_project');
            console.log('[AuditSummaryUI] localStorage auditflow_current_project:', savedData ? 'found (' + savedData.length + ' chars)' : 'not found');

            if (savedData) {
                const parsed = JSON.parse(savedData);
                console.log('[AuditSummaryUI] Parsed localStorage data:', {
                    hasProjectInfo: !!parsed.projectInfo,
                    hasFlowchart: !!parsed.flowchart,
                    projectName: parsed.projectInfo?.projectName
                });
                
                // Normalize the data structure to match AuditSummary expectations
                return normalizeProjectContext(parsed);
            }
        } catch (e) {
            console.warn('[AuditSummaryUI] Could not load from localStorage:', e);
        }

        // Try to load from window.app state
        if (window.app && window.app.currentProject) {
            console.log('[AuditSummaryUI] Found window.app.currentProject');
            return normalizeProjectContext(window.app.currentProject);
        }

        console.log('[AuditSummaryUI] Falling back to mock data');
        // Return mock data for demo purposes
        return getMockProjectContext();
    }

    /**
     * Normalize project context to ensure consistent structure for AuditSummary
     */
    function normalizeProjectContext(project) {
        console.log('[AuditSummaryUI] Normalizing project context...');
        
        if (!project) return null;
        
        // Ensure all expected properties exist
        const normalized = {
            ...project,
            projectInfo: project.projectInfo || {},
            businessUnderstanding: project.businessUnderstanding || project.understandingBusiness || {},
            flowchart: project.flowchart || { nodes: [], connectors: [], swimlanes: [] },
            wcgw: project.wcgw || { detections: [] },
            controls: project.controls || { recommendations: [] },
            effectiveness: project.effectiveness || { assessments: [] },
            residualRisk: project.residualRisk || { assessments: [] },
            auditRecommendations: project.auditRecommendations || { recommendations: [] }
        };
        
        console.log('[AuditSummaryUI] Normalized project:', {
            hasProjectInfo: !!normalized.projectInfo,
            hasBusinessUnderstanding: !!normalized.businessUnderstanding,
            hasFlowchart: !!normalized.flowchart,
            wcgwDetections: normalized.wcgw?.detections?.length || 0,
            controls: normalized.controls?.recommendations?.length || 0,
            effectiveness: normalized.effectiveness?.assessments?.length || 0,
            residualRisk: normalized.residualRisk?.assessments?.length || 0,
            auditRecs: normalized.auditRecommendations?.recommendations?.length || 0
        });
        
        return normalized;
    }

    function getMockProjectContext() {
        // This provides sample data when no project is loaded
        return {
            projectInfo: {
                projectId: 'DEMO-001',
                projectName: 'Demo Audit Project',
                clientName: 'PT Sample Company',
                industry: 'Manufacturing',
                fiscalYearEnd: '31 December 2024',
                engagementType: 'Financial Statement Audit'
            },
            businessUnderstanding: {
                companyOverview: 'PT Sample Company is a leading manufacturing company specializing in consumer goods production.',
                industryOverview: 'The manufacturing sector is highly competitive with strict regulatory requirements.',
                regulatoryEnvironment: 'Subject to FDA regulations, environmental standards, and labor laws.',
                internalControlEnvironment: 'The company has established internal controls with regular monitoring.'
            },
            flowchart: {
                nodes: [
                    { id: '1', type: 'terminator', swimlane: 'sw1' },
                    { id: '2', type: 'process', swimlane: 'sw1' },
                    { id: '3', type: 'decision', swimlane: 'sw2' },
                    { id: '4', type: 'document', swimlane: 'sw2' },
                    { id: '5', type: 'process', swimlane: 'sw3' }
                ],
                connectors: [
                    { id: 'c1', source: '1', target: '2' },
                    { id: 'c2', source: '2', target: '3' },
                    { id: 'c3', source: '3', target: '4' }
                ],
                swimlanes: [
                    { id: 'sw1', name: 'Sales Department' },
                    { id: 'sw2', name: 'Finance Department' },
                    { id: 'sw3', name: 'Warehouse' }
                ]
            },
            wcgw: {
                detections: [
                    { id: 'd1', name: 'Fictitious Sales', riskLevel: 'high', assertion: 'occurrence', description: 'Risk of recording sales that never occurred' },
                    { id: 'd2', name: 'Unauthorized Credit', riskLevel: 'medium', assertion: 'authorization', description: 'Credit granted without proper approval' },
                    { id: 'd3', name: 'Incorrect Pricing', riskLevel: 'medium', assertion: 'accuracy', description: 'Prices applied incorrectly to invoices' },
                    { id: 'd4', name: 'Unrecorded Returns', riskLevel: 'low', assertion: 'completeness', description: 'Customer returns not recorded in system' }
                ]
            },
            controls: {
                recommendations: [
                    { id: 'c1', controlName: 'Segregation of Duties', controlType: 'preventive', automationLevel: 'manual', frequency: 'continuous', confidenceScore: 85, description: 'Separate responsibilities for order entry and approval' },
                    { id: 'c2', controlName: 'Automated Credit Check', controlType: 'detective', automationLevel: 'automated', frequency: 'per_transaction', confidenceScore: 90, description: 'System automatically validates credit limits' },
                    { id: 'c3', controlName: 'Price Master File Controls', controlType: 'preventive', automationLevel: 'semiAutomated', frequency: 'daily', confidenceScore: 75, description: 'Regular review and approval of price changes' }
                ]
            },
            effectiveness: {
                assessments: [
                    { controlId: 'c1', controlName: 'Segregation of Duties', effectivenessScore: 70, effectivenessCategory: 'effective', rationale: 'Well-defined roles but some overlap exists' },
                    { controlId: 'c2', controlName: 'Automated Credit Check', effectivenessScore: 90, effectivenessCategory: 'highly_effective', rationale: 'System controls are robust and consistently applied' },
                    { controlId: 'c3', controlName: 'Price Master File Controls', effectivenessScore: 60, effectivenessCategory: 'partially_effective', rationale: 'Manual processes introduce some risk' }
                ]
            },
            residualRisk: {
                assessments: [
                    { detectionId: 'd1', detectionName: 'Fictitious Sales', inherentRiskScore: 80, residualRiskScore: 30, residualRiskCategory: 'medium', controlEffectiveness: 70, status: 'acceptable', rationale: 'Controls reduce risk to acceptable level' },
                    { detectionId: 'd2', detectionName: 'Unauthorized Credit', inherentRiskScore: 60, residualRiskScore: 15, residualRiskCategory: 'low', controlEffectiveness: 90, status: 'acceptable', rationale: 'Automated controls are highly effective' },
                    { detectionId: 'd3', detectionName: 'Incorrect Pricing', inherentRiskScore: 50, residualRiskScore: 35, residualRiskCategory: 'medium', controlEffectiveness: 60, status: 'need_control', rationale: 'Additional controls needed for price validation' },
                    { detectionId: 'd4', detectionName: 'Unrecorded Returns', inherentRiskScore: 30, residualRiskScore: 20, residualRiskCategory: 'low', controlEffectiveness: 50, status: 'acceptable', rationale: 'Low inherent risk with moderate controls' }
                ]
            },
            auditRecommendations: {
                recommendations: [
                    { id: 'r1', assertion: 'occurrence', auditObjective: 'Verify existence of recorded sales', recommendedProcedure: 'Select sample of sales invoices and trace to shipping documents and customer orders', evidenceRequired: 'Shipping documents, customer orders, invoices', testType: 'substantive', priority: 'high', residualRiskScore: 30, auditorNotes: 'Focus on large and unusual transactions' },
                    { id: 'r2', assertion: 'authorization', auditObjective: 'Verify proper authorization of credit', recommendedProcedure: 'Test a sample of sales for proper credit approval', evidenceRequired: 'Credit approval forms, system logs', testType: 'test_of_controls', priority: 'medium', residualRiskScore: 15, auditorNotes: 'Review automated credit check logs' },
                    { id: 'r3', assertion: 'accuracy', auditObjective: 'Verify accuracy of pricing', recommendedProcedure: 'Compare sampled invoice prices to approved price list', evidenceRequired: 'Price lists, invoices, approval documentation', testType: 'substantive', priority: 'medium', residualRiskScore: 35, auditorNotes: 'Test price override transactions separately' },
                    { id: 'r4', assertion: 'completeness', auditObjective: 'Verify all returns are recorded', recommendedProcedure: 'Review subsequent period for unrecorded returns', evidenceRequired: 'Return authorizations, credit memos', testType: 'analytical', priority: 'low', residualRiskScore: 20, auditorNotes: 'Perform analytical review of returns trend' }
                ]
            }
        };
    }

    // ============================================
    // Rendering Functions
    // ============================================

    function renderExecutiveCards(summary) {
        const cards = [
            { value: summary.wcgwAnalysis.totalDetections, label: 'WCGW Risks Detected', color: 'warning' },
            { value: summary.controlRecommendations.totalRecommendations, label: 'Controls Recommended', color: 'info' },
            { value: summary.residualRisk.averageRiskReduction + '%', label: 'Risk Reduction', color: 'success' },
            { value: summary.auditRecommendations.totalRecommendations, label: 'Audit Procedures', color: 'primary' },
            { value: summary.overallConclusion.overallRiskLevel, label: 'Overall Risk Level', color: summary.overallConclusion.overallRiskLevel.toLowerCase() === 'high' ? 'danger' : summary.overallConclusion.overallRiskLevel.toLowerCase() === 'medium' ? 'warning' : 'success' },
            { value: summary.controlEffectiveness.coveragePercent + '%', label: 'Control Coverage', color: 'info' }
        ];

        elements.executiveCards.innerHTML = cards.map(card => `
            <div class="exec-card exec-card-${card.color}">
                <div class="exec-card-value">${card.value}</div>
                <div class="exec-card-label">${card.label}</div>
            </div>
        `).join('');
    }

    function renderConclusion(summary) {
        const conclusion = summary.overallConclusion;
        const riskClass = conclusion.overallRiskLevel.toLowerCase();

        elements.conclusionBox.innerHTML = `
            <div class="conclusion-header">
                <div class="conclusion-badges">
                    <span class="badge badge-${riskClass}">${conclusion.overallRiskLevel} Risk</span>
                    <span class="badge badge-info">${conclusion.controlEnvironment}</span>
                    <span class="badge badge-primary">${conclusion.auditApproach}</span>
                </div>
            </div>
            <p class="conclusion-text">${conclusion.conclusionText}</p>
            <div class="conclusion-findings">
                <h4>Key Findings:</h4>
                <ul>
                    ${conclusion.keyFindings.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>
            <div class="conclusion-recommendations">
                <h4>Recommendations:</h4>
                <ul>
                    ${conclusion.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    function renderProjectInfo(summary) {
        const info = summary.projectInfo;
        const items = [
            { label: 'Project ID', value: info.projectId },
            { label: 'Project Name', value: info.projectName },
            { label: 'Client', value: info.clientName },
            { label: 'Industry', value: info.industry },
            { label: 'Fiscal Year End', value: info.fiscalYearEnd },
            { label: 'Engagement Type', value: info.engagementType }
        ];

        elements.projectInfo.innerHTML = items.map(item => `
            <div class="info-item">
                <span class="info-label">${item.label}</span>
                <span class="info-value">${item.value}</span>
            </div>
        `).join('');
    }

    function renderBusinessUnderstanding(summary) {
        const bu = summary.businessUnderstanding;
        elements.businessSummary.innerHTML = `
            <div class="bu-section">
                <h3>Company Overview</h3>
                <p>${bu.companyOverview}</p>
            </div>
            <div class="bu-section">
                <h3>Industry & Regulatory Environment</h3>
                <p><strong>Industry:</strong> ${bu.industryOverview}</p>
                <p><strong>Regulatory Environment:</strong> ${bu.regulatoryEnvironment}</p>
            </div>
            <div class="bu-section">
                <h3>Internal Control Environment</h3>
                <p>${bu.internalControlEnvironment}</p>
            </div>
        `;
    }

    function renderFlowchartSummary(summary) {
        const fc = summary.flowchartSummary;
        elements.flowchartSummary.innerHTML = `
            <div class="fc-stats">
                <div class="fc-stat">
                    <span class="fc-stat-value">${fc.totalNodes}</span>
                    <span class="fc-stat-label">Total Process Steps</span>
                </div>
                <div class="fc-stat">
                    <span class="fc-stat-value">${fc.totalSwimlanes}</span>
                    <span class="fc-stat-label">Process Areas</span>
                </div>
                <div class="fc-stat">
                    <span class="fc-stat-value">${fc.nodeBreakdown.decisions}</span>
                    <span class="fc-stat-label">Decision Points</span>
                </div>
                <div class="fc-stat">
                    <span class="fc-stat-value">${fc.complexity}</span>
                    <span class="fc-stat-label">Complexity</span>
                </div>
            </div>
            <h3>Process Breakdown</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Process Area</th><th>Number of Steps</th></tr>
                </thead>
                <tbody>
                    ${fc.processes.map(p => `<tr><td>${p.name}</td><td>${p.nodeCount}</td></tr>`).join('')}
                </tbody>
            </table>
        `;
    }

    function renderWCGWAnalysis(summary) {
        const wcgw = summary.wcgwAnalysis;
        elements.wcgwAnalysis.innerHTML = `
            <div class="risk-distribution">
                <div class="risk-stat risk-stat-high">
                    <span class="risk-stat-value">${wcgw.byRiskLevel.high}</span>
                    <span class="risk-stat-label">High Risk</span>
                </div>
                <div class="risk-stat risk-stat-medium">
                    <span class="risk-stat-value">${wcgw.byRiskLevel.medium}</span>
                    <span class="risk-stat-label">Medium Risk</span>
                </div>
                <div class="risk-stat risk-stat-low">
                    <span class="risk-stat-value">${wcgw.byRiskLevel.low}</span>
                    <span class="risk-stat-label">Low Risk</span>
                </div>
            </div>
            <h3>Risks by Assertion</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Assertion</th><th>Count</th><th>Risk Level</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(wcgw.byAssertion).map(([assertion, count]) => {
            const riskItems = wcgw.highRiskItems.filter(i => i.assertion === assertion);
            const riskLevel = riskItems.length > 0 ? 'High' : count > 0 ? 'Medium' : 'Low';
            return `<tr>
                            <td>${assertion}</td>
                            <td>${count}</td>
                            <td><span class="badge badge-${riskLevel.toLowerCase()}">${riskLevel}</span></td>
                        </tr>`;
        }).join('')}
                </tbody>
            </table>
            ${wcgw.highRiskItems.length > 0 ? `
                <h3>High Risk Items</h3>
                <table class="data-table">
                    <thead>
                        <tr><th>Risk</th><th>Assertion</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        ${wcgw.highRiskItems.map(item => `<tr>
                            <td>${item.name}</td>
                            <td>${item.assertion}</td>
                            <td>${item.description || 'N/A'}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            ` : ''}
        `;
    }

    function renderRiskSummary(summary) {
        const risk = summary.riskSummary;
        elements.riskSummary.innerHTML = `
            <div class="risk-overview">
                <div class="risk-overview-item">
                    <span class="risk-overview-value">${risk.totalRiskScore}</span>
                    <span class="risk-overview-label">Total Risk Score</span>
                </div>
                <div class="risk-overview-item">
                    <span class="risk-overview-value">${risk.riskExposurePercent}%</span>
                    <span class="risk-overview-label">Risk Exposure</span>
                </div>
                <div class="risk-overview-item">
                    <span class="risk-overview-value badge badge-${risk.riskLevel.toLowerCase()}">${risk.riskLevel}</span>
                    <span class="risk-overview-label">Overall Risk Level</span>
                </div>
            </div>
        `;
    }

    function renderControlRecommendations(summary) {
        const controls = summary.controlRecommendations;
        elements.controlRecommendations.innerHTML = `
            <div class="control-stats">
                <div class="control-stat">
                    <span class="control-stat-value">${controls.totalRecommendations}</span>
                    <span class="control-stat-label">Total Controls</span>
                </div>
                <div class="control-stat">
                    <span class="control-stat-value">${controls.byAutomation.automated || 0}</span>
                    <span class="control-stat-label">Automated</span>
                </div>
                <div class="control-stat">
                    <span class="control-stat-value">${controls.byAutomation.semiAutomated || 0}</span>
                    <span class="control-stat-label">Semi-Automated</span>
                </div>
                <div class="control-stat">
                    <span class="control-stat-value">${controls.byAutomation.manual || 0}</span>
                    <span class="control-stat-label">Manual</span>
                </div>
            </div>
            <h3>Recommended Controls</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Control Name</th><th>Type</th><th>Automation</th><th>Frequency</th><th>Confidence</th></tr>
                </thead>
                <tbody>
                    ${controls.recommendations.map(c => `<tr>
                        <td>${c.controlName}</td>
                        <td>${c.controlType}</td>
                        <td>${c.automationLevel}</td>
                        <td>${c.frequency}</td>
                        <td>${c.confidenceScore ? Math.round(c.confidenceScore) + '%' : 'N/A'}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        `;
    }

    function renderControlEffectiveness(summary) {
        const eff = summary.controlEffectiveness;
        elements.controlEffectiveness.innerHTML = `
            <div class="effectiveness-stats">
                <div class="eff-stat">
                    <span class="eff-stat-value">${eff.averageEffectivenessScore}%</span>
                    <span class="eff-stat-label">Avg Effectiveness</span>
                </div>
                <div class="eff-stat">
                    <span class="eff-stat-value">${eff.coveragePercent}%</span>
                    <span class="eff-stat-label">Coverage</span>
                </div>
                <div class="eff-stat">
                    <span class="eff-stat-value">${eff.byCategory.highly_effective || 0}</span>
                    <span class="eff-stat-label">Highly Effective</span>
                </div>
                <div class="eff-stat">
                    <span class="eff-stat-value">${eff.byCategory.ineffective || 0}</span>
                    <span class="eff-stat-label">Ineffective</span>
                </div>
            </div>
        `;
    }

    function renderResidualRisk(summary) {
        const rr = summary.residualRisk;
        elements.residualRisk.innerHTML = `
            <div class="rr-stats">
                <div class="rr-stat">
                    <span class="rr-stat-value">${rr.averageInherentRiskScore}</span>
                    <span class="rr-stat-label">Avg Inherent Risk</span>
                </div>
                <div class="rr-stat">
                    <span class="rr-stat-value">${rr.averageResidualRiskScore}</span>
                    <span class="rr-stat-label">Avg Residual Risk</span>
                </div>
                <div class="rr-stat">
                    <span class="rr-stat-value">${rr.averageRiskReduction}%</span>
                    <span class="rr-stat-label">Risk Reduction</span>
                </div>
            </div>
            <div class="rr-status">
                <div class="rr-status-item rr-status-acceptable">
                    <span class="rr-status-value">${rr.statusBreakdown.acceptable}</span>
                    <span class="rr-status-label">Acceptable</span>
                </div>
                <div class="rr-status-item rr-status-need">
                    <span class="rr-status-value">${rr.statusBreakdown.needControl}</span>
                    <span class="rr-status-label">Need Control</span>
                </div>
            </div>
        `;
    }

    function renderAuditRecommendations(summary) {
        const ar = summary.auditRecommendations;
        elements.auditRecommendations.innerHTML = `
            <div class="ar-stats">
                <div class="ar-stat">
                    <span class="ar-stat-value">${ar.totalRecommendations}</span>
                    <span class="ar-stat-label">Total Procedures</span>
                </div>
                <div class="ar-stat ar-stat-high">
                    <span class="ar-stat-value">${ar.byPriority.high}</span>
                    <span class="ar-stat-label">High Priority</span>
                </div>
                <div class="ar-stat ar-stat-medium">
                    <span class="ar-stat-value">${ar.byPriority.medium}</span>
                    <span class="ar-stat-label">Medium Priority</span>
                </div>
                <div class="ar-stat ar-stat-low">
                    <span class="ar-stat-value">${ar.byPriority.low}</span>
                    <span class="ar-stat-label">Low Priority</span>
                </div>
            </div>
            <h3>Audit Procedures</h3>
            <table class="data-table">
                <thead>
                    <tr><th>Priority</th><th>Assertion</th><th>Procedure</th><th>Test Type</th><th>Risk Score</th></tr>
                </thead>
                <tbody>
                    ${ar.recommendations
                .sort((a, b) => (b.residualRiskScore || 0) - (a.residualRiskScore || 0))
                .map(r => `<tr>
                        <td><span class="badge badge-${r.priority}">${r.priority.toUpperCase()}</span></td>
                        <td>${r.assertion}</td>
                        <td>${r.recommendedProcedure}</td>
                        <td>${r.testType === 'substantive' ? 'Substantive' : r.testType === 'test_of_controls' ? 'ToC' : 'Analytical'}</td>
                        <td>${r.residualRiskScore || 'N/A'}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        `;
    }

    function renderFinalConclusion(summary) {
        const conclusion = summary.overallConclusion;
        elements.finalConclusion.innerHTML = `
            <div class="final-conclusion-box">
                <p class="final-text">${conclusion.conclusionText}</p>
                <div class="final-findings">
                    <h4>Key Findings:</h4>
                    <ul>
                        ${conclusion.keyFindings.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
                <div class="final-recommendations">
                    <h4>Recommendations:</h4>
                    <ul>
                        ${conclusion.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                <div class="final-meta">
                    <p>Generated by AuditFlow v1.0 | ${summary.metadata.generatedBy} | ${new Date(summary.metadata.generatedAt).toLocaleString('id-ID')}</p>
                </div>
            </div>
        `;
    }

    function showEmptyState() {
        elements.loadingState.classList.add('hidden');
        elements.summaryContent.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    }

    // ============================================
    // Export Functions
    // ============================================

    function exportJSON() {
        const summary = AuditSummary.getSummary();
        if (!summary) {
            alert('No summary data available to export.');
            return;
        }

        const json = AuditSummary.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-summary-${summary.projectInfo.projectId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[AuditSummaryUI] JSON exported');
    }

    async function exportHTML() {
        console.log('[AuditSummaryUI] Starting HTML export...');
        
        // Try to capture flowchart image using html2canvas
        let flowchartImageBase64 = null;
        
        try {
            // Load html2canvas dynamically from CDN
            if (typeof html2canvas === 'undefined') {
                console.log('[AuditSummaryUI] Loading html2canvas from CDN...');
                await loadHtml2Canvas();
            }
            
            // Try to get flowchart canvas from flowchart-editor page if available
            // Or try to get any canvas element on current page
            const canvasEl = document.querySelector('#flowchart-canvas') ||
                            document.querySelector('canvas') ||
                            document.querySelector('.flowchart-canvas');
            
            if (canvasEl) {
                console.log('[AuditSummaryUI] Capturing flowchart image...');
                const canvas = await html2canvas(canvasEl, {
                    backgroundColor: '#ffffff',
                    scale: 2, // Higher quality
                    useCORS: true,
                    logging: false
                });
                flowchartImageBase64 = canvas.toDataURL('image/png');
                console.log('[AuditSummaryUI] Flowchart image captured successfully');
            } else {
                console.log('[AuditSummaryUI] No flowchart canvas found, exporting without image');
            }
        } catch (error) {
            console.warn('[AuditSummaryUI] Failed to capture flowchart image:', error);
        }
        
        // Generate HTML with optional flowchart image
        const html = AuditSummary.exportHTML(flowchartImageBase64);
        
        // Download the HTML file
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-report-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[AuditSummaryUI] HTML exported successfully');
    }

    /**
     * Load html2canvas library dynamically from CDN
     */
    function loadHtml2Canvas() {
        return new Promise((resolve, reject) => {
            if (typeof html2canvas !== 'undefined') {
                resolve();
                return;
            }
            
            console.log('[AuditSummaryUI] Loading html2canvas script...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => {
                console.log('[AuditSummaryUI] html2canvas loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('[AuditSummaryUI] Failed to load html2canvas');
                reject(new Error('Failed to load html2canvas from CDN'));
            };
            document.head.appendChild(script);
        });
    }

    function printReport() {
        window.print();
        console.log('[AuditSummaryUI] Print initiated');
    }

    // ============================================
    // Initialize on DOM Ready
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();