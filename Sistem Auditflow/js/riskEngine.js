/**
 * AuditFlow Risk Engine
 * 
 * Data-driven rule engine for WCGW (What Can Go Wrong) detection.
 * Reads rules from Knowledge Base and evaluates flowchart processes
 * to identify potential risks.
 * 
 * MVP Scope:
 * - Existence-only matching (checks if processes exist/not exist)
 * - No sequence order validation
 * - No swimlane validation
 * 
 * Features:
 * - Fuzzy text matching for process detection
 * - Manual override capabilities
 * - Detection statistics
 * - Export-ready data structure
 */

const RiskEngine = (function () {
    // Private state
    let _detections = [];
    let _projectContext = null;
    let _flowchartData = null;
    let _manualOverrides = {};

    /**
     * Normalize assertion name to lowercase-dash format
     * Safety net to ensure consistency even if source data uses different format
     * Examples: 'Occurrence' -> 'occurrence', 'Rights and Obligations' -> 'rights-and-obligations'
     */
    function normalizeAssertion(assertion) {
        if (!assertion || typeof assertion !== 'string') return assertion;

        return assertion
            .toLowerCase()
            .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
            .replace(/-+/g, '-')       // Collapse multiple hyphens
            .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
    }

    /**
     * Initialize engine with project context
     */
    function init(projectContext, flowchartData) {
        _projectContext = projectContext;
        _flowchartData = flowchartData;
        _detections = [];
        _manualOverrides = {};

        console.log('[RiskEngine] Initialized with project:', projectContext?.name);
        console.log('[RiskEngine] Flowchart nodes:', flowchartData?.nodes?.length || 0);
    }

    /**
     * Extract all process names from flowchart
     * Handles both swimlane and non-swimlane structures
     */
    function extractProcesses(flowchart) {
        const processes = [];

        if (!flowchart || !flowchart.nodes) {
            console.log('[RiskEngine.extractProcesses] No nodes found in flowchart');
            return processes;
        }

        console.log('[RiskEngine.extractProcesses] Processing', flowchart.nodes.length, 'nodes');

        flowchart.nodes.forEach(node => {
            // Skip swimlane containers
            if (node.type === 'swimlane') return;

            // Extract process name from node (check multiple field names)
            const processName = (node.label || node.name || node.text || '').toLowerCase().trim();
            if (processName) {
                processes.push({
                    id: node.id,
                    name: processName,
                    originalLabel: node.label || node.name,
                    swimlane: node.swimlane || null,
                    x: node.x,
                    y: node.y
                });
            }
        });

        return processes;
    }

    /**
     * Fuzzy match a process name against keywords
     * Returns match score between 0-1
     */
    function fuzzyMatch(processName, keywords) {
        if (!processName || !keywords || keywords.length === 0) return 0;

        const name = processName.toLowerCase();
        let maxScore = 0;

        keywords.forEach(keyword => {
            const kw = keyword.toLowerCase();

            // Exact match
            if (name === kw) {
                maxScore = Math.max(maxScore, 1.0);
                return;
            }

            // Contains match
            if (name.includes(kw) || kw.includes(name)) {
                maxScore = Math.max(maxScore, 0.8);
                return;
            }

            // Partial word match
            const nameWords = name.split(/[\s_-]+/);
            const keywordWords = kw.split(/[\s_-]+/);

            let matchCount = 0;
            keywordWords.forEach(kwWord => {
                if (nameWords.some(nw => nw.includes(kwWord) || kwWord.includes(nw))) {
                    matchCount++;
                }
            });

            if (matchCount > 0) {
                const partialScore = matchCount / keywordWords.length;
                maxScore = Math.max(maxScore, partialScore * 0.7);
            }
        });

        return maxScore;
    }

    /**
     * Check if any process matches the given keywords
     * Returns matching process or null
     */
    function findMatchingProcess(processes, keywords) {
        for (const process of processes) {
            const score = fuzzyMatch(process.name, keywords);
            if (score >= 0.6) { // Threshold for fuzzy match
                return { process, score };
            }
        }
        return null;
    }

    /**
     * Evaluate a single rule
     * MVP: Only checks existence, not sequence or swimlane
     */
    function evaluateRule(rule, processes) {
        const result = {
            ruleId: rule.id,
            ruleName: rule.name,
            assertion: rule.assertion,
            riskLevel: rule.riskLevel,
            triggered: false,
            triggerMatch: null,
            missingRequired: [],
            wcgwIds: rule.wcgwIds || [],
            recommendedControls: rule.recommendedControls || [],
            confidence: 0
        };

        // Check if trigger processes exist
        let triggerFound = false;
        let bestTriggerMatch = null;
        let bestTriggerScore = 0;

        for (const triggerKeyword of rule.triggerProcesses) {
            const keywords = KnowledgeBase.getProcessKeywords(triggerKeyword);
            if (keywords.length === 0) continue;

            const match = findMatchingProcess(processes, keywords);
            if (match && match.score > bestTriggerScore) {
                triggerFound = true;
                bestTriggerMatch = match.process;
                bestTriggerScore = match.score;
            }
        }

        if (!triggerFound) {
            return result; // Rule not applicable
        }

        result.triggered = true;
        result.triggerMatch = bestTriggerMatch;
        result.confidence = bestTriggerScore;

        // Check if required processes exist
        for (const requiredKeyword of rule.requiredProcesses) {
            const keywords = KnowledgeBase.getProcessKeywords(requiredKeyword);
            if (keywords.length === 0) continue;

            const match = findMatchingProcess(processes, keywords);
            if (!match) {
                result.missingRequired.push({
                    keyword: requiredKeyword,
                    keywords: keywords
                });
            }
        }

        // If required processes are missing, this is a WCGW detection
        if (result.missingRequired.length > 0) {
            result.hasWCGW = true;
            result.confidence = bestTriggerScore * (1 - (result.missingRequired.length * 0.1));
        } else {
            result.hasWCGW = false;
        }

        return result;
    }

    /**
     * Run detection on all rules
     */
    function runDetection() {
        if (!_flowchartData || !_projectContext) {
            console.error('[RiskEngine] Engine not initialized. Call init() first.');
            return [];
        }

        _detections = [];
        const processes = extractProcesses(_flowchartData);

        console.log(`[RiskEngine] Running detection on ${processes.length} processes`);
        console.log('[RiskEngine] Processes:', processes.map(p => p.originalLabel));

        // Evaluate all rules
        KnowledgeBase.rules.forEach(rule => {
            const result = evaluateRule(rule, processes);

            if (result.triggered && result.hasWCGW) {
                const detection = {
                    id: `det_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ruleId: result.ruleId,
                    ruleName: result.ruleName,
                    description: result.rule.description || rule.description,
                    assertion: normalizeAssertion(result.assertion),
                    assertionDetails: KnowledgeBase.getAssertion(result.assertion),
                    riskLevel: result.riskLevel,
                    riskDetails: KnowledgeBase.getRiskLevel(result.riskLevel),
                    confidence: Math.round(result.confidence * 100),
                    triggerProcess: result.triggerMatch?.originalLabel || null,
                    triggerNodeId: result.triggerMatch?.id || null,
                    missingControls: result.missingRequired.map(m => ({
                        keyword: m.keyword,
                        suggestedProcesses: m.keywords
                    })),
                    wcgw: result.wcgwIds.map(id => KnowledgeBase.getWCGW(id)).filter(Boolean),
                    recommendedControls: result.recommendedControls.map(id =>
                        KnowledgeBase.getControl(id)
                    ).filter(Boolean),
                    status: 'pending', // pending, accepted, rejected, mitigated
                    manualOverride: null,
                    createdAt: new Date().toISOString()
                };

                _detections.push(detection);
            }
        });

        console.log(`[RiskEngine] Detection complete. Found ${_detections.length} WCGW detections`);
        return _detections;
    }

    /**
     * Get all detections
     */
    function getDetections() {
        return _detections;
    }

    /**
     * Get detections filtered by risk level
     */
    function getDetectionsByRiskLevel(level) {
        return _detections.filter(d => d.riskLevel === level);
    }

    /**
     * Get detections filtered by assertion
     */
    function getDetectionsByAssertion(assertion) {
        return _detections.filter(d => d.assertion === assertion);
    }

    /**
     * Get detection by ID
     */
    function getDetectionById(detectionId) {
        return _detections.find(d => d.id === detectionId);
    }

    /**
     * Manual override - accept a detection
     */
    function acceptDetection(detectionId, notes = '') {
        const detection = getDetectionById(detectionId);
        if (!detection) return false;

        detection.status = 'accepted';
        detection.manualOverride = {
            action: 'accepted',
            notes: notes,
            timestamp: new Date().toISOString()
        };

        _manualOverrides[detectionId] = detection.manualOverride;
        console.log(`[RiskEngine] Detection ${detectionId} accepted`);
        return true;
    }

    /**
     * Manual override - reject a detection
     */
    function rejectDetection(detectionId, notes = '') {
        const detection = getDetectionById(detectionId);
        if (!detection) return false;

        detection.status = 'rejected';
        detection.manualOverride = {
            action: 'rejected',
            notes: notes,
            timestamp: new Date().toISOString()
        };

        _manualOverrides[detectionId] = detection.manualOverride;
        console.log(`[RiskEngine] Detection ${detectionId} rejected`);
        return true;
    }

    /**
     * Manual override - mark as mitigated
     */
    function mitigateDetection(detectionId, mitigationPlan = '') {
        const detection = getDetectionById(detectionId);
        if (!detection) return false;

        detection.status = 'mitigated';
        detection.manualOverride = {
            action: 'mitigated',
            mitigationPlan: mitigationPlan,
            timestamp: new Date().toISOString()
        };

        _manualOverrides[detectionId] = detection.manualOverride;
        console.log(`[RiskEngine] Detection ${detectionId} mitigated`);
        return true;
    }

    /**
     * Get statistics about detections
     */
    function getStatistics() {
        const total = _detections.length;
        const byRiskLevel = {
            high: _detections.filter(d => d.riskLevel === 'high').length,
            medium: _detections.filter(d => d.riskLevel === 'medium').length,
            low: _detections.filter(d => d.riskLevel === 'low').length
        };

        const byAssertion = {};
        _detections.forEach(d => {
            byAssertion[d.assertion] = (byAssertion[d.assertion] || 0) + 1;
        });

        const byStatus = {
            pending: _detections.filter(d => d.status === 'pending').length,
            accepted: _detections.filter(d => d.status === 'accepted').length,
            rejected: _detections.filter(d => d.status === 'rejected').length,
            mitigated: _detections.filter(d => d.status === 'mitigated').length
        };

        const avgConfidence = total > 0
            ? Math.round(_detections.reduce((sum, d) => sum + d.confidence, 0) / total)
            : 0;

        return {
            totalDetections: total,
            byRiskLevel,
            byAssertion,
            byStatus,
            avgConfidence,
            knowledgeBaseStats: KnowledgeBase.getStatistics(),
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get detections with node positions for visualization
     */
    function getDetectionsWithPositions() {
        return _detections.map(detection => ({
            ...detection,
            nodePosition: detection.triggerNodeId ? {
                nodeId: detection.triggerNodeId,
                node: _flowchartData?.nodes?.find(n => n.id === detection.triggerNodeId)
            } : null
        }));
    }

    /**
     * Export detections for report generation
     */
    function exportData(format = 'json') {
        const stats = getStatistics();
        const exportObj = {
            project: _projectContext,
            summary: stats,
            detections: _detections.map(d => ({
                id: d.id,
                ruleName: d.ruleName,
                description: d.description,
                assertion: d.assertion,
                riskLevel: d.riskLevel,
                confidence: d.confidence,
                triggerProcess: d.triggerProcess,
                wcgw: d.wcgw.map(w => ({
                    id: w.id,
                    name: w.name,
                    description: w.description
                })),
                status: d.status,
                manualOverride: d.manualOverride,
                recommendedControls: d.recommendedControls.map(c => ({
                    id: c.id,
                    name: c.name,
                    description: c.description
                }))
            })),
            generatedAt: new Date().toISOString()
        };

        if (format === 'json') {
            return JSON.stringify(exportObj, null, 2);
        }

        return exportObj;
    }

    /**
     * Reset engine state
     */
    function reset() {
        _detections = [];
        _projectContext = null;
        _flowchartData = null;
        _manualOverrides = {};
    }

    // Public API
    return {
        init,
        runDetection,
        getDetections,
        getDetectionsByRiskLevel,
        getDetectionsByAssertion,
        getDetectionById,
        acceptDetection,
        rejectDetection,
        mitigateDetection,
        getStatistics,
        getDetectionsWithPositions,
        exportData,
        reset
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RiskEngine;
}