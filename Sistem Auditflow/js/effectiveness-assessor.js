/**
 * AuditFlow Control Effectiveness Assessment Engine - Phase 6B
 * 
 * Reads control recommendations from Phase 6A and allows auditors to:
 * - Select controls to implement
 * - Assign effectiveness scores (0-100)
 * - Group effectiveness into High/Medium/Low categories
 * - Calculate control coverage based on selected controls
 * 
 * Key Features:
 * - Effectiveness scoring with validation
 * - Coverage calculation
 * - Audit Trail integration
 * - Structured output for Phase 6C consumption
 * 
 * Dependencies:
 * - ControlRecommender (js/control-recommender.js)
 * - AuditTrail (js/audit-trail.js)
 * - KnowledgeBase (data/knowledgeBase.js)
 * 
 * No direct DOM manipulation - pure business logic module.
 */

const EffectivenessAssessor = (function() {
    // Private state
    let _assessments = [];
    let _projectContext = null;
    let _selectedControls = [];
    
    // Effectiveness thresholds
    const EFFECTIVENESS_THRESHOLDS = {
        HIGH: 70,
        MEDIUM: 40,
        LOW: 0
    };
    
    /**
     * Initialize module with project context
     * @param {Object} projectContext - Project context object
     */
    function init(projectContext) {
        _projectContext = projectContext;
        _assessments = [];
        _selectedControls = [];
        console.log('[EffectivenessAssessor] Initialized with project:', projectContext?.name);
    }
    
    /**
     * Get effectiveness category based on score
     * @param {number} score - Effectiveness score (0-100)
     * @returns {string} Category: 'high', 'medium', or 'low'
     */
    function getEffectivenessCategory(score) {
        if (score >= EFFECTIVENESS_THRESHOLDS.HIGH) {
            return 'high';
        } else if (score >= EFFECTIVENESS_THRESHOLDS.MEDIUM) {
            return 'medium';
        } else {
            return 'low';
        }
    }
    
    /**
     * Get effectiveness label for display
     * @param {string} category - Category code
     * @returns {string} Human-readable label
     */
    function getEffectivenessLabel(category) {
        const labels = {
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low'
        };
        return labels[category] || category;
    }
    
    /**
     * Assess control effectiveness
     * @param {Object} control - Control recommendation from Phase 6A
     * @param {number} effectivenessScore - Score assigned by auditor (0-100)
     * @param {string} rationale - Auditor's rationale for the score
     * @returns {Object} Assessment result
     */
    function assessControl(control, effectivenessScore, rationale = '') {
        // Validate score
        if (effectivenessScore < 0 || effectivenessScore > 100) {
            console.error('[EffectivenessAssessor] Invalid effectiveness score:', effectivenessScore);
            return null;
        }
        
        const category = getEffectivenessCategory(effectivenessScore);
        
        const assessment = {
            id: `ASSESS-${String(_assessments.length + 1).padStart(3, '0')}`,
            controlId: control.controlId || control.id,
            controlName: control.name,
            category: control.category,
            effectivenessScore: effectivenessScore,
            effectivenessCategory: category,
            effectivenessLabel: getEffectivenessLabel(category),
            rationale: rationale,
            originalScore: control.score,
            originalConfidence: control.confidence,
            assessedAt: new Date().toISOString(),
            assessedBy: 'auditor', // Would be actual user in production
            metadata: {
                automation: control.automation || 'manual',
                frequency: control.frequency || 'periodic',
                assertions: control.assertions || control.matchedAssertions || []
            }
        };
        
        _assessments.push(assessment);
        _selectedControls.push(control.controlId || control.id);
        
        console.log('[EffectivenessAssessor] Assessed control:', control.name, 'Score:', effectivenessScore, 'Category:', category);
        
        return assessment;
    }
    
    /**
     * Batch assess multiple controls
     * @param {Array} controls - Array of control recommendations
     * @param {Array} assessments - Array of {controlId, score, rationale} objects
     * @returns {Array} Array of assessment results
     */
    function batchAssess(controls, assessments) {
        const results = [];
        
        assessments.forEach(assessmentData => {
            const control = controls.find(c => 
                (c.controlId === assessmentData.controlId) || (c.id === assessmentData.controlId)
            );
            
            if (control) {
                const result = assessControl(control, assessmentData.score, assessmentData.rationale);
                if (result) {
                    results.push(result);
                }
            } else {
                console.warn('[EffectivenessAssessor] Control not found:', assessmentData.controlId);
            }
        });
        
        return results;
    }
    
    /**
     * Calculate control coverage based on selected controls
     * @param {Array} allDetections - All WCGW detections
     * @returns {Object} Coverage statistics
     */
    function calculateCoverage(allDetections) {
        if (!allDetections || allDetections.length === 0) {
            return {
                totalDetections: 0,
                coveredDetections: 0,
                coveragePercentage: 0,
                byRiskLevel: {},
                byAssertion: {}
            };
        }
        
        const coveredDetections = new Set();
        const byRiskLevel = { high: 0, medium: 0, low: 0 };
        const byAssertion = {};
        
        // Track which detections are covered by selected controls
        _assessments.forEach(assessment => {
            allDetections.forEach(detection => {
                const detectionControlIds = detection.recommendedControls?.map(c => c.id) || [];
                if (detectionControlIds.includes(assessment.controlId)) {
                    coveredDetections.add(detection.id);
                    
                    // Track by risk level
                    const riskLevel = detection.riskLevel || 'medium';
                    byRiskLevel[riskLevel] = (byRiskLevel[riskLevel] || 0) + 1;
                    
                    // Track by assertion
                    const assertion = detection.assertion || 'unknown';
                    byAssertion[assertion] = (byAssertion[assertion] || 0) + 1;
                }
            });
        });
        
        const totalDetections = allDetections.length;
        const coveredCount = coveredDetections.size;
        const coveragePercentage = totalDetections > 0 ? Math.round((coveredCount / totalDetections) * 100) : 0;
        
        return {
            totalDetections,
            coveredDetections: coveredCount,
            coveragePercentage,
            byRiskLevel,
            byAssertion,
            uncoveredDetections: totalDetections - coveredCount
        };
    }
    
    /**
     * Get all assessments
     * @returns {Array} Array of assessment objects
     */
    function getAssessments() {
        return _assessments;
    }
    
    /**
     * Get assessments by effectiveness category
     * @param {string} category - 'high', 'medium', or 'low'
     * @returns {Array} Filtered assessments
     */
    function getAssessmentsByCategory(category) {
        return _assessments.filter(a => a.effectivenessCategory === category);
    }
    
    /**
     * Get summary statistics
     * @returns {Object} Summary statistics
     */
    function getSummary() {
        const totalAssessments = _assessments.length;
        const highEffectiveness = _assessments.filter(a => a.effectivenessCategory === 'high').length;
        const mediumEffectiveness = _assessments.filter(a => a.effectivenessCategory === 'medium').length;
        const lowEffectiveness = _assessments.filter(a => a.effectivenessCategory === 'low').length;
        
        const avgScore = totalAssessments > 0 
            ? Math.round(_assessments.reduce((sum, a) => sum + a.effectivenessScore, 0) / totalAssessments)
            : 0;
        
        return {
            totalAssessments,
            byCategory: {
                high: highEffectiveness,
                medium: mediumEffectiveness,
                low: lowEffectiveness
            },
            averageScore: avgScore,
            selectedControlIds: _selectedControls
        };
    }
    
    /**
     * Get assessment for a specific control
     * @param {string} controlId - Control ID
     * @returns {Object|null} Assessment or null if not found
     */
    function getAssessmentByControl(controlId) {
        return _assessments.find(a => a.controlId === controlId) || null;
    }
    
    /**
     * Check if a control has been assessed
     * @param {string} controlId - Control ID
     * @returns {boolean} True if assessed
     */
    function isAssessed(controlId) {
        return _assessments.some(a => a.controlId === controlId);
    }
    
    /**
     * Clear all assessments
     */
    function clearAssessments() {
        _assessments = [];
        _selectedControls = [];
        console.log('[EffectivenessAssessor] All assessments cleared');
    }
    
    /**
     * Export assessment data
     * @param {string} format - Export format ('json' only for now)
     * @returns {Object} Export data
     */
    function exportData(format = 'json') {
        const summary = getSummary();
        
        const exportObj = {
            projectId: _projectContext?.id,
            projectName: _projectContext?.name,
            exportedAt: new Date().toISOString(),
            format: format,
            summary: summary,
            assessments: _assessments.map(a => ({
                id: a.id,
                controlId: a.controlId,
                controlName: a.controlName,
                category: a.category,
                effectivenessScore: a.effectivenessScore,
                effectivenessCategory: a.effectivenessCategory,
                effectivenessLabel: a.effectivenessLabel,
                rationale: a.rationale,
                originalScore: a.originalScore,
                originalConfidence: a.originalConfidence,
                assessedAt: a.assessedAt,
                assessedBy: a.assessedBy,
                metadata: a.metadata
            })),
            thresholds: EFFECTIVENESS_THRESHOLDS
        };
        
        if (format === 'json') {
            return exportObj;
        }
        
        return exportObj;
    }
    
    /**
     * Reset module state
     */
    function reset() {
        _assessments = [];
        _selectedControls = [];
        _projectContext = null;
        console.log('[EffectivenessAssessor] Module reset');
    }
    
    // Public API
    return {
        init,
        assessControl,
        batchAssess,
        calculateCoverage,
        getAssessments,
        getAssessmentsByCategory,
        getSummary,
        getAssessmentByControl,
        isAssessed,
        clearAssessments,
        exportData,
        reset,
        getEffectivenessCategory,
        getEffectivenessLabel,
        getThresholds: () => ({ ...EFFECTIVENESS_THRESHOLDS })
    };
})();