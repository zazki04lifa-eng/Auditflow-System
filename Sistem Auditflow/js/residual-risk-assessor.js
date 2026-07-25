/**
 * AuditFlow Residual Risk Assessment Engine - Phase 6C
 * 
 * Calculates residual risk based on:
 * - Inherent risk from WCGW Detection
 * - Control effectiveness from Phase 6B
 * 
 * Formula: Residual Risk = Inherent Risk x (1 - Control Effectiveness)
 * 
 * Key Features:
 * - Residual risk calculation per detection
 * - Risk categorization (High/Medium/Low)
 * - Risk reduction percentage
 * - Status determination (Acceptable/Need Additional Control)
 * 
 * Dependencies:
 * - EffectivenessAssessor (js/effectiveness-assessor.js)
 * - AuditTrail (js/audit-trail.js)
 * 
 * No direct DOM manipulation - pure business logic module.
 */

const ResidualRiskAssessor = (function () {
    // Private state
    let _assessments = [];
    let _projectContext = null;

    // Risk score thresholds (0-100 scale)
    const RISK_THRESHOLDS = {
        HIGH: 60,
        MEDIUM: 30,
        LOW: 0
    };

    // Inherent risk scores based on risk level
    const INHERENT_RISK_SCORES = {
        'high': 90,
        'medium': 60,
        'low': 30
    };

    // Acceptable residual risk threshold
    const ACCEPTABLE_THRESHOLD = 40;

    /**
     * Initialize module with project context
     * @param {Object} projectContext - Project context object
     */
    function init(projectContext) {
        _projectContext = projectContext;
        _assessments = [];
        console.log('[ResidualRiskAssessor] Initialized with project:', projectContext?.name);
    }

    /**
     * Get risk category based on score
     * @param {number} score - Risk score (0-100)
     * @returns {string} Category: 'high', 'medium', or 'low'
     */
    function getRiskCategory(score) {
        if (score >= RISK_THRESHOLDS.HIGH) {
            return 'high';
        } else if (score >= RISK_THRESHOLDS.MEDIUM) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Get risk label for display
     * @param {string} category - Category code
     * @returns {string} Human-readable label
     */
    function getRiskLabel(category) {
        const labels = {
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low'
        };
        return labels[category] || category;
    }

    /**
     * Get inherent risk score from detection
     * @param {Object} detection - WCGW detection object
     * @returns {number} Inherent risk score (0-100)
     */
    function getInherentRiskScore(detection) {
        const riskLevel = detection.riskLevel || 'medium';
        return INHERENT_RISK_SCORES[riskLevel] || INHERENT_RISK_SCORES.medium;
    }

    /**
     * Calculate weighted average effectiveness for a detection
     * @param {Object} detection - WCGW detection object
     * @param {Array} assessments - Array of effectiveness assessments
     * @returns {number} Weighted effectiveness (0-1)
     */
    function calculateEffectiveControl(detection, assessments) {
        // Find assessments that cover this detection
        const relevantAssessments = assessments.filter(function (assessment) {
            // Check if the control's assertions match the detection's assertion
            const assertions = assessment.metadata?.assertions || [];
            return assertions.includes(detection.assertion);
        });

        if (relevantAssessments.length === 0) {
            return 0; // No effective controls
        }

        // Calculate weighted average effectiveness
        let totalEffectiveness = 0;
        relevantAssessments.forEach(function (assessment) {
            totalEffectiveness += assessment.effectivenessScore / 100;
        });

        // Cap at 0.9 (90%) - controls can't eliminate all risk
        return Math.min(totalEffectiveness / relevantAssessments.length, 0.9);
    }

    /**
     * Calculate residual risk for a detection
     * @param {Object} detection - WCGW detection object
     * @param {Array} assessments - Array of effectiveness assessments
     * @returns {Object} Residual risk assessment result
     */
    function calculateResidualRisk(detection, assessments) {
        const inherentRisk = getInherentRiskScore(detection);
        const controlEffectiveness = calculateEffectiveControl(detection, assessments);

        // Residual Risk = Inherent Risk x (1 - Control Effectiveness)
        const residualRiskScore = Math.round(inherentRisk * (1 - controlEffectiveness));
        const riskCategory = getRiskCategory(residualRiskScore);
        const riskReduction = Math.round(controlEffectiveness * 100);
        const status = residualRiskScore <= ACCEPTABLE_THRESHOLD ? 'Acceptable' : 'Need Additional Control';

        const assessment = {
            id: 'RESIDUAL-' + detection.id,
            detectionId: detection.id,
            detectionDescription: detection.description,
            assertion: detection.assertion,
            inherentRisk: {
                level: detection.riskLevel || 'medium',
                score: inherentRisk
            },
            controlEffectiveness: Math.round(controlEffectiveness * 100),
            residualRisk: {
                category: riskCategory,
                label: getRiskLabel(riskCategory),
                score: residualRiskScore
            },
            riskReduction: riskReduction,
            status: status,
            calculatedAt: new Date().toISOString(),
            calculatedBy: 'auditor'
        };

        _assessments.push(assessment);

        console.log('[ResidualRiskAssessor] Calculated residual risk for detection:', detection.id,
            'Residual Score:', residualRiskScore, 'Category:', riskCategory);

        return assessment;
    }

    /**
     * Calculate residual risk for all detections
     * @param {Array} detections - Array of WCGW detections
     * @returns {Array} Array of residual risk assessments
     */
    function assessAll(detections) {
        if (!detections || detections.length === 0) {
            console.log('[ResidualRiskAssessor] No detections provided');
            return [];
        }

        const assessments = getAssessments(); // Get effectiveness assessments
        const results = [];

        detections.forEach(function (detection) {
            const result = calculateResidualRisk(detection, assessments);
            results.push(result);
        });

        return results;
    }

    /**
     * Get all residual risk assessments
     * @returns {Array} Array of assessment objects
     */
    function getResidualAssessments() {
        return _assessments;
    }

    /**
     * Get effectiveness assessments (for internal use)
     * @returns {Array} Array of effectiveness assessments
     */
    function getAssessments() {
        if (typeof EffectivenessAssessor !== 'undefined') {
            return EffectivenessAssessor.getAssessments();
        }
        return [];
    }

    /**
     * Get summary statistics
     * @returns {Object} Summary statistics
     */
    function getSummary() {
        const totalAssessments = _assessments.length;
        const highRisk = _assessments.filter(function (a) { return a.residualRisk.category === 'high'; }).length;
        const mediumRisk = _assessments.filter(function (a) { return a.residualRisk.category === 'medium'; }).length;
        const lowRisk = _assessments.filter(function (a) { return a.residualRisk.category === 'low'; }).length;
        const acceptable = _assessments.filter(function (a) { return a.status === 'Acceptable'; }).length;
        const needControl = _assessments.filter(function (a) { return a.status === 'Need Additional Control'; }).length;

        const avgResidualScore = totalAssessments > 0
            ? Math.round(_assessments.reduce(function (sum, a) { return sum + a.residualRisk.score; }, 0) / totalAssessments)
            : 0;

        const avgRiskReduction = totalAssessments > 0
            ? Math.round(_assessments.reduce(function (sum, a) { return sum + a.riskReduction; }, 0) / totalAssessments)
            : 0;

        return {
            totalAssessments: totalAssessments,
            byRiskCategory: {
                high: highRisk,
                medium: mediumRisk,
                low: lowRisk
            },
            byStatus: {
                acceptable: acceptable,
                needAdditionalControl: needControl
            },
            averageResidualScore: avgResidualScore,
            averageRiskReduction: avgRiskReduction
        };
    }

    /**
     * Get assessment for a specific detection
     * @param {string} detectionId - Detection ID
     * @returns {Object|null} Assessment or null if not found
     */
    function getAssessmentByDetection(detectionId) {
        return _assessments.find(function (a) { return a.detectionId === detectionId; }) || null;
    }

    /**
     * Clear all assessments
     */
    function clearAssessments() {
        _assessments = [];
        console.log('[ResidualRiskAssessor] All assessments cleared');
    }

    /**
     * Export assessment data
     * @param {string} format - Export format ('json' only for now)
     * @returns {Object} Export data
     */
    function exportData(format) {
        if (!format) format = 'json';
        const summary = getSummary();

        const exportObj = {
            projectId: _projectContext?.id,
            projectName: _projectContext?.name,
            exportedAt: new Date().toISOString(),
            format: format,
            summary: summary,
            assessments: _assessments.map(function (a) {
                return {
                    id: a.id,
                    detectionId: a.detectionId,
                    detectionDescription: a.detectionDescription,
                    assertion: a.assertion,
                    inherentRisk: a.inherentRisk,
                    controlEffectiveness: a.controlEffectiveness,
                    residualRisk: a.residualRisk,
                    riskReduction: a.riskReduction,
                    status: a.status,
                    calculatedAt: a.calculatedAt,
                    calculatedBy: a.calculatedBy
                };
            }),
            thresholds: {
                risk: RISK_THRESHOLDS,
                acceptable: ACCEPTABLE_THRESHOLD
            }
        };

        return exportObj;
    }

    /**
     * Reset module state
     */
    function reset() {
        _assessments = [];
        _projectContext = null;
        console.log('[ResidualRiskAssessor] Module reset');
    }

    // Public API
    return {
        init: init,
        assessAll: assessAll,
        calculateResidualRisk: calculateResidualRisk,
        getResidualAssessments: getResidualAssessments,
        getAssessments: getAssessments,
        getSummary: getSummary,
        getAssessmentByDetection: getAssessmentByDetection,
        clearAssessments: clearAssessments,
        exportData: exportData,
        reset: reset,
        getRiskCategory: getRiskCategory,
        getRiskLabel: getRiskLabel,
        getThresholds: function () { return { risk: Object.assign({}, RISK_THRESHOLDS), acceptable: ACCEPTABLE_THRESHOLD }; }
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResidualRiskAssessor;
}
