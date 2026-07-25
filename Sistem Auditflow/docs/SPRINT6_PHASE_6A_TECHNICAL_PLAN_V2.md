# Sprint 6 Phase 6A - Internal Control Recommendation Engine
## Technical Specification & Implementation Plan

**Tanggal:** 2026-07-24  
**Phase:** 6A  
**Status:** Final - Ready for Implementation  
**Revision:** 2.0 - Complete overhaul with user feedback  

---

## 1. Executive Summary

Phase 6A bertujuan membangun **Internal Control Recommendation Engine** yang akan:
- Membaca hasil WCGW Detection dari Risk Engine
- Mengambil control recommendations dari Knowledge Base
- Menghasilkan **Top 3-5 recommended controls** per detection
- Setiap recommendation memiliki **rank, score, confidence, dan reason**
- **TANPA** menggunakan Control Effectiveness (Phase 6B feature)
- **TANPA** mengubah data schema atau menyebabkan regression

---

## 2. Module Architecture

### **New Module: `js/control-recommender.js`**

```javascript
/**
 * Control Recommender Engine - Phase 6A
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
```

### **Design Principles:**
1. **Modular** - Single responsibility: recommend controls
2. **Data-driven** - All controls from Knowledge Base, no hardcode
3. **Stateless** - No persistent state, pure function approach
4. **Non-invasive** - Tidak mengubah existing modules
5. **Backward compatible** - Sprint 1-5 tetap berfungsi
6. **Forward compatible** - Output siap untuk Phase 6B/6C/6D

---

## 3. File Impact Analysis

### **Files to CREATE:**
1. **`js/control-recommender.js`** - Main engine module
   - Fungsi: `init()`, `recommendControls()`, `getRecommendations()`, `clearRecommendations()`
   - Helper: `scoreControl()`, `calculateConfidence()`, `getRelatedAssertions()`, `inferAutomation()`, `inferFrequency()`
   - Size estimate: ~400-500 lines

### **Files to MODIFY:**
1. **`flowchart-editor.html`** - Add UI panel for control recommendations
   - Add control recommendation panel (similar to detection panel)
   - Add button to trigger control recommendation
   - Size estimate: +50-80 lines

2. **`js/flowchart-editor.js`** - Integrate control recommender
   - Initialize ControlRecommender module
   - Add event listeners for control recommendation actions
   - Size estimate: +30-50 lines

3. **`css/flowchart-editor.css`** - Styling for control panel
   - Add styles for control recommendation panel
   - Add styles for control items, badges, etc.
   - Size estimate: +100-150 lines

### **Files NOT Modified:**
- ❌ `docs/DATA_SCHEMAS.md` - **NO CHANGES ALLOWED**
- ❌ `data/knowledgeBase.js` - Already has all needed data
- ❌ `js/riskEngine.js` - Already outputs recommendedControls
- ❌ `js/wcgw-detection.js` - Already works with detections
- ❌ `js/audit-trail.js` - No changes needed
- ❌ All other existing files - Maintain backward compatibility

---

## 4. Data Flow Diagram

```
┌─────────────────┐
│  Risk Engine    │
│  Detections[]   │
└────────┬────────┘
         │
         ├─→ detection.assertion
         ├─→ detection.riskLevel
         ├─→ detection.missingControls
         ├─→ detection.recommendedControls (from KB)
         ├─→ detection.wcgw
         └─→ detection.id
         │
         ▼
┌─────────────────────────────────────┐
│  Control Recommender Engine         │
│  (js/control-recommender.js)        │
│                                     │
│  1. Read detection results          │
│  2. Fetch all controls from KB      │
│  3. Score each control per detection│
│  4. Select top 3-5 per detection    │
│  5. Deduplicate & rank globally     │
│  6. Generate structured output      │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Control Recommendations Output     │
│  (Top 3-5 per detection)            │
│                                     │
│  [                                  │
│    {                                │
│      id: "CTRL-001",                │
│      controlId: "segregation-duties"│
│      name: "Pemisahan Tugas",       │
│      rank: 1,                       │
│      score: 85,                     │
│      confidence: 80,                │
│      reasons: [...],                │
│      assertions: [...],             │
│      matchedDetectionIds: [...]     │
│    },                               │
│    ...                              │
│  ]                                  │
└─────────────────────────────────────┘
```

---

## 5. Control Recommender Module Specification

### **5.1 Module Structure**

```javascript
const ControlRecommender = (function() {
    // Private state
    let _recommendations = [];
    let _projectContext = null;
    
    // Core functions
    function init(projectContext) { ... }
    function recommendControls(detections) { ... }
    function getRecommendations() { ... }
    function getRecommendationsByDetection(detectionId) { ... }
    function clearRecommendations() { ... }
    
    // Helper functions
    function scoreControl(control, detection) { ... }
    function calculateConfidence(control, detection) { ... }
    function getRelatedAssertions(assertion) { ... }
    function inferAutomation(control) { ... }
    function inferFrequency(control) { ... }
    function formatControlOutput(control, detection, scoreData) { ... }
    
    // Public API
    return {
        init,
        recommendControls,
        getRecommendations,
        getRecommendationsByDetection,
        clearRecommendations
    };
})();
```

### **5.2 Core Functions**

#### **`init(projectContext)`**
- Initialize module with project context
- Reset recommendations array
- Log initialization
- **Input:** Project context object
- **Output:** void

#### **`recommendControls(detections)`**
- **Input:** Array of WCGW detections from RiskEngine
- **Process:**
  1. Validate input detections
  2. Get all controls from Knowledge Base
  3. For each detection, score all controls
  4. Select top 3-5 controls per detection
  5. Deduplicate controls across detections
  6. Sort globally by score
  7. Assign final ranks
  8. Generate structured output
- **Output:** Array of control recommendation objects
- **Side effects:** Updates `_recommendations` state

#### **`getRecommendations()`**
- Return current recommendations
- Can be filtered by detection ID, assertion, etc.
- **Output:** Array of recommendation objects

#### **`getRecommendationsByDetection(detectionId)`**
- Return recommendations for specific detection
- **Input:** detection.id
- **Output:** Array of recommendation objects for that detection

#### **`clearRecommendations()`**
- Reset module state
- Clear recommendations array
- **Output:** void

---

### **5.3 Control Matching Logic**

```javascript
function matchControlsToAssertion(assertion) {
    // Get all controls from Knowledge Base
    const allControls = Object.values(KnowledgeBase.controlLibrary);
    
    // Filter controls that mitigate this assertion
    const matchingControls = allControls.filter(control => {
        return control.mitigatesAssertions.includes(assertion);
    });
    
    return matchingControls;
}
```

---

### **5.4 Control Scoring Algorithm (Revised)**

**IMPORTANT:** Tidak menggunakan Control Effectiveness (Phase 6B feature). Score hanya berdasarkan data yang tersedia saat ini.

```javascript
function scoreControl(control, detection) {
    let score = 0;
    const reasons = [];
    
    // 1. Assertion Match (0-40 points)
    // Controls that mitigate the detection's assertion get highest score
    if (control.mitigatesAssertions.includes(detection.assertion)) {
        score += 40;
        reasons.push(`Mitigates ${detection.assertion} assertion`);
    } else {
        // Partial match for related assertions
        const relatedAssertions = getRelatedAssertions(detection.assertion);
        const hasRelated = control.mitigatesAssertions.some(a => relatedAssertions.includes(a));
        if (hasRelated) {
            score += 20;
            reasons.push('Partially related assertions');
        }
    }
    
    // 2. Risk Level Appropriateness (0-25 points)
    // Higher risk = higher score for preventive controls
    if (detection.riskLevel === 'high' && control.type === 'preventive') {
        score += 25;
        reasons.push('Preventive control for high risk');
    } else if (detection.riskLevel === 'medium') {
        score += 18;
        reasons.push(`Appropriate for ${detection.riskLevel} risk`);
    } else {
        score += 10;
        reasons.push('Standard control for low risk');
    }
    
    // 3. Control Type Preference (0-20 points)
    // Preventive > Detective for audit purposes
    if (control.type === 'preventive') {
        score += 20;
        reasons.push('Preventive control type preferred');
    } else {
        score += 12;
        reasons.push('Detective control type');
    }
    
    // 4. Coverage Breadth (0-15 points)
    // Controls that cover multiple relevant assertions get bonus
    const relevantAssertions = [detection.assertion, ...getRelatedAssertions(detection.assertion)];
    const coverageCount = control.mitigatesAssertions.filter(a => relevantAssertions.includes(a)).length;
    const coverageScore = Math.min(coverageCount * 5, 15);
    score += coverageScore;
    if (coverageCount > 1) {
        reasons.push(`Covers ${coverageCount} relevant assertions`);
    }
    
    return {
        score: Math.min(score, 100),
        confidence: calculateConfidence(control, detection),
        reasons: reasons
    };
}

function calculateConfidence(control, detection) {
    // Confidence based on how well we can match
    let confidence = 50; // Base confidence
    
    if (control.mitigatesAssertions.includes(detection.assertion)) {
        confidence += 30;
    }
    
    if (detection.missingControls && detection.missingControls.length > 0) {
        confidence += 10; // We have specific missing controls to match against
    }
    
    if (control.description && control.description.length > 50) {
        confidence += 10; // Well-documented controls are more reliable
    }
    
    return Math.min(confidence, 100);
}

function getRelatedAssertions(assertion) {
    // Define assertion relationships for partial matching
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
```

---

### **5.5 Recommendation Generation Logic**

```javascript
function recommendControls(detections) {
    if (!detections || detections.length === 0) {
        _recommendations = [];
        return [];
    }
    
    const allControls = Object.values(KnowledgeBase.controlLibrary);
    const recommendations = [];
    const processedControlIds = new Set();
    
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
        
        // Take top 3-5 controls
        const topControls = scoredControls.slice(0, 5);
        
        // Format and add to recommendations
        topControls.forEach((scoredControl) => {
            const { control, detectionId, score, confidence, reasons } = scoredControl;
            
            // Check if control already processed
            if (processedControlIds.has(control.id)) {
                // Update existing recommendation with additional detection
                const existing = recommendations.find(r => r.controlId === control.id);
                if (existing) {
                    existing.matchedDetectionIds.push(detectionId);
                    existing.detectionCount++;
                    return;
                }
            }
            
            processedControlIds.add(control.id);
            
            recommendations.push({
                id: `CTRL-${String(recommendations.length + 1).padStart(3, '0')}`,
                controlId: control.id,
                name: control.name,
                category: control.type === 'preventive' ? 'Preventive' : 'Detective',
                automation: inferAutomation(control),
                frequency: inferFrequency(control),
                assertions: control.mitigatesAssertions,
                description: control.description,
                source: 'knowledgeBase',
                score: score,
                rank: 0, // Will be assigned after final sort
                confidence: confidence,
                reasons: reasons,
                matchedDetectionIds: [detectionId],
                detectionCount: 1,
                phase: '6A'
            });
        });
    });
    
    // Sort final recommendations by score (descending)
    recommendations.sort((a, b) => b.score - a.score);
    
    // Re-assign ranks after final sort
    recommendations.forEach((rec, index) => {
        rec.rank = index + 1;
    });
    
    _recommendations = recommendations;
    return recommendations;
}

function inferAutomation(control) {
    // Infer automation level from control description
    const desc = control.description.toLowerCase();
    if (desc.includes('sistem') || desc.includes('automated') || desc.includes('otomatis')) {
        return 'Automated';
    } else if (desc.includes('manual') || desc.includes('human')) {
        return 'Manual';
    } else {
        return 'Semi-Automated';
    }
}

function inferFrequency(control) {
    // Infer frequency from control type and description
    const desc = control.description.toLowerCase();
    if (desc.includes('periodik') || desc.includes('berkala')) {
        return 'Periodic';
    } else if (desc.includes('real-time') || desc.includes('langsung')) {
        return 'Real-time';
    } else {
        return 'Per Transaction';
    }
}
```

---

### **5.6 Output Format (Revised)**

**Top 3-5 Recommended Controls per Detection**

```javascript
// Single recommendation object structure
{
    // Identity
    id: "CTRL-001",                    // Generated ID (format: CTRL-XXX)
    controlId: "segregation-duties",   // Original KB control ID
    name: "Pemisahan Tugas",           // From KB
    
    // Classification
    category: "Preventive",            // From KB (type field)
    automation: "Manual",              // Inferred: Manual/Semi-Auto/Automated
    frequency: "Per Transaction",      // Inferred from control type
    
    // Assertions & Description
    assertions: ["authorization", "occurrence"],  // From KB
    description: "Pemisahan fungsi...", // From KB
    
    // Source & Traceability
    source: "knowledgeBase",           // Always "knowledgeBase"
    phase: "6A",                       // Phase when this recommendation was generated
    
    // Scoring Metadata (NEW - Required for Phase 6B/6C/6D)
    score: 85,                         // Computed score (0-100)
    rank: 1,                           // Ranking among recommendations (1-5)
    confidence: 80,                    // Confidence level (0-100)
    reasons: [                         // Why this control was chosen
        "Mitigates authorization assertion",
        "Preventive control for high risk",
        "Preventive control type preferred",
        "Covers 2 relevant assertions"
    ],
    
    // Detection Mapping (NEW)
    matchedDetectionIds: ["det_123"],  // Detections this control addresses
    detectionCount: 1                  // How many detections this control addresses
}

// Engine output structure (array of recommendations)
[
    { /* recommendation 1 - rank 1 */ },
    { /* recommendation 2 - rank 2 */ },
    { /* recommendation 3 - rank 3 */ },
    { /* recommendation 4 - rank 4 */ },
    { /* recommendation 5 - rank 5 */ }
]
```

---

## 6. Integration Points

### **6.1 With Risk Engine**

```javascript
// In flowchart-editor.js or similar
RiskEngine.init(projectContext, flowchartData);
const detections = RiskEngine.runDetection();

// Pass detections to Control Recommender
ControlRecommender.init(projectContext);
const recommendations = ControlRecommender.recommendControls(detections);

// Get recommendations
const allRecommendations = ControlRecommender.getRecommendations();
const forDetection = ControlRecommender.getRecommendationsByDetection(detectionId);
```

### **6.2 With Knowledge Base**

```javascript
// Control Recommender reads from Knowledge Base
const controls = Object.values(KnowledgeBase.controlLibrary);
const assertion = KnowledgeBase.getAssertion(assertionName);
const control = KnowledgeBase.getControl(controlId);
```

### **6.3 With UI**

```javascript
// In flowchart-editor.html
// Add button: "Generate Control Recommendations"
// Add panel: "Recommended Controls"

// In flowchart-editor.js
document.getElementById('generate-controls-btn').addEventListener('click', () => {
    const detections = RiskEngine.getDetections();
    ControlRecommender.init(currentProject);
    const recommendations = ControlRecommender.recommendControls(detections);
    renderControlRecommendations(recommendations);
});
```

---

## 7. Regression Risk Analysis

### **High Risk Areas:**
1. ❌ **Modifying RiskEngine** - Could break detection logic
2. ❌ **Changing Knowledge Base structure** - Could break all modules
3. ❌ **Altering data schema** - Could break localStorage compatibility

### **Low Risk Areas:**
1. ✅ **Creating new module** - Isolated, no dependencies
2. ✅ **Adding UI panel** - New DOM elements, no existing changes
3. ✅ **Reading existing data** - No writes, only reads

### **Mitigation Strategy:**
- **Zero modifications** to existing business logic modules
- **Read-only access** to Risk Engine and Knowledge Base
- **New UI elements** only, no changes to existing UI
- **Feature flag** to enable/disable control recommendations
- **Extensive testing** of existing functionality before/after

---

## 8. Testing Strategy

### **Unit Tests:**
1. Test control matching logic
2. Test scoring algorithm (assertion match, risk level, control type, coverage)
3. Test confidence calculation
4. Test output format
5. Test edge cases (no detections, empty controls, etc.)
6. Test deduplication logic
7. Test ranking logic

### **Integration Tests:**
1. Test with Risk Engine output
2. Test with Knowledge Base data
3. Test with various detection scenarios (high/medium/low risk)
4. Test with multiple detections
5. Test with no detections

### **Regression Tests:**
1. Verify Risk Engine still works
2. Verify Knowledge Base still accessible
3. Verify WCGW Detection still functions
4. Verify existing UI still works
5. Verify localStorage compatibility

### **Manual Testing Checklist:**
- [ ] Load existing project with detections
- [ ] Click "Generate Control Recommendations"
- [ ] Verify controls are displayed
- [ ] Verify control data matches Knowledge Base
- [ ] Verify no errors in console
- [ ] Verify existing features still work
- [ ] Test with different detection scenarios
- [ ] Verify top 3-5 controls are shown
- [ ] Verify ranking and scoring
- [ ] Verify reasons are meaningful

---

## 9. Implementation Steps

### **Step 1: Create Module** (Priority: Critical)
- Create `js/control-recommender.js`
- Implement core functions (init, recommendControls, getRecommendations)
- Implement helper functions (scoreControl, calculateConfidence, etc.)
- Add JSDoc comments
- **Estimate:** 3-4 hours

### **Step 2: Add UI Elements** (Priority: High)
- Add button to toolbar
- Add panel for recommendations
- Add HTML structure
- **Estimate:** 1-2 hours

### **Step 3: Integrate with Editor** (Priority: High)
- Modify `flowchart-editor.js`
- Add event listeners
- Add render function
- **Estimate:** 1-2 hours

### **Step 4: Add Styling** (Priority: Medium)
- Add CSS for panel
- Add styles for control items
- Ensure responsive design
- **Estimate:** 1-2 hours

### **Step 5: Testing** (Priority: Critical)
- Unit tests
- Integration tests
- Regression tests
- **Estimate:** 2-3 hours

### **Total Estimate:** 8-13 hours (1-2 days)

---

## 10. Success Criteria (Definition of Done)

Phase 6A dianggap selesai jika:

1. ✅ **Engine berhasil membaca hasil WCGW Detection**
   - Dapat mengakses `RiskEngine.getDetections()`
   - Dapat membaca detection.assertion, detection.riskLevel, dll

2. ✅ **Engine membaca Assertion Mapping**
   - Dapat mengakses `KnowledgeBase.getAssertion()``
   - Dapat match controls ke assertions

3. ✅ **Engine mengambil control dari Knowledge Base**
   - Dapat mengakses `KnowledgeBase.controlLibrary`
   - Tidak hardcode control data

4. ✅ **Engine menghasilkan Top 3-5 rekomendasi control terstruktur**
   - Output format sesuai specification
   - Include: id, controlId, name, category, assertions, description, source
   - Include: rank, score, confidence, reasons
   - Include: matchedDetectionIds, detectionCount

5. ✅ **Tidak menggunakan Control Effectiveness**
   - Score hanya berdasarkan: assertion match, risk level, control type, coverage
   - Effectiveness field tidak ada di output (akan ditambahkan Phase 6B)

6. ✅ **Tidak ada perubahan pada data schema**
   - `docs/DATA_SCHEMAS.md` tidak dimodifikasi
   - Project structure tetap sama

7. ✅ **Tidak ada regression terhadap Sprint 1–5**
   - Risk Engine masih berfungsi
   - WCGW Detection masih berfungsi
   - Knowledge Base masih accessible
   - Existing UI masih berfungsi

8. ✅ **Semua perubahan bersifat modular**
   - New module: `js/control-recommender.js`
   - Minimal modifications to existing files
   - Clear separation of concerns

9. ✅ **Output siap untuk Phase 6B/6C/6D**
   - Structured object format
   - Includes all required metadata
   - Forward compatible design

---

## 11. Dependencies & Prerequisites

### **Required:**
- ✅ Knowledge Base module (already exists)
- ✅ Risk Engine module (already exists)
- ✅ WCGW Detection module (already exists)
- ✅ Flowchart Editor module (already exists)

### **Not Required:**
- ❌ Phase 6B (Control Effectiveness)
- ❌ Phase 6C (Residual Risk)
- ❌ Phase 6D (Audit Recommendation)

---

## 12. Next Steps

### **Immediate Actions:**
1. **Review & Approval** - Konfirmasi technical plan ini
2. **Implementation** - Mulai coding Phase 6A
3. **Testing** - Verifikasi semua success criteria
4. **Documentation** - Update Implementation Report

### **Questions for User:**
1. Apakah technical plan revised ini sesuai dengan ekspektasi?
2. Apakah ada requirements tambahan yang perlu dipertimbangkan?
3. Apakah estimasi waktu 1-2 hari acceptable?
4. Apakah boleh mulai implementasi?

---

**Prepared by:** Claude Code Analysis  
**Status:** Ready for Implementation  
**Next Phase:** 6B (Control Effectiveness Assessment) - After 6A completion and verification
