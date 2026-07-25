/**
 * AuditFlow Control Recommender Engine - Phase 6A
 * 
 * Reads WCGW detection results and recommends appropriate internal controls
 * based on assertion, risk level, and missing controls.
 * 
 * Key Features:
 * - Top 3-5 recommendations per detection
 * - Scoring based on assertion match, risk level, control type
 * - Detailed reasoning for each recommendation
 * - Structured output for Phase 6B/6C/6D consumption
 * 
 * Dependencies:
 * - KnowledgeBase (data/knowledgeBase.js)
 * - RiskEngine (js/riskEngine.js)
 * 
 * No direct DOM manipulation - pure business logic module.
 */

const ControlRecommender = (function() {
    // Private state
    let _recommendations = [];
    let _projectContext = null;
    
    /**
     * Initialize module with project context
     * @param {Object} projectContext - Project context object
     */
    function init(projectContext) {
        _projectContext = projectContext;
        _recommendations = [];
        console.log('[ControlRecommender] Initialized with project:', projectContext?.name);
    }
    
    /**
     * Get related assertions for partial matching
     * @param {string} assertion - Primary assertion
     * @returns {string[]} Array of related assertions
     */
    function getRelatedAssertions(assertion) {
        const relationships = {
            'occurrence': ['authorization', 'completeness'],
            'authorization': ['occurrence', 'accuracy'],
            'accuracy': ['authorization', 'classification'],
            'completeness': ['occurrence', 'cutoff'],
            'classification': ['accuracy', 'cutoff'],
            'cutoff': ['completeness', 'classification'],
            'existence': ['occurrence', 'valuation'],
            'rights-and-obligations': ['existence', 'occurrence'],
            'valuation': ['existence', 'accuracy']
        };
        return relationships[assertion] || [];
    }
    
    /**
     * Score a control based on detection context
     * Does NOT use Control Effectiveness (Phase 6B feature)
     * 
     * @param {Object} control - Control object from Knowledge Base
     * @param {Object} detection - WCGW detection object from Risk Engine
     * @returns {Object} Scoring result with score, confidence, reasons
     */
    function scoreControl(control, detection) {
        let score = 0;
        const reasons = [];
        const matchedAssertions = [];
        const matchedRisks = [];
        
        // 1. Assertion Match (0-40 points)
        if (control.mitigatesAssertions.includes(detection.assertion)) {
            score += 40;
            matchedAssertions.push(detection.assertion);
            reasons.push(`Mitigates ${detection.assertion} assertion`);
        } else {
            const relatedAssertions = getRelatedAssertions(detection.assertion);
            const hasRelated = control.mitigatesAssertions.some(a => relatedAssertions.includes(a));
            if (hasRelated) {
                score += 20;
                const related = control.mitigatesAssertions.filter(a => relatedAssertions.includes(a));
                matchedAssertions.push(...related);
                reasons.push(`Partially related assertions: ${related.join(', ')}`);
            }
        }
        
        // 2. Risk Level Appropriateness (0-25 points)
        if (detection.riskLevel === 'high' && control.type === 'preventive') {
            score += 25;
            matchedRisks.push('high');
            reasons.push('Preventive control for high risk');
        } else if (detection.riskLevel === 'medium') {
            score += 18;
            matchedRisks.push('medium');
            reasons.push(`Appropriate for ${detection.riskLevel} risk`);
        } else {
            score += 10;
            matchedRisks.push('low');
            reasons.push('Standard control for low risk');
        }
        
        // 3. Control Type Preference (0-20 points)
        if (control.type === 'preventive') {
            score += 20;
            reasons.push('Preventive control type preferred');
        } else {
            score += 12;
            reasons.push('Detective control type');
        }
        
        // 4. Coverage Breadth (0-15 points)
        const relevantAssertions = [detection.assertion, ...getRelatedAssertions(detection.assertion)];
        const coverageCount = control.mitigatesAssertions.filter(a => relevantAssertions.includes(a)).length;
        const totalRelevant = relevantAssertions.length;
        const coverage = totalRelevant > 0 ? Math.round((coverageCount / totalRelevant) * 100) : 0;
        const coverageScore = Math.min(coverageCount * 5, 15);
        score += coverageScore;
        if (coverageCount > 1) {
            reasons.push(`Covers ${coverageCount} of ${totalRelevant} relevant assertions (${coverage}%)`);
        }
        
        return {
            score: Math.min(score, 100),
            confidence: calculateConfidence(control, detection),
            reasons: reasons,
            matchedAssertions: matchedAssertions,
            matchedRisks: matchedRisks,
            coverage: coverage
        };
    }
    
    /**
     * Calculate confidence level for a control recommendation
     * @param {Object} control - Control object from Knowledge Base
     * @param {Object} detection - WCGW detection object
     * @returns {number} Confidence level (0-100)
     */
    function calculateConfidence(control, detection) {
        let confidence = 50; // Base confidence
        
        if (control.mitigatesAssertions.includes(detection.assertion)) {
            confidence += 30;
        }
        
        if (detection.missingControls && detection.missingControls.length > 0) {
            confidence += 10;
        }
        
        if (control.description && control.description.length > 50) {
            confidence += 10;
        }
        
        return Math.min(confidence, 100);
    }
    
    /**
     * Infer automation level from control description
     * @param {Object} control - Control object from Knowledge Base
     * @returns {string} Automation level
     */
    function inferAutomation(control) {
        const desc = (control.description || '').toLowerCase();
        if (desc.includes('sistem') || desc.includes('automated') || desc.includes('otomatis')) {
            return 'Automated';
        } else if (desc.includes('manual') || desc.includes('human')) {
            return 'Manual';
        } else {
            return 'Semi-Automated';
        }
    }
    
    /**
     * Infer frequency from control description
     * @param {Object} control - Control object from Knowledge Base
     * @returns {string} Frequency
     */
    function inferFrequency(control) {
        const desc = (control.description || '').toLowerCase();
        if (desc.includes('periodik') || desc.includes('berkala')) {
            return 'Periodic';
        } else if (desc.includes('real-time') || desc.includes('langsung')) {
            return 'Real-time';
        } else {
            return 'Per Transaction';
        }
    }
    
    /**
     * Format control output for recommendation
     * @param {Object} control - Control object from Knowledge Base
     * @param {Object} detection - WCGW detection object
     * @param {Object} scoringData - Scoring result from scoreControl()
     * @param {number} rank - Rank in recommendations list
     * @returns {Object} Formatted recommendation object
     */
    function formatControlOutput(control, detection, scoringData, rank) {
        return {
            // Identity
            id: `CTRL-${String(rank).padStart(3, '0')}`,
            controlId: control.id,
            name: control.name,
            
            // Classification
            category: control.type === 'preventive' ? 'Preventive' : 'Detective',
            automation: inferAutomation(control),
            frequency: inferFrequency(control),
            
            // Assertions & Description
            assertions: control.mitigatesAssertions,
            description: control.description,
            
            // Matched data (NEW - for AI reasoning)
            matchedAssertions: scoringData.matchedAssertions,
            matchedRisks: scoringData.matchedRisks,
            coverage: scoringData.coverage,
            
            // Source & Traceability
            source: 'knowledgeBase',
            
            // Scoring Metadata
            score: scoringData.score,
            rank: rank,
            confidence: scoringData.confidence,
            reasons: scoringData.reasons,
            whyNot: [], // Will be populated later for non-top controls
            
            // Detection Mapping
            matchedDetectionIds: [detection.id],
            detectionCount: 1,
            
            // Metadata (NEW - replaces simple phase field)
            metadata: {
                generatedBy: 'ControlRecommender',
                engineVersion: '1.0',
                generatedAt: new Date().toISOString(),
                phase: '6A'
            }
        };
    }
    
    /**
     * Generate control recommendations from detections
     * @param {Array} detections - Array of WCGW detections from RiskEngine
     * @returns {Array} Array of control recommendation objects
     */
    function recommendControls(detections) {
        if (!detections || detections.length === 0) {
            console.log('[ControlRecommender] No detections provided');
            _recommendations = [];
            return [];
        }
        
        console.log(`[ControlRecommender] Generating recommendations for ${detections.length} detections`);
        
        const allControls = Object.values(KnowledgeBase.controlLibrary);
        const recommendations = [];
        const processedControlIds = new Set();
        const allScoredControls = [];
        
        // Process each detection
        detections.forEach(detection => {
            // Score all controls for this detection
            const scoredControls = allControls.map(control => {
                const scoring = scoreControl(control, detection);
                return {
                    control,
                    detectionId: detection.id,
                    ...scoring
                };
            });
            
            // Sort by score descending
            scoredControls.sort((a, b) => b.score - a.score);
            
            // Collect all scored controls for whyNot analysis
            allScoredControls.push(...scoredControls);
            
            // Take top 3-5 controls
            const topControls = scoredControls.slice(0, 5);
            
            // Format and add to recommendations
            topControls.forEach((scoredControl, index) => {
                const { control, detectionId, score, confidence, reasons, matchedAssertions, matchedRisks, coverage } = scoredControl;
                
                // Check if control already processed
                if (processedControlIds.has(control.id)) {
                    // Update existing recommendation with additional detection
                    const existing = recommendations.find(r => r.controlId === control.id);
                    if (existing) {
                        existing.matchedDetectionIds.push(detectionId);
                        existing.detectionCount++;
                        // Update matched assertions and risks
                        matchedAssertions.forEach(a => {
                            if (!existing.matchedAssertions.includes(a)) {
                                existing.matchedAssertions.push(a);
                            }
                        });
                        matchedRisks.forEach(r => {
                            if (!existing.matchedRisks.includes(r)) {
                                existing.matchedRisks.push(r);
                            }
                        });
                        existing.coverage = Math.max(existing.coverage, coverage);
                        return;
                    }
                }
                
                processedControlIds.add(control.id);
                
                const recommendation = formatControlOutput(control, detection, {
                    score,
                    confidence,
                    reasons,
                    matchedAssertions,
                    matchedRisks,
                    coverage
                }, recommendations.length + 1);
                
                recommendations.push(recommendation);
            });
        });
        
        // Sort final recommendations by score (descending)
        recommendations.sort((a, b) => b.score - a.score);
        
        // Re-assign ranks after final sort
        recommendations.forEach((rec, index) => {
            rec.rank = index + 1;
            rec.id = `CTRL-${String(index + 1).padStart(3, '0')}`;
        });
        
        // Generate whyNot for controls that didn't make top 5
        const top5Ids = recommendations.slice(0, 5).map(r => r.controlId);
        const allControlIds = allControls.map(c => c.id);
        const notRecommended = allControlIds.filter(id => !top5Ids.includes(id) && !processedControlIds.has(id));
        
        // Add whyNot explanations for non-top controls
        notRecommended.forEach(controlId => {
            const control = allControls.find(c => c.id === controlId);
            if (control) {
                const whyNotReasons = [];
                
                // Check if it doesn't mitigate any relevant assertions
                const hasRelevantAssertion = detections.some(d => 
                    control.mitigatesAssertions.includes(d.assertion) || 
                    getRelatedAssertions(d.assertion).some(ra => control.mitigatesAssertions.includes(ra))
                );
                if (!hasRelevantAssertion) {
                    whyNotReasons.push('Does not mitigate any detected assertion');
                }
                
                // Check if it's detective rather than preventive
                if (control.type !== 'preventive') {
                    whyNotReasons.push('Detective controls ranked lower than preventive');
                }
                
                // Check effectiveness (lower effectiveness = lower rank)
                if (control.effectiveness < 0.7) {
                    whyNotReasons.push(`Lower effectiveness (${Math.round(control.effectiveness * 100)}%)`);
                }
                
                recommendations.push({
                    id: `CTRL-${String(recommendations.length + 1).padStart(3, '0')}`,
                    controlId: control.id,
                    name: control.name,
                    category: control.type === 'preventive' ? 'Preventive' : 'Detective',
                    automation: inferAutomation(control),
                    frequency: inferFrequency(control),
                    assertions: control.mitigatesAssertions,
                    description: control.description,
                    matchedAssertions: [],
                    matchedRisks: [],
                    coverage: 0,
                    source: 'knowledgeBase',
                    score: 0,
                    rank: recommendations.length + 1,
                    confidence: 0,
                    reasons: [],
                    whyNot: whyNotReasons,
                    matchedDetectionIds: [],
                    detectionCount: 0,
                    metadata: {
                        generatedBy: 'ControlRecommender',
                        engineVersion: '1.0',
                        generatedAt: new Date().toISOString(),
                        phase: '6A'
                    }
                });
            }
        });
        
        _recommendations = recommendations;
        console.log(`[ControlRecommender] Generated ${recommendations.length} recommendations`);
        return recommendations;
    }
    
    /**
     * Get all recommendations
     * @returns {Array} Array of recommendation objects
     */
    function getRecommendations() {
        return _recommendations;
    }
    
    /**
     * Get recommendations for specific detection
     * @param {string} detectionId - Detection ID
     * @returns {Array} Array of recommendation objects for that detection
     */
    function getRecommendationsByDetection(detectionId) {
        return _recommendations.filter(rec => 
            rec.matchedDetectionIds.includes(detectionId)
        );
    }
    
    /**
     * Clear all recommendations
     */
    function clearRecommendations() {
        _recommendations = [];
        _projectContext = null;
        console.log('[ControlRecommender] Recommendations cleared');
    }
    
    // Public API
    return {
        init,
        recommendControls,
        getRecommendations,
        getRecommendationsByDetection,
        clearRecommendations
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ControlRecommender;
}
