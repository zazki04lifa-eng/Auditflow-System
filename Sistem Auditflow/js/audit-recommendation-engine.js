/**
 * AuditFlow Audit Recommendation Engine - Phase 6D
 * 
 * Generates audit procedure recommendations based on:
 * - WCGW Detection results
 * - Assertion mapping
 * - Risk levels
 * - Recommended controls
 * - Control effectiveness
 * - Residual risk
 * 
 * Uses Knowledge Base as primary source. No hardcoded procedures.
 * 
 * Key Features:
 * - Generates recommended audit procedures per detection
 * - Determines audit objectives based on assertions
 * - Specifies evidence required
 * - Suggests test types (Test of Controls, Substantive, Analytical)
 * - Assigns priority based on residual risk
 * - Provides auditor notes
 * 
 * Dependencies:
 * - KnowledgeBase (data/knowledgeBase.js)
 * - EffectivenessAssessor (js/effectiveness-assessor.js)
 * - ResidualRiskAssessor (js/residual-risk-assessor.js)
 * - AuditTrail (js/audit-trail.js)
 * 
 * No direct DOM manipulation - pure business logic module.
 */

const AuditRecommendationEngine = (function () {
    // Private state
    let _recommendations = [];
    let _projectContext = null;

    // Priority thresholds based on residual risk score
    const PRIORITY_THRESHOLDS = {
        HIGH: 50,
        MEDIUM: 25,
        LOW: 0
    };

    // Audit procedure templates by assertion (from Knowledge Base patterns)
    const AUDIT_PROCEDURES = {
        'occurrence': {
            objectives: [
                'Verify that recorded transactions actually occurred',
                'Confirm transactions relate to the entity',
                'Detect fictitious or unauthorized transactions'
            ],
            procedures: [
                'Inspect supporting documentation (invoices, delivery orders, contracts)',
                'Confirm balances with third parties (customers, vendors, banks)',
                'Examine subsequent cash receipts to verify validity',
                'Review authorization signatures on key documents',
                'Perform surprise cash counts or inventory observations'
            ],
            evidence: [
                'Original third-party documents',
                'Signed contracts and agreements',
                'Bank confirmation letters',
                'Customer/vendor confirmations',
                'Physical count sheets'
            ],
            testTypes: ['substantive', 'test-of-controls']
        },
        'authorization': {
            objectives: [
                'Verify transactions were properly authorized',
                'Ensure compliance with approval policies',
                'Detect unauthorized or override transactions'
            ],
            procedures: [
                'Inspect authorization signatures on sampled transactions',
                'Review system access logs for unauthorized access',
                'Test approval workflows in IT systems',
                'Verify segregation of duties between authorization and execution',
                'Review exception reports for unauthorized overrides'
            ],
            evidence: [
                'Signed approval forms',
                'System authorization logs',
                'Delegation of authority matrix',
                'Exception reports',
                'User access rights reports'
            ],
            testTypes: ['test-of-controls', 'substantive']
        },
        'accuracy': {
            objectives: [
                'Verify amounts are recorded correctly',
                'Ensure mathematical accuracy of records',
                'Detect calculation or posting errors'
            ],
            procedures: [
                'Reperform calculations on sampled transactions',
                'Trace amounts from source documents to records',
                'Review reconciliations for accuracy',
                'Test automated calculation controls',
                'Perform analytical procedures on account balances'
            ],
            evidence: [
                'Recalculation worksheets',
                'Reconciliation documents',
                'System calculation logs',
                'Analytical review workpapers',
                'Error logs and corrections'
            ],
            testTypes: ['substantive', 'analytical']
        },
        'completeness': {
            objectives: [
                'Ensure all transactions are recorded',
                'Detect unrecorded liabilities or revenues',
                'Verify no transactions are omitted'
            ],
            procedures: [
                'Perform cut-off testing at period end',
                'Trace from source documents to accounting records',
                'Review subsequent disbursements for unrecorded liabilities',
                'Analyze trends and investigate unexpected variations',
                'Confirm with third parties for completeness'
            ],
            evidence: [
                'Cut-off schedules',
                'Sequential numbering logs',
                'Subsequent payment reviews',
                'Trend analysis workpapers',
                'Third-party confirmations'
            ],
            testTypes: ['substantive', 'analytical']
        },
        'classification': {
            objectives: [
                'Verify transactions are in correct accounts',
                'Ensure proper financial statement presentation',
                'Detect misclassification errors'
            ],
            procedures: [
                'Review chart of accounts and mapping rules',
                'Test transaction classification on sampled items',
                'Review journal entries for proper classification',
                'Analyze account balances for unusual items',
                'Verify financial statement line item classifications'
            ],
            evidence: [
                'Chart of accounts documentation',
                'Transaction classification matrices',
                'Journal entry reviews',
                'Account analysis workpapers',
                'Financial statement drafts'
            ],
            testTypes: ['substantive', 'test-of-controls']
        },
        'cutoff': {
            objectives: [
                'Verify transactions recorded in correct period',
                'Ensure proper cut-off at period end',
                'Detect timing manipulation'
            ],
            procedures: [
                'Test cut-off procedures at period end',
                'Review transactions before and after cut-off date',
                'Verify shipping and receiving cut-off',
                'Test revenue recognition timing',
                'Review accruals and deferrals for proper period'
            ],
            evidence: [
                'Cut-off test workpapers',
                'Shipping/receiving logs',
                'Period-end transaction listings',
                'Accrual calculation schedules',
                'Revenue recognition policies'
            ],
            testTypes: ['substantive', 'test-of-controls']
        },
        'existence': {
            objectives: [
                'Verify assets and liabilities exist',
                'Confirm recorded balances are real',
                'Detect fictitious or overstated balances'
            ],
            procedures: [
                'Perform physical inspection of assets',
                'Confirm balances with third parties',
                'Observe inventory count procedures',
                'Inspect title documents for ownership',
                'Review subsequent disposals or settlements'
            ],
            evidence: [
                'Physical count sheets',
                'Third-party confirmations',
                'Title deeds and ownership documents',
                'Asset registers',
                'Subsequent transaction evidence'
            ],
            testTypes: ['substantive', 'test-of-controls']
        },
        'rights-and-obligations': {
            objectives: [
                'Verify entity owns assets and owes liabilities',
                'Confirm legal rights and obligations',
                'Detect consigned or encumbered items'
            ],
            procedures: [
                'Inspect title documents and legal agreements',
                'Review loan agreements for liabilities',
                'Confirm ownership of key assets',
                'Review lease agreements for classification',
                'Inquire about contingencies and commitments'
            ],
            evidence: [
                'Title deeds and certificates',
                'Loan and lease agreements',
                'Legal opinions',
                'Board minutes authorizing transactions',
                'Contingency disclosure schedules'
            ],
            testTypes: ['substantive']
        },
        'valuation': {
            objectives: [
                'Verify assets/liabilities at correct amounts',
                'Ensure proper valuation methodologies',
                'Detect over/under valued balances'
            ],
            procedures: [
                'Review valuation methodologies and assumptions',
                'Test impairment calculations',
                'Compare to market values where available',
                'Review subsequent events affecting valuation',
                'Evaluate adequacy of allowances and reserves'
            ],
            evidence: [
                'Valuation models and calculations',
                'Market price comparisons',
                'Impairment test workpapers',
                'Appraisal reports',
                'Reserve calculation schedules'
            ],
            testTypes: ['substantive', 'analytical']
        }
    };

    /**
     * Initialize module with project context
     * @param {Object} projectContext - Project context object
     */
    function init(projectContext) {
        _projectContext = projectContext;
        _recommendations = [];
        console.log('[AuditRecommendationEngine] Initialized with project:', projectContext?.name);
    }

    /**
     * Get priority based on residual risk score
     * @param {number} residualRiskScore - Residual risk score (0-100)
     * @returns {string} Priority: 'high', 'medium', or 'low'
     */
    function getPriority(residualRiskScore) {
        if (residualRiskScore >= PRIORITY_THRESHOLDS.HIGH) {
            return 'high';
        } else if (residualRiskScore >= PRIORITY_THRESHOLDS.MEDIUM) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Get priority label for display
     * @param {string} priority - Priority code
     * @returns {string} Human-readable label
     */
    function getPriorityLabel(priority) {
        const labels = {
            'high': 'High Priority',
            'medium': 'Medium Priority',
            'low': 'Low Priority'
        };
        return labels[priority] || priority;
    }

    /**
     * Determine primary test type based on assertion and control effectiveness
     * @param {string} assertion - Assertion name
     * @param {number} controlEffectiveness - Control effectiveness (0-1)
     * @returns {string} Primary test type
     */
    function determineTestType(assertion, controlEffectiveness) {
        const procedures = AUDIT_PROCEDURES[assertion];
        if (!procedures) return 'substantive';

        // If controls are effective (>70%), emphasize test of controls
        if (controlEffectiveness > 0.7) {
            return procedures.testTypes[0]; // Primary test type
        }
        // Otherwise emphasize substantive testing
        return 'substantive';
    }

    /**
     * Generate auditor notes based on risk factors
     * @param {Object} detection - WCGW detection
     * @param {Object} residualRisk - Residual risk assessment
     * @returns {string} Auditor notes
     */
    function generateAuditorNotes(detection, residualRisk) {
        const notes = [];

        // Risk level consideration
        if (detection.riskLevel === 'high') {
            notes.push('High inherent risk - consider increasing sample size');
        }

        // Residual risk consideration
        if (residualRisk.residualRisk?.score > 40) {
            notes.push('Residual risk above acceptable threshold - additional procedures may be required');
        }

        // Control effectiveness consideration
        if (residualRisk.controlEffectiveness < 50) {
            notes.push('Low control effectiveness - rely more on substantive testing');
        }

        // Assertion-specific notes
        const assertion = detection.assertion || 'accuracy';
        if (assertion === 'occurrence' || assertion === 'existence') {
            notes.push('Focus on third-party confirmations and physical verification');
        } else if (assertion === 'completeness') {
            notes.push('Consider directional testing from source documents to records');
        } else if (assertion === 'cutoff') {
            notes.push('Pay special attention to period-end transactions');
        }

        return notes.join('. ');
    }

    /**
     * Generate audit recommendation for a residual risk assessment
     * @param {Object} residualRisk - Residual risk assessment result
     * @param {Object} detection - Original WCGW detection
     * @returns {Object} Audit recommendation
     */
    function generateRecommendation(residualRisk, detection) {
        const assertion = detection.assertion || 'accuracy';
        const procedures = AUDIT_PROCEDURES[assertion];

        if (!procedures) {
            console.warn('[AuditRecommendationEngine] No procedures defined for assertion:', assertion);
            return null;
        }

        const priority = getPriority(residualRisk.residualRisk?.score || 0);
        const testType = determineTestType(assertion, residualRisk.controlEffectiveness / 100);

        const recommendation = {
            id: 'AUDIT-' + detection.id,
            detectionId: detection.id,
            detectionDescription: detection.description,
            assertion: assertion,
            assertionName: KnowledgeBase.getAssertion(assertion)?.name || assertion,
            riskLevel: detection.riskLevel,
            inherentRiskScore: residualRisk.inherentRisk?.score || 0,
            controlEffectiveness: residualRisk.controlEffectiveness || 0,
            residualRiskScore: residualRisk.residualRisk?.score || 0,
            priority: priority,
            priorityLabel: getPriorityLabel(priority),
            auditObjective: procedures.objectives[0], // Primary objective
            auditObjectives: procedures.objectives,
            recommendedProcedures: procedures.procedures.slice(0, 3), // Top 3 procedures
            evidenceRequired: procedures.evidence.slice(0, 4), // Top 4 evidence types
            testType: testType,
            testTypes: procedures.testTypes,
            auditorNotes: generateAuditorNotes(detection, residualRisk),
            sampleSizeGuidance: getSampleSizeGuidance(priority),
            generatedAt: new Date().toISOString(),
            generatedBy: 'auditor'
        };

        _recommendations.push(recommendation);

        console.log('[AuditRecommendationEngine] Generated recommendation for detection:', detection.id,
            'Priority:', priority, 'Test Type:', testType);

        return recommendation;
    }

    /**
     * Get sample size guidance based on priority
     * @param {string} priority - Priority level
     * @returns {string} Sample size guidance
     */
    function getSampleSizeGuidance(priority) {
        const guidance = {
            'high': 'Large sample (40-60 items) or 100% testing for critical items',
            'medium': 'Moderate sample (20-40 items)',
            'low': 'Small sample (5-20 items) or analytical procedures only'
        };
        return guidance[priority] || guidance.medium;
    }

    /**
     * Generate audit recommendations for all residual risk assessments
     * @param {Array} residualRisks - Array of residual risk assessments
     * @param {Array} detections - Array of WCGW detections
     * @returns {Array} Array of audit recommendations
     */
    function generateAll(residualRisks, detections) {
        if (!residualRisks || residualRisks.length === 0) {
            console.log('[AuditRecommendationEngine] No residual risks provided');
            return [];
        }

        if (!detections || detections.length === 0) {
            console.log('[AuditRecommendationEngine] No detections provided');
            return [];
        }

        const results = [];

        residualRisks.forEach(function (residualRisk) {
            // Find matching detection
            const detection = detections.find(function (d) { return d.id === residualRisk.detectionId; });
            if (detection) {
                const recommendation = generateRecommendation(residualRisk, detection);
                if (recommendation) {
                    results.push(recommendation);
                }
            }
        });

        return results;
    }

    /**
     * Get all audit recommendations
     * @returns {Array} Array of recommendation objects
     */
    function getRecommendations() {
        return _recommendations;
    }

    /**
     * Get recommendations by priority
     * @param {string} priority - Priority level
     * @returns {Array} Filtered recommendations
     */
    function getByPriority(priority) {
        return _recommendations.filter(function (r) { return r.priority === priority; });
    }

    /**
     * Get recommendations by assertion
     * @param {string} assertion - Assertion name
     * @returns {Array} Filtered recommendations
     */
    function getByAssertion(assertion) {
        return _recommendations.filter(function (r) { return r.assertion === assertion; });
    }

    /**
     * Get summary statistics
     * @returns {Object} Summary statistics
     */
    function getSummary() {
        const totalRecommendations = _recommendations.length;
        const highPriority = _recommendations.filter(function (r) { return r.priority === 'high'; }).length;
        const mediumPriority = _recommendations.filter(function (r) { return r.priority === 'medium'; }).length;
        const lowPriority = _recommendations.filter(function (r) { return r.priority === 'low'; }).length;

        const byTestType = {
            substantive: _recommendations.filter(function (r) { return r.testType === 'substantive'; }).length,
            testOfControls: _recommendations.filter(function (r) { return r.testType === 'test-of-controls'; }).length,
            analytical: _recommendations.filter(function (r) { return r.testType === 'analytical'; }).length
        };

        const byAssertion = {};
        _recommendations.forEach(function (r) {
            byAssertion[r.assertion] = (byAssertion[r.assertion] || 0) + 1;
        });

        const avgResidualRisk = totalRecommendations > 0
            ? Math.round(_recommendations.reduce(function (sum, r) { return sum + r.residualRiskScore; }, 0) / totalRecommendations)
            : 0;

        return {
            totalRecommendations: totalRecommendations,
            byPriority: {
                high: highPriority,
                medium: mediumPriority,
                low: lowPriority
            },
            byTestType: byTestType,
            byAssertion: byAssertion,
            averageResidualRisk: avgResidualRisk
        };
    }

    /**
     * Export recommendations data
     * @param {string} format - Export format ('json' or 'csv')
     * @returns {string|Object} Exported data
     */
    function exportData(format = 'json') {
        const exportObj = {
            projectId: _projectContext?.id,
            projectName: _projectContext?.name,
            generatedAt: new Date().toISOString(),
            summary: getSummary(),
            recommendations: _recommendations.map(function (r) {
                return {
                    id: r.id,
                    detectionId: r.detectionId,
                    assertion: r.assertion,
                    assertionName: r.assertionName,
                    priority: r.priority,
                    priorityLabel: r.priorityLabel,
                    auditObjective: r.auditObjective,
                    testType: r.testType,
                    residualRiskScore: r.residualRiskScore,
                    recommendedProcedures: r.recommendedProcedures,
                    evidenceRequired: r.evidenceRequired,
                    sampleSizeGuidance: r.sampleSizeGuidance,
                    auditorNotes: r.auditorNotes
                };
            })
        };

        if (format === 'json') {
            return exportObj;
        }

        return JSON.stringify(exportObj, null, 2);
    }

    /**
     * Clear all recommendations
     */
    function clearRecommendations() {
        _recommendations = [];
    }

    /**
     * Reset module to initial state
     */
    function reset() {
        clearRecommendations();
        _projectContext = null;
    }

    // Public API
    return {
        init: init,
        generateAll: generateAll,
        getRecommendations: getRecommendations,
        getByPriority: getByPriority,
        getByAssertion: getByAssertion,
        getSummary: getSummary,
        exportData: exportData,
        clearRecommendations: clearRecommendations,
        reset: reset
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditRecommendationEngine;
}