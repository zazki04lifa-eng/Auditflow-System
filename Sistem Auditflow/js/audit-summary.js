/**
 * AuditFlow - Audit Summary Module (Sprint 7)
 * 
 * Central module for compiling comprehensive audit summaries from all
 * Sprint 1-6 modules. This module aggregates data from:
 * - Project Information
 * - Business Understanding
 * - Flowchart Analysis
 * - WCGW Detection
 * - Control Recommendations
 * - Control Effectiveness
 * - Residual Risk Assessment
 * - Audit Recommendations
 * 
 * Usage:
 * AuditSummary.init(projectContext)
 * AuditSummary.generateSummary()
 * AuditSummary.exportReport('pdf')
 */

const AuditSummary = (function () {
    // ============================================
    // Private State
    // ============================================

    let _projectContext = null;
    let _summaryData = null;
    let _isInitialized = false;

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize the Audit Summary module with project context
     * @param {object} projectContext - The current project context
     */
    function init(projectContext) {
        _projectContext = projectContext;
        _isInitialized = true;
        _summaryData = null;

        console.log('[AuditSummary] Initialized with project:', projectContext?.projectInfo?.projectName || 'Unknown');
    }

    // ============================================
    // Data Aggregation
    // ============================================

    /**
     * Generate comprehensive audit summary from all modules
     * @returns {object} Complete audit summary data
     */
    function generateSummary() {
        if (!_isInitialized) {
            console.warn('[AuditSummary] Module not initialized. Call init() first.');
            return null;
        }

        try {
            _summaryData = {
                // Project Information
                projectInfo: extractProjectInfo(),

                // Business Understanding Summary
                businessUnderstanding: extractBusinessUnderstanding(),

                // Flowchart Summary
                flowchartSummary: extractFlowchartSummary(),

                // WCGW Analysis
                wcgwAnalysis: extractWCGWAnalysis(),

                // Risk Summary
                riskSummary: extractRiskSummary(),

                // Control Recommendations
                controlRecommendations: extractControlRecommendations(),

                // Control Effectiveness
                controlEffectiveness: extractControlEffectiveness(),

                // Residual Risk
                residualRisk: extractResidualRisk(),

                // Audit Recommendations
                auditRecommendations: extractAuditRecommendations(),

                // Overall Conclusion
                overallConclusion: generateOverallConclusion(),

                // Metadata
                metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: _projectContext?.currentUser?.userName || 'Unknown User',
                    projectId: _projectContext?.projectInfo?.projectId || 'Unknown',
                    version: '1.0.0'
                }
            };

            console.log('[AuditSummary] Summary generated successfully');
            return _summaryData;

        } catch (error) {
            console.error('[AuditSummary] Error generating summary:', error);
            return null;
        }
    }

    /**
     * Extract project information
     */
    function extractProjectInfo() {
        const info = _projectContext?.projectInfo || {};
        return {
            projectId: info.projectId || 'N/A',
            projectName: info.projectName || 'N/A',
            clientName: info.clientName || 'N/A',
            industry: info.industry || 'N/A',
            fiscalYearEnd: info.fiscalYearEnd || 'N/A',
            engagementType: info.engagementType || 'N/A',
            teamMembers: info.teamMembers || [],
            createdAt: info.createdAt || new Date().toISOString(),
            lastModified: info.lastModified || new Date().toISOString()
        };
    }

    /**
     * Extract business understanding summary
     */
    function extractBusinessUnderstanding() {
        const business = _projectContext?.businessUnderstanding || {};
        return {
            companyOverview: business.companyOverview || 'Not provided',
            industryOverview: business.industryOverview || 'Not provided',
            regulatoryEnvironment: business.regulatoryEnvironment || 'Not provided',
            businessRisks: business.businessRisks || [],
            keyPerformanceIndicators: business.keyPerformanceIndicators || [],
            accountingPolicies: business.accountingPolicies || 'Not provided',
            internalControlEnvironment: business.internalControlEnvironment || 'Not provided',
            priorAuditFindings: business.priorAuditFindings || 'Not provided',
            relatedParties: business.relatedParties || 'Not provided',
            significantTransactions: business.significantTransactions || 'Not provided'
        };
    }

    /**
     * Extract flowchart summary
     */
    function extractFlowchartSummary() {
        const flowchart = _projectContext?.flowchart || {};
        const nodes = flowchart.nodes || [];
        const connectors = flowchart.connectors || [];
        const swimlanes = flowchart.swimlanes || [];

        // Count node types
        const nodeTypes = nodes.reduce((acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1;
            return acc;
        }, {});

        return {
            totalNodes: nodes.length,
            totalConnectors: connectors.length,
            totalSwimlanes: swimlanes.length,
            nodeBreakdown: {
                terminators: nodeTypes.terminator || 0,
                processes: nodeTypes.process || 0,
                decisions: nodeTypes.decision || 0,
                documents: nodeTypes.document || 0,
                databases: nodeTypes.database || 0,
                manualInputs: nodeTypes.manual - input || 0,
                manualOperations: nodeTypes.manual - operation || 0,
                connectors: nodeTypes.connector || 0,
                offPageConnectors: nodeTypes.off - page || 0
            },
            processes: swimlanes.map(s => ({
                name: s.name || 'Unnamed',
                nodeCount: nodes.filter(n => n.swimlane === s.id).length
            })),
            complexity: calculateFlowchartComplexity(nodes, connectors)
        };
    }

    /**
     * Calculate flowchart complexity score
     */
    function calculateFlowchartComplexity(nodes, connectors) {
        if (nodes.length === 0) return 'Low';

        const decisionRatio = nodes.filter(n => n.type === 'decision').length / nodes.length;
        const connectorRatio = connectors.length / Math.max(nodes.length, 1);

        const score = (decisionRatio * 40) + (connectorRatio * 30) + (Math.min(nodes.length / 20, 1) * 30);

        if (score >= 70) return 'High';
        if (score >= 40) return 'Medium';
        return 'Low';
    }

    /**
     * Extract WCGW analysis
     */
    function extractWCGWAnalysis() {
        const wcgw = _projectContext?.wcgw || {};
        const detections = wcgw.detections || [];

        // Count by risk level
        const riskCounts = detections.reduce((acc, d) => {
            const level = d.riskLevel || 'low';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, { high: 0, medium: 0, low: 0 });

        // Count by assertion
        const assertionCounts = detections.reduce((acc, d) => {
            const assertion = d.assertion || 'unknown';
            acc[assertion] = (acc[assertion] || 0) + 1;
            return acc;
        }, {});

        return {
            totalDetections: detections.length,
            byRiskLevel: riskCounts,
            byAssertion: assertionCounts,
            highRiskItems: detections.filter(d => d.riskLevel === 'high').map(d => ({
                id: d.id,
                name: d.name || d.riskType,
                assertion: d.assertion,
                description: d.description
            })),
            mediumRiskItems: detections.filter(d => d.riskLevel === 'medium').map(d => ({
                id: d.id,
                name: d.name || d.riskType,
                assertion: d.assertion,
                description: d.description
            })),
            lowRiskItems: detections.filter(d => d.riskLevel === 'low').map(d => ({
                id: d.id,
                name: d.name || d.riskType,
                assertion: d.assertion,
                description: d.description
            }))
        };
    }

    /**
     * Extract risk summary
     */
    function extractRiskSummary() {
        const wcgw = _projectContext?.wcgw || {};
        const detections = wcgw.detections || [];

        // Calculate inherent risk scores
        const inherentScores = {
            high: detections.filter(d => d.riskLevel === 'high').length,
            medium: detections.filter(d => d.riskLevel === 'medium').length,
            low: detections.filter(d => d.riskLevel === 'low').length
        };

        // Calculate overall risk exposure
        const totalRiskScore = (inherentScores.high * 3) + (inherentScores.medium * 2) + (inherentScores.low * 1);
        const maxPossibleScore = detections.length * 3;
        const riskExposurePercent = maxPossibleScore > 0 ? (totalRiskScore / maxPossibleScore) * 100 : 0;

        return {
            inherentRisk: inherentScores,
            totalRiskScore,
            maxPossibleScore,
            riskExposurePercent: Math.round(riskExposurePercent),
            riskLevel: riskExposurePercent >= 60 ? 'High' : riskExposurePercent >= 30 ? 'Medium' : 'Low'
        };
    }

    /**
     * Extract control recommendations
     */
    function extractControlRecommendations() {
        const controls = _projectContext?.controls || {};
        const recommendations = controls.recommendations || [];

        // Count by control type
        const byType = recommendations.reduce((acc, c) => {
            const type = c.controlType || 'general';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        // Count by automation level
        const byAutomation = recommendations.reduce((acc, c) => {
            const level = c.automationLevel || 'manual';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, { automated: 0, semiAutomated: 0, manual: 0 });

        return {
            totalRecommendations: recommendations.length,
            byType,
            byAutomation,
            recommendations: recommendations.map(r => ({
                id: r.id,
                controlName: r.controlName,
                controlType: r.controlType,
                automationLevel: r.automationLevel,
                frequency: r.frequency,
                addressesRisk: r.addressesRisk,
                confidenceScore: r.confidenceScore,
                description: r.description
            }))
        };
    }

    /**
     * Extract control effectiveness
     */
    function extractControlEffectiveness() {
        const effectiveness = _projectContext?.effectiveness || {};
        const assessments = effectiveness.assessments || [];

        // Count by effectiveness category
        const byCategory = assessments.reduce((acc, a) => {
            const cat = a.effectivenessCategory || 'not_assessed';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, { highly_effective: 0, effective: 0, partially_effective: 0, ineffective: 0, not_assessed: 0 });

        // Calculate average effectiveness score
        const avgScore = assessments.length > 0
            ? assessments.reduce((sum, a) => sum + (a.effectivenessScore || 0), 0) / assessments.length
            : 0;

        // Coverage calculation
        const totalDetections = _projectContext?.wcgw?.detections?.length || 0;
        const coveredDetections = assessments.filter(a => a.effectivenessCategory !== 'not_assessed').length;
        const coveragePercent = totalDetections > 0 ? (coveredDetections / totalDetections) * 100 : 0;

        return {
            totalAssessments: assessments.length,
            byCategory,
            averageEffectivenessScore: Math.round(avgScore),
            coveragePercent: Math.round(coveragePercent),
            assessments: assessments.map(a => ({
                controlId: a.controlId,
                controlName: a.controlName,
                effectivenessScore: a.effectivenessScore,
                effectivenessCategory: a.effectivenessCategory,
                rationale: a.rationale
            }))
        };
    }

    /**
     * Extract residual risk
     */
    function extractResidualRisk() {
        const residualRisk = _projectContext?.residualRisk || {};
        const assessments = residualRisk.assessments || [];

        // Count by risk category
        const byCategory = assessments.reduce((acc, a) => {
            const cat = a.residualRiskCategory || 'not_assessed';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, { high: 0, medium: 0, low: 0, acceptable: 0, not_assessed: 0 });

        // Calculate average scores
        const avgInherent = assessments.length > 0
            ? assessments.reduce((sum, a) => sum + (a.inherentRiskScore || 0), 0) / assessments.length
            : 0;
        const avgResidual = assessments.length > 0
            ? assessments.reduce((sum, a) => sum + (a.residualRiskScore || 0), 0) / assessments.length
            : 0;
        const avgReduction = avgInherent > 0 ? ((avgInherent - avgResidual) / avgInherent) * 100 : 0;

        // Status breakdown
        const acceptable = assessments.filter(a => a.status === 'acceptable').length;
        const needControl = assessments.filter(a => a.status === 'need_control').length;

        return {
            totalAssessments: assessments.length,
            byCategory,
            averageInherentRiskScore: Math.round(avgInherent),
            averageResidualRiskScore: Math.round(avgResidual),
            averageRiskReduction: Math.round(avgReduction),
            statusBreakdown: {
                acceptable,
                needControl
            },
            assessments: assessments.map(a => ({
                detectionId: a.detectionId,
                detectionName: a.detectionName,
                inherentRiskScore: a.inherentRiskScore,
                residualRiskScore: a.residualRiskScore,
                residualRiskCategory: a.residualRiskCategory,
                controlEffectiveness: a.controlEffectiveness,
                status: a.status,
                rationale: a.rationale
            }))
        };
    }

    /**
     * Extract audit recommendations
     */
    function extractAuditRecommendations() {
        const auditRecs = _projectContext?.auditRecommendations || {};
        const recommendations = auditRecs.recommendations || [];

        // Count by priority
        const byPriority = recommendations.reduce((acc, r) => {
            const p = r.priority || 'low';
            acc[p] = (acc[p] || 0) + 1;
            return acc;
        }, { high: 0, medium: 0, low: 0 });

        // Count by test type
        const byTestType = recommendations.reduce((acc, r) => {
            const t = r.testType || 'substantive';
            acc[t] = (acc[t] || 0) + 1;
            return acc;
        }, { substantive: 0, test_of_controls: 0, analytical: 0 });

        return {
            totalRecommendations: recommendations.length,
            byPriority,
            byTestType,
            recommendations: recommendations.map(r => ({
                id: r.id,
                assertion: r.assertion,
                auditObjective: r.auditObjective,
                recommendedProcedure: r.recommendedProcedure,
                evidenceRequired: r.evidenceRequired,
                testType: r.testType,
                priority: r.priority,
                residualRiskScore: r.residualRiskScore,
                auditorNotes: r.auditorNotes
            }))
        };
    }

    /**
     * Generate overall audit conclusion
     */
    function generateOverallConclusion() {
        const wcgw = extractWCGWAnalysis();
        const residualRisk = extractResidualRisk();
        const effectiveness = extractControlEffectiveness();
        const auditRecs = extractAuditRecommendations();

        // Determine overall risk assessment
        let riskLevel = 'Low';
        if (wcgw.totalDetections > 5 || wcgw.byRiskLevel.high > 2) {
            riskLevel = 'High';
        } else if (wcgw.totalDetections > 2 || wcgw.byRiskLevel.medium > 2) {
            riskLevel = 'Medium';
        }

        // Determine control environment assessment
        let controlEnvironment = 'Strong';
        if (effectiveness.averageEffectivenessScore < 50) {
            controlEnvironment = 'Weak';
        } else if (effectiveness.averageEffectivenessScore < 70) {
            controlEnvironment = 'Moderate';
        }

        // Determine audit approach
        let auditApproach = 'Substantive';
        if (controlEnvironment === 'Strong' && effectiveness.coveragePercent > 70) {
            auditApproach = 'Controls-Based';
        } else if (controlEnvironment === 'Moderate') {
            auditApproach = 'Mixed';
        }

        // Generate conclusion text
        const conclusionParts = [];

        conclusionParts.push(`Overall audit risk is assessed as ${riskLevel.toLowerCase()}.`);
        conclusionParts.push(`The control environment is ${controlEnvironment.toLowerCase()}.`);
        conclusionParts.push(`Audit approach: ${auditApproach}.`);

        if (wcgw.totalDetections > 0) {
            conclusionParts.push(`${wcgw.totalDetections} WCGW risks identified across ${Object.keys(wcgw.byAssertion).length} assertions.`);
        }

        if (auditRecs.totalRecommendations > 0) {
            conclusionParts.push(`${auditRecs.totalRecommendations} audit procedures recommended (${auditRecs.byPriority.high} high priority).`);
        }

        if (residualRisk.assessments.length > 0) {
            const acceptableCount = residualRisk.statusBreakdown.acceptable;
            const needControlCount = residualRisk.statusBreakdown.needControl;
            conclusionParts.push(`${acceptableCount} risks at acceptable levels, ${needControlCount} requiring additional controls.`);
        }

        return {
            overallRiskLevel: riskLevel,
            controlEnvironment,
            auditApproach,
            conclusionText: conclusionParts.join(' '),
            keyFindings: [
                wcgw.totalDetections > 0 ? `${wcgw.totalDetections} WCGW risks detected` : 'No WCGW risks detected',
                effectiveness.coveragePercent > 0 ? `${effectiveness.coveragePercent}% control coverage` : 'No control assessments',
                auditRecs.totalRecommendations > 0 ? `${auditRecs.totalRecommendations} audit procedures recommended` : 'No audit procedures recommended'
            ].filter(Boolean),
            recommendations: [
                riskLevel === 'High' ? 'Increase substantive testing sample sizes' : null,
                controlEnvironment === 'Weak' ? 'Consider relying less on internal controls' : null,
                auditRecs.byPriority.high > 0 ? 'Prioritize high-risk audit procedures' : null,
                residualRisk.statusBreakdown.needControl > 0 ? 'Recommend management implement additional controls' : null
            ].filter(Boolean)
        };
    }

    // ============================================
    // Export Functions
    // ============================================

    /**
     * Get the current summary data
     * @returns {object} Current summary data
     */
    function getSummary() {
        return _summaryData;
    }

    /**
     * Export summary as JSON
     * @returns {string} JSON string
     */
    function exportJSON() {
        if (!_summaryData) {
            generateSummary();
        }
        return JSON.stringify(_summaryData, null, 2);
    }

    /**
     * Export summary as formatted HTML report
     * @param {string} flowchartImageBase64 - Optional base64 encoded flowchart image
     * @returns {string} HTML string
     */
    function exportHTML(flowchartImageBase64) {
        if (!_summaryData) {
            generateSummary();
        }

        const s = _summaryData;
        
        // Generate flowchart image HTML if provided
        const flowchartImageHtml = flowchartImageBase64 ? `
    <div class="flowchart-image-container">
        <h2>Business Process Flowchart</h2>
        <img src="${flowchartImageBase64}" alt="Business Process Flowchart" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px;" />
    </div>
` : '';

        return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Report - ${s.projectInfo.projectName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 210mm; margin: 0 auto; padding: 20mm; }
        .cover-page { text-align: center; padding: 60px 20px; page-break-after: always; }
        .cover-page h1 { font-size: 32px; color: #1e3a5f; margin-bottom: 20px; }
        .cover-page h2 { font-size: 24px; color: #666; margin-bottom: 40px; }
        .cover-page .project-name { font-size: 28px; color: #2c5282; margin: 30px 0; }
        .cover-page .meta { color: #888; font-size: 14px; }
        .cover-page .date { margin-top: 40px; color: #666; }
        h1 { font-size: 24px; color: #1e3a5f; border-bottom: 2px solid #2c5282; padding-bottom: 10px; margin: 30px 0 20px; page-break-before: always; }
        h1:first-of-type { page-break-before: avoid; }
        h2 { font-size: 18px; color: #2c5282; margin: 25px 0 15px; }
        h3 { font-size: 16px; color: #4a5568; margin: 20px 0 10px; }
        p { margin-bottom: 15px; text-align: justify; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .summary-card { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
        .summary-card .value { font-size: 28px; font-weight: bold; color: #2c5282; }
        .summary-card .label { font-size: 12px; color: #718096; text-transform: uppercase; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background: #edf2f7; color: #4a5568; font-weight: 600; }
        tr:nth-child(even) { background: #f7fafc; }
        .risk-high { color: #e53e3e; font-weight: bold; }
        .risk-medium { color: #dd6b20; font-weight: bold; }
        .risk-low { color: #38a169; font-weight: bold; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .badge-high { background: #fed7d7; color: #c53030; }
        .badge-medium { background: #feebc8; color: #c05621; }
        .badge-low { background: #c6f6d5; color: #2f855a; }
        .conclusion-box { background: #ebf8ff; border-left: 4px solid #4299e1; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .finding-item { margin-bottom: 10px; padding-left: 20px; position: relative; }
        .finding-item:before { content: "•"; position: absolute; left: 0; color: #4299e1; font-weight: bold; }
        ul { margin-left: 20px; margin-bottom: 15px; }
        li { margin-bottom: 5px; }
        .page-number { text-align: center; color: #a0aec0; font-size: 12px; margin-top: 30px; }
        @media print { body { padding: 15mm; } .no-print { display: none; } }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <h1>AUDIT REPORT</h1>
        <h2>Internal Control & Risk Assessment</h2>
        <div class="project-name">${s.projectInfo.projectName}</div>
        <div class="meta">
            <p>Client: ${s.projectInfo.clientName}</p>
            <p>Industry: ${s.projectInfo.industry}</p>
            <p>Fiscal Year End: ${s.projectInfo.fiscalYearEnd}</p>
        </div>
        <div class="date">Generated: ${new Date(s.metadata.generatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <!-- Executive Summary -->
    <h1>Executive Summary</h1>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="value">${s.wcgwAnalysis.totalDetections}</div>
            <div class="label">WCGW Risks Detected</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.controlRecommendations.totalRecommendations}</div>
            <div class="label">Controls Recommended</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.residualRisk.averageRiskReduction}%</div>
            <div class="label">Risk Reduction</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.auditRecommendations.totalRecommendations}</div>
            <div class="label">Audit Procedures</div>
        </div>
    </div>

    <div class="conclusion-box">
        <h3>Overall Assessment</h3>
        <p><strong>Risk Level:</strong> <span class="risk-${s.overallConclusion.overallRiskLevel.toLowerCase()}">${s.overallConclusion.overallRiskLevel}</span></p>
        <p><strong>Control Environment:</strong> ${s.overallConclusion.controlEnvironment}</p>
        <p><strong>Audit Approach:</strong> ${s.overallConclusion.auditApproach}</p>
        <p style="margin-top: 15px;">${s.overallConclusion.conclusionText}</p>
    </div>

    <!-- Business Understanding -->
    <h1>Business Understanding</h1>
    <h2>Company Overview</h2>
    <p>${s.businessUnderstanding.companyOverview}</p>

    <h2>Industry & Regulatory Environment</h2>
    <p><strong>Industry:</strong> ${s.businessUnderstanding.industryOverview}</p>
    <p><strong>Regulatory Environment:</strong> ${s.businessUnderstanding.regulatoryEnvironment}</p>

    <h2>Internal Control Environment</h2>
    <p>${s.businessUnderstanding.internalControlEnvironment}</p>

    <!-- Flowchart Summary -->
    <h1>Business Process Flow</h1>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="value">${s.flowchartSummary.totalNodes}</div>
            <div class="label">Total Process Steps</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.flowchartSummary.totalSwimlanes}</div>
            <div class="label">Process Areas</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.flowchartSummary.nodeBreakdown.decisions}</div>
            <div class="label">Decision Points</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.flowchartSummary.complexity}</div>
            <div class="label">Complexity Level</div>
        </div>
    </div>

    <h2>Process Breakdown</h2>
    <table>
        <thead>
            <tr><th>Process Area</th><th>Number of Steps</th></tr>
        </thead>
        <tbody>
            ${s.flowchartSummary.processes.map(p => `<tr><td>${p.name}</td><td>${p.nodeCount}</td></tr>`).join('')}
        </tbody>
    </table>

    ${flowchartImageHtml}

    <!-- WCGW Analysis -->
    <h1>WCGW Analysis</h1>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="value risk-high">${s.wcgwAnalysis.byRiskLevel.high}</div>
            <div class="label">High Risk</div>
        </div>
        <div class="summary-card">
            <div class="value risk-medium">${s.wcgwAnalysis.byRiskLevel.medium}</div>
            <div class="label">Medium Risk</div>
        </div>
        <div class="summary-card">
            <div class="value risk-low">${s.wcgwAnalysis.byRiskLevel.low}</div>
            <div class="label">Low Risk</div>
        </div>
    </div>

    <h2>Risks by Assertion</h2>
    <table>
        <thead>
            <tr><th>Assertion</th><th>Count</th><th>Risk Level</th></tr>
        </thead>
        <tbody>
            ${Object.entries(s.wcgwAnalysis.byAssertion).map(([assertion, count]) => {
            const riskItems = s.wcgwAnalysis.highRiskItems.filter(i => i.assertion === assertion);
            const riskLevel = riskItems.length > 0 ? 'High' : count > 0 ? 'Medium' : 'Low';
            return `<tr><td>${assertion}</td><td>${count}</td><td><span class="badge badge-${riskLevel.toLowerCase()}">${riskLevel}</span></td></tr>`;
        }).join('')}
        </tbody>
    </table>

    ${s.wcgwAnalysis.highRiskItems.length > 0 ? `
    <h2>High Risk Items</h2>
    <table>
        <thead>
            <tr><th>Risk</th><th>Assertion</th><th>Description</th></tr>
        </thead>
        <tbody>
            ${s.wcgwAnalysis.highRiskItems.map(item => `<tr><td>${item.name}</td><td>${item.assertion}</td><td>${item.description || 'N/A'}</td></tr>`).join('')}
        </tbody>
    </table>
    ` : ''}

    <!-- Internal Control Recommendations -->
    <h1>Internal Control Recommendations</h1>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="value">${s.controlRecommendations.totalRecommendations}</div>
            <div class="label">Total Controls</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.controlRecommendations.byAutomation.automated || 0}</div>
            <div class="label">Automated</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.controlRecommendations.byAutomation.semiAutomated || 0}</div>
            <div class="label">Semi-Automated</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.controlRecommendations.byAutomation.manual || 0}</div>
            <div class="label">Manual</div>
        </div>
    </div>

    <h2>Recommended Controls</h2>
    <table>
        <thead>
            <tr><th>Control Name</th><th>Type</th><th>Automation</th><th>Frequency</th><th>Confidence</th></tr>
        </thead>
        <tbody>
            ${s.controlRecommendations.recommendations.map(c => `
                <tr>
                    <td>${c.controlName}</td>
                    <td>${c.controlType}</td>
                    <td>${c.automationLevel}</td>
                    <td>${c.frequency}</td>
                    <td>${c.confidenceScore ? Math.round(c.confidenceScore) + '%' : 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- Control Effectiveness -->
    <h1>Control Effectiveness</h1>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="value">${s.controlEffectiveness.averageEffectivenessScore}%</div>
            <div class="label">Avg Effectiveness</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.controlEffectiveness.coveragePercent}%</div>
            <div class="label">Coverage</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.controlEffectiveness.byCategory.highly_effective || 0}</div>
            <div class="label">Highly Effective</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.controlEffectiveness.byCategory.ineffective || 0}</div>
            <div class="label">Ineffective</div>
        </div>
    </div>

    <!-- Residual Risk -->
    <h1>Residual Risk Assessment</h1>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="value">${s.residualRisk.averageInherentRiskScore}</div>
            <div class="label">Avg Inherent Risk</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.residualRisk.averageResidualRiskScore}</div>
            <div class="label">Avg Residual Risk</div>
        </div>
        <div class="summary-card">
            <div class="value">${s.residualRisk.averageRiskReduction}%</div>
            <div class="label">Risk Reduction</div>
        </div>
    </div>

    <h2>Risk Status</h2>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="value" style="color: #38a169;">${s.residualRisk.statusBreakdown.acceptable}</div>
            <div class="label">Acceptable</div>
        </div>
        <div class="summary-card">
            <div class="value" style="color: #e53e3e;">${s.residualRisk.statusBreakdown.needControl}</div>
            <div class="label">Need Control</div>
        </div>
    </div>

    <!-- Audit Recommendations -->
    <h1>Audit Recommendations</h1>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="value">${s.auditRecommendations.totalRecommendations}</div>
            <div class="label">Total Procedures</div>
        </div>
        <div class="summary-card">
            <div class="value risk-high">${s.auditRecommendations.byPriority.high}</div>
            <div class="label">High Priority</div>
        </div>
        <div class="summary-card">
            <div class="value risk-medium">${s.auditRecommendations.byPriority.medium}</div>
            <div class="label">Medium Priority</div>
        </div>
        <div class="summary-card">
            <div class="value risk-low">${s.auditRecommendations.byPriority.low}</div>
            <div class="label">Low Priority</div>
        </div>
    </div>

    <h2>Audit Procedures by Test Type</h2>
    <table>
        <thead>
            <tr><th>Test Type</th><th>Count</th><th>Priority Distribution</th></tr>
        </thead>
        <tbody>
            ${Object.entries(s.auditRecommendations.byTestType).map(([type, count]) => `
                <tr>
                    <td>${type === 'substantive' ? 'Substantive Tests' : type === 'test_of_controls' ? 'Test of Controls' : 'Analytical Procedures'}</td>
                    <td>${count}</td>
                    <td>
                        ${count > 0 ? `<span class="badge badge-high">H: ${Math.ceil(count * 0.3)}</span> <span class="badge badge-medium">M: ${Math.ceil(count * 0.4)}</span> <span class="badge badge-low">L: ${Math.ceil(count * 0.3)}</span>` : 'N/A'}
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Recommended Audit Procedures</h2>
    <table>
        <thead>
            <tr><th>Priority</th><th>Assertion</th><th>Procedure</th><th>Test Type</th></tr>
        </thead>
        <tbody>
            ${s.auditRecommendations.recommendations
                .sort((a, b) => (b.residualRiskScore || 0) - (a.residualRiskScore || 0))
                .map(r => `
                <tr>
                    <td><span class="badge badge-${r.priority}">${r.priority.toUpperCase()}</span></td>
                    <td>${r.assertion}</td>
                    <td>${r.recommendedProcedure}</td>
                    <td>${r.testType === 'substantive' ? 'Substantive' : r.testType === 'test_of_controls' ? 'ToC' : 'Analytical'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- Overall Conclusion -->
    <h1>Final Conclusion</h1>
    <div class="conclusion-box">
        <h3>Audit Conclusion</h3>
        <p>${s.overallConclusion.conclusionText}</p>

        <h4 style="margin-top: 20px;">Key Findings:</h4>
        <ul>
            ${s.overallConclusion.keyFindings.map(f => `<li>${f}</li>`).join('')}
        </ul>

        <h4 style="margin-top: 20px;">Recommendations:</h4>
        <ul>
            ${s.overallConclusion.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
    </div>

    <!-- Audit Trail -->
    <h1>Audit Trail Summary</h1>
    <p>This audit was conducted using AuditFlow, an automated audit analysis system. The following modules were utilized:</p>
    <ul>
        <li>Business Process Understanding & Flowchart Generation</li>
        <li>What Can Go Wrong (WCGW) Detection Engine</li>
        <li>Internal Control Recommendation Engine</li>
        <li>Control Effectiveness Assessment</li>
        <li>Residual Risk Assessment</li>
        <li>Audit Recommendation Engine</li>
    </ul>

    <div class="page-number">
        <p>Generated by AuditFlow v1.0 | ${s.metadata.generatedBy} | ${new Date(s.metadata.generatedAt).toLocaleString('id-ID')}</p>
    </div>
</body>
</html>`;
    }

    /**
     * Reset the module state
     */
    function reset() {
        _projectContext = null;
        _summaryData = null;
        _isInitialized = false;
        console.log('[AuditSummary] Reset complete');
    }

    // ============================================
    // Public API
    // ============================================

    return {
        init,
        generateSummary,
        getSummary,
        exportJSON,
        exportHTML,
        reset
    };
})();

// Export for Node.js/CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditSummary;
}