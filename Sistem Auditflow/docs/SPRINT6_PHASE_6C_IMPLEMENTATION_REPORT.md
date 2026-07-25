# Sprint 6 Phase 6C Implementation Report
## Residual Risk Assessment Engine

**Version:** 1.0  
**Date:** 2026-07-24  
**Status:** ✅ Complete  
**Phase:** 6C - Residual Risk Assessment

---

## Executive Summary

Phase 6C implements the Residual Risk Assessment Engine, which calculates residual risk based on:
- **Inherent Risk** from WCGW Detection (Phase 5)
- **Control Effectiveness** from Phase 6B

The core formula used is:
```
Residual Risk = Inherent Risk × (1 - Control Effectiveness)
```

This phase enables auditors to understand the remaining risk after controls are applied, helping prioritize additional control investments.

---

## Implementation Scope

### In Scope
| Component | Description | Status |
|-----------|-------------|--------|
| Residual Risk Engine Module | Core calculation engine (`js/residual-risk-assessor.js`) | ✅ Complete |
| UI Integration | Panel, toolbar button, event handlers in `flowchart-editor.js` | ✅ Complete |
| CSS Styling | Residual risk panel styles in `flowchart-editor.css` | ✅ Complete |
| Audit Trail Integration | Event `risk.residual.calculated` recording | ✅ Complete |
| Documentation Updates | EVENT_MAPPING_MATRIX.md updated | ✅ Complete |

### Out of Scope
- Historical trend analysis (future phase)
- Risk heat map visualization (future phase)
- Export to risk register (future phase)

---

## Technical Implementation

### 1. Core Engine: `js/residual-risk-assessor.js`

**File Size:** 331 lines  
**Architecture:** IIFE (Immediately Invoked Function Expression) module pattern

#### Key Functions

| Function | Purpose |
|----------|---------|
| `init(projectContext)` | Initialize module with project context |
| `assessAll(detections)` | Calculate residual risk for all detections |
| `calculateResidualRisk(detection, assessments)` | Calculate residual risk for single detection |
| `getInherentRiskScore(detection)` | Map risk level to score (high=90, medium=60, low=30) |
| `calculateEffectiveControl(detection, assessments)` | Calculate weighted average control effectiveness |
| `getRiskCategory(score)` | Categorize risk (High ≥60, Medium ≥30, Low <30) |
| `getSummary()` | Return summary statistics |

#### Risk Score Thresholds

| Category | Threshold | Inherent Score |
|----------|-----------|----------------|
| High | ≥ 60 | 90 |
| Medium | ≥ 30 | 60 |
| Low | < 30 | 30 |

#### Status Determination

| Status | Condition |
|--------|-----------|
| Acceptable | Residual Risk ≤ 40 |
| Need Additional Control | Residual Risk > 40 |

### 2. UI Integration: `js/flowchart-editor.js`

#### New Functions Added

| Function | Purpose |
|----------|---------|
| `showResidualRiskPanel()` | Open residual risk panel with validation |
| `calculateAndRenderResidualRisk(detections, assessments)` | Calculate and display results |
| `renderResidualRiskList(results)` | Render individual risk items |

#### Event Listeners Added

```javascript
// Open panel
elements.residualRiskBtn.addEventListener('click', () => {
    showResidualRiskPanel();
});

// Close panel
elements.closeResidualRiskPanel.addEventListener('click', () => {
    elements.residualRiskPanel.classList.add('hidden');
});
```

### 3. CSS Styling: `css/flowchart-editor.css`

**Lines Added:** ~250 lines

#### Key Classes

| Class | Purpose |
|-------|---------|
| `.residual-risk-panel` | Main panel container (400px width) |
| `.residual-risk-summary` | Summary cards grid |
| `.risk-distribution` | Distribution bars section |
| `.status-summary` | Acceptable vs Need Control counts |
| `.residual-risk-item` | Individual risk assessment card |
| `.risk-item-header` | Detection info and status badge |
| `.risk-item-scores` | Inherent → Effectiveness → Residual flow |

### 4. HTML Structure: `flowchart-editor.html`

#### New Elements

| Element ID | Purpose |
|------------|---------|
| `residual-risk-btn` | Toolbar button |
| `residual-risk-panel` | Side panel container |
| `residual-risk-count` | Badge counter |
| `avg-residual-score` | Average score display |
| `avg-risk-reduction` | Average reduction display |
| `high-risk-fill`, `medium-risk-fill`, `low-risk-fill` | Distribution bars |
| `acceptable-count`, `need-control-count` | Status counts |
| `residual-risk-list` | Assessment list container |

---

## Data Flow

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│  WCGW Detection     │────▶│  Effectiveness       │────▶│  Residual Risk          │
│  (Inherent Risk)    │     │  Assessor (6B)       │     │  Assessor (6C)          │
│                     │     │                      │     │                           │
│  - detection.id     │     │  - effectivenessScore│     │  - residualRiskScore     │
│  - riskLevel        │     │  - effectivenessCat  │     │  - riskLevel             │
│  - assertion        │     │  - rationale         │     │  - riskReduction         │
│  - description      │     │                      │     │  - status                │
└─────────────────────┘     └──────────────────────┘     └─────────────────────────┘
                                                              │
                                                              ▼
                                                       ┌──────────────────────┐
                                                       │  UI Panel Display    │
                                                       │  + Audit Trail       │
                                                       └──────────────────────┘
```

---

## Audit Trail Integration

### New Event: `risk.residual.calculated`

| Field | Type | Description |
|-------|------|-------------|
| `projectId` | string | Project identifier |
| `detectionCount` | number | Total detections analyzed |
| `assessmentCount` | number | Number of effectiveness assessments used |
| `residualRiskCount` | number | Number of residual risk calculations |
| `averageResidualRisk` | number | Average residual risk score |
| `averageRiskReduction` | number | Average risk reduction percentage |
| `highRiskCount` | number | Count of high residual risks |
| `mediumRiskCount` | number | Count of medium residual risks |
| `lowRiskCount` | number | Count of low residual risks |
| `timestamp` | string | ISO 8601 timestamp |

**Source:** `rule-engine` (automated calculation)

---

## Usage Workflow

1. **Run WCGW Detection** (Phase 5) - Identifies risks with inherent levels
2. **Generate Control Recommendations** (Phase 6A) - Suggests controls
3. **Assess Control Effectiveness** (Phase 6B) - Auditor assigns scores
4. **Calculate Residual Risk** (Phase 6C) - Click toolbar button to calculate

### Prerequisites Check

The `showResidualRiskPanel()` function validates:
- WCGWDetection module is available
- Detections exist
- EffectivenessAssessor module is available
- Effectiveness assessments exist
- ResidualRiskAssessor module is available

If any check fails, an alert is shown with guidance.

---

## Example Calculation

### Input
- **Detection:** "Revenue recognized for fictitious sales"
- **Inherent Risk Level:** High → Score: 90
- **Control:** "Automated reconciliation of sales to shipping documents"
- **Control Effectiveness:** 75% → 0.75

### Calculation
```
Residual Risk = 90 × (1 - 0.75)
Residual Risk = 90 × 0.25
Residual Risk = 22.5 → 23 (rounded)
```

### Result
- **Residual Risk Score:** 23
- **Risk Level:** Low (< 30)
- **Risk Reduction:** 75%
- **Status:** Acceptable (≤ 40)

---

## Testing

### Syntax Validation
```bash
node --check js/residual-risk-assessor.js  # ✅ Pass
node --check js/flowchart-editor.js        # ✅ Pass
```

### Manual Test Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Click Residual Risk button without detections | Alert: "No WCGW detections found" |
| Click Residual Risk button without effectiveness assessments | Alert: "No control effectiveness assessments found" |
| Click Residual Risk button with all prerequisites | Panel opens with calculations |
| Close panel | Panel hides |
| Recalculate after new assessment | Updated results displayed |

---

## Dependencies

| Module | Purpose | Version |
|--------|---------|---------|
| `EffectivenessAssessor` | Read control effectiveness scores | Phase 6B |
| `WCGWDetection` | Read detections with inherent risk | Phase 5 |
| `AuditTrail` | Record calculation events | Sprint 5 |

---

## Files Modified

| File | Lines Changed | Description |
|------|---------------|-------------|
| `js/residual-risk-assessor.js` | +331 | New module |
| `js/flowchart-editor.js` | +180 | UI integration |
| `css/flowchart-editor.css` | +250 | Panel styling |
| `flowchart-editor.html` | +85 | HTML structure |
| `docs/EVENT_MAPPING_MATRIX.md` | +15 | Audit trail mapping |

**Total:** ~861 lines of code

---

## Known Limitations

1. **Control Effectiveness Cap:** Maximum effectiveness capped at 90% (controls cannot eliminate all risk)
2. **Single Detection Processing:** Each detection processed independently (no cross-detection correlation)
3. **Static Inherent Scores:** Inherent risk scores are fixed (high=90, medium=60, low=30)
4. **No Historical Comparison:** No trend analysis against previous assessments

---

## Future Enhancements

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Risk Heat Map | Medium | Visual grid showing inherent vs residual risk |
| Trend Analysis | Low | Compare current vs historical residual risks |
| Export to Risk Register | High | Generate risk register report |
| Scenario Modeling | Medium | "What-if" analysis for control improvements |
| Risk Aggregation | Low | Roll up residual risks by assertion/category |

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | Claude Code | 2026-07-24 | ✅ Complete |
| Code Review | AI Reviewer | 2026-07-24 | ✅ Pending |
| UAT | Audit Team | TBD | ⏳ Pending |

---

## Conclusion

Phase 6C successfully implements the Residual Risk Assessment Engine, completing the Sprint 6 control assessment workflow. The implementation:

- ✅ Follows existing architectural patterns (IIFE modules)
- ✅ Integrates seamlessly with Phase 6B effectiveness assessments
- ✅ Provides clear visual feedback with color-coded risk levels
- ✅ Records comprehensive audit trail events
- ✅ Validates prerequisites before execution
- ✅ Passes syntax validation

The phase is **READY FOR UAT**.