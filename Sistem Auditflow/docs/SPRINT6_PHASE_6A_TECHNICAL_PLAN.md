# Sprint 6 Phase 6A - Internal Control Recommendation Engine
## Technical Specification & Implementation Plan

**Tanggal:** 2026-07-24
**Phase:** 6A
**Status:** Revised - Menunggu Approval
**Revision:** 1.1 - Updated scoring algorithm & output format

---

## 1. Executive Summary

Phase 6A bertujuan membangun **Internal Control Recommendation Engine** yang akan:
- Membaca hasil WCGW Detection dari Risk Engine
- Mengambil control recommendations dari Knowledge Base
- Menghasilkan daftar kontrol terstruktur untuk setiap detection
- **TANPA** mengubah data schema atau menyebabkan regression

---

## 2. Module Architecture

### **New Module: `js/control-recommender.js`**

```javascript
/**
 * Control Recommender Engine
 * 
 * Reads WCGW detection results and recommends appropriate internal controls
 * based on assertion, risk level, and missing controls.
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

---

## 3. File Impact Analysis

### **Files to CREATE:**
1. **`js/control-recommender.js`** - Main engine module
   - Fungsi: `init()`, `recommendControls()`, `getRecommendations()`
   - Size estimate: ~300-400 lines

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
         └─→ detection.wcgw
         │
         ▼
┌─────────────────────────────────────┐
│  Control Recommender Engine         │
│  (js/control-recommender.js)        │
│                                     │
│  1. Read detection results          │
│  2. Fetch controls from KB          │
│  3. Match controls to assertions    │
│  4. Score & rank controls           │
│  5. Generate recommendations        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Control Recommendations Output     │
│                                     │
│  {                                   │
│    id: "CTRL-001",                  │
│    name: "Pemisahan Tugas",         │
│    category: "Preventive",          │
│    automation: "Manual",            │
│    frequency: "Per Transaction",    │
│    assertions: ["authorization"],   │
│    effectiveness: 0.8,              │
│    source: "knowledgeBase",         │
│    matchedDetectionIds: ["det_..."] │
│  }                                  │
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
    function clearRecommendations() { ... }
    
    // Helper functions
    function matchControlsToAssertion(assertion) { ... }
    function scoreControl(control, detection) { ... }
    function formatControlOutput(control, detection) { ... }
    
    // Public API
    return {
        init,
        recommendControls,
        getRecommendations,
        clearRecommendations
    };
})();
```

### **5.2 Core Functions**

#### **`init(projectContext)`**
- Initialize module with project context
- Reset recommendations array
- Log initialization

#### **`recommendControls(detections)`**
- **Input:** Array of WCGW detections from RiskEngine
- **Process:**
  1. Iterate through each detection
  2. Get recommended controls from detection (already populated by RiskEngine)
  3. Enhance with additional metadata from Knowledge Base
  4. Score and rank controls based on:
     - Control effectiveness
     - Assertion match
     - Risk level mitigation
  5. Generate structured output
- **Output:** Array of control recommendation objects

#### **`getRecommendations()`**
- Return current recommendations
- Can be filtered by detection ID, assertion, etc.

#### **`clearRecommendations()`**
- Reset module state
- Clear recommendations array

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

### **5.4 Control Scoring Algorithm**

```javascript
function scoreControl(control, detection) {
    let score = 0;
    
    // 1. Base effectiveness score (0-100)
    score += control.effectiveness * 40;  // Max 40 points
    
    // 2. Assertion match bonus (0-30)
    if (control.mitigatesAssertions.includes(detection.assertion)) {
        score += 30;
    }
    
    // 3. Risk level mitigation (0-20)
    const riskScores = { high: 20, medium: 15, low: 10 };
    score += riskScores[detection.riskLevel] || 0;
    
    // 4. Control type bonus (0-10)
    if (control.type === 'preventive') {
        score += 10;  // Preventive controls preferred
    } else {
        score += 5;   // Detective controls
    }
    
    return Math.min(score, 100);  // Cap at 100
}
```

### **5.5 Output Format**

```javascript
{
    id: "CTRL-001",                    // Generated ID
    name: "Pemisahan Tugas",           // From KB
    category: "Preventive",            // From KB (type field)
    automation: "Manual",              // Inferred from description
    frequency: "Per Transaction",      // Inferred from type
    assertions: ["authorization", "occurrence"],  // From KB
    effectiveness: 0.8,                // From KB
    description: "Pemisahan fungsi...", // From KB
    source: "knowledgeBase",           // Always "knowledgeBase"
    matchedDetectionIds: ["det_123"],  // Detections this control addresses
    score: 85,                         // Computed score
    rank: 1                            // Ranking among recommendations
}
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
ControlRecommender.recommendControls(detections);

// Get recommendations
const recommendations = ControlRecommender.getRecommendations();
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
    ControlRecommender.recommendControls(detections);
    renderControlRecommendations();
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
2. Test scoring algorithm
3. Test output format
4. Test edge cases (no detections, empty controls, etc.)

### **Integration Tests:**
1. Test with Risk Engine output
2. Test with Knowledge Base data
3. Test with various detection scenarios

### **Regression Tests:**
1. Verify Risk Engine still works
2. Verify Knowledge Base still accessible
3. Verify WCGW Detection still functions
4. Verify existing UI still works

### **Manual Testing Checklist:**
- [ ] Load existing project with detections
- [ ] Click "Generate Control Recommendations"
- [ ] Verify controls are displayed
- [ ] Verify control data matches Knowledge Base
- [ ] Verify no errors in console
- [ ] Verify existing features still work
- [ ] Test with different detection scenarios

---

## 9. Implementation Steps

### **Step 1: Create Module** (Priority: Critical)
- Create `js/control-recommender.js`
- Implement core functions
- Add JSDoc comments
- **Estimate:** 2-3 hours

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

### **Total Estimate:** 7-12 hours (1-2 days)

---

## 10. Success Criteria (Definition of Done)

Phase 6A dianggap selesai jika:

1. ✅ **Engine berhasil membaca hasil WCGW Detection**
   - Dapat mengakses `RiskEngine.getDetections()`
   - Dapat membaca detection.assertion, detection.riskLevel, dll

2. ✅ **Engine membaca Assertion Mapping**
   - Dapat mengakses `KnowledgeBase.getAssertion()`
   - Dapat match controls ke assertions

3. ✅ **Engine mengambil control dari Knowledge Base**
   - Dapat mengakses `KnowledgeBase.controlLibrary`
   - Tidak hardcode control data

4. ✅ **Engine menghasilkan rekomendasi control terstruktur**
   - Output format sesuai specification
   - Include: id, name, category, assertions, effectiveness, score, rank

5. ✅ **Tidak ada perubahan pada data schema**
   - `docs/DATA_SCHEMAS.md` tidak dimodifikasi
   - Project structure tetap sama

6. ✅ **Tidak ada regression terhadap Sprint 1–5**
   - Risk Engine masih berfungsi
   - WCGW Detection masih berfungsi
   - Knowledge Base masih accessible
   - Existing UI masih berfungsi

7. ✅ **Semua perubahan bersifat modular**
   - New module: `js/control-recommender.js`
   - Minimal modifications to existing files
   - Clear separation of concerns

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
1. Apakah technical plan ini sesuai dengan ekspektasi?
2. Apakah ada requirements tambahan yang perlu dipertimbangkan?
3. Apakah estimasi waktu 1-2 hari acceptable?
4. Apakah boleh mulai implementasi?

---

**Prepared by:** Claude Code Analysis  
**Status:** Ready for Approval  
**Next Phase:** 6B (Control Effectiveness Assessment) - After 6A completion
