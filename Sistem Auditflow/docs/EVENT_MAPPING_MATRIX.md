# AuditFlow Event Mapping Matrix (Sprint 5)

**Version:** 1.0  
**Date:** 2026-07-24  
**Status:** Complete

This document maps all user actions and system events to their corresponding Audit Trail entries, ensuring comprehensive tracking across the AuditFlow application.

---

## Event Categories

| Category | Description | Actions Tracked |
|----------|-------------|-----------------|
| **Session** | User authentication and session lifecycle | `session.start`, `session.end` |
| **Project** | Project creation, updates, deletion | `project.create`, `project.update`, `project.delete`, `project.open` |
| **Flowchart** | Flowchart generation and manual edits | `flowchart.generate`, `flowchart.node.*`, `flowchart.connector.*`, `flowchart.swimlane.*`, `flowchart.layout.change` |
| **WCGW Detection** | What-Can-Go-Wrong detection workflow | `wcgw.detect`, `wcgw.accept`, `wcgw.reject`, `wcgw.mitigate` |
| **Control** | Internal control recommendation and assessment | `control.recommend.generated`, `control.effectiveness.assessed` |
| **Risk Assessment** | Residual risk calculation and analysis | `risk.residual.calculated` |
| **Audit Recommendation** | Audit procedure recommendations | `audit.recommendation.generated` |
| **Review** | Approval and review workflow | `review.approve`, `review.reject`, `review.comment` |
| **Understanding Business** | Business process description | `understanding-business.update` |
| **Export** | Data export operations | `export.pdf`, `export.json`, `export.image` |
| **Version** | Version history management | `version.save`, `version.restore`, `version.compare` |

---

## Detailed Event Mapping

### 1. Session Events

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `session.start` | `js/login.js` - Login form submission | `userId`, `email`, `role`, `userAgent`, `timestamp` | system |
| `session.end` | `js/app.js` - `AuditFlow.logout()` | `userId`, `email`, `sessionDuration`, `reason` | system |

**Implementation Notes:**
- `session.start` is recorded immediately after successful authentication
- `session.end` is recorded before clearing user session and redirecting to login

---

### 2. Project Events

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `project.create` | `js/app.js` - `AuditFlow.createProject()` | `projectId`, `projectName`, `industry`, `auditFrequency`, `businessCycle`, `createdBy`, `auditorName` | manual |
| `project.update` | `js/app.js` - `AuditFlow.saveProject()` | `projectId`, `changes`, `previousValues` | manual |
| `project.delete` | `js/app.js` - `AuditFlow.deleteProject()` | `projectId`, `projectName`, `deletedBy` | manual |
| `project.open` | Dashboard - Project card click | `projectId`, `projectName`, `lastModified` | manual |

**Implementation Status:** ✅ `project.create` Complete; ⚠️ `project.update/delete/open` Pending

---

### 3. Flowchart Events

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `flowchart.generate` | `js/flowchart-prep.js` - Generate button | `projectId`, `orientation`, `outputType`, `description`, `wordCount` | rule-engine |
| `flowchart.node.add` | `js/flowchart-state.js` - `addNode()` | `nodeId`, `nodeType`, `nodeText`, `position` | manual |
| `flowchart.node.edit` | `js/flowchart-state.js` - `updateNode()` | `nodeId`, `previousValues`, `newValues` | manual |
| `flowchart.node.delete` | `js/flowchart-state.js` - `deleteNode()` | `nodeId`, `nodeType`, `nodeText` | manual |
| `flowchart.connector.add` | `js/flowchart-state.js` - `addConnector()` | `from`, `to`, `label` | manual |
| `flowchart.connector.delete` | Future implementation | `connectorId`, `from`, `to` | manual |
| `flowchart.swimlane.add` | Future implementation | `swimlaneId`, `name`, `position` | manual |
| `flowchart.swimlane.edit` | Future implementation | `swimlaneId`, `previousValues`, `newValues` | manual |
| `flowchart.swimlane.delete` | Future implementation | `swimlaneId`, `name` | manual |
| `flowchart.layout.change` | Future implementation | `previousOrientation`, `newOrientation` | manual |
| `flowchart.lock` | Future implementation | `projectId`, `lockedBy`, `timestamp` | manual |
| `flowchart.unlock` | Future implementation | `projectId`, `unlockedBy`, `timestamp` | manual |

**Implementation Status:** ✅ Complete for node/connector add/edit/delete

---

### 4. WCGW Detection Events

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `wcgw.detect` | `js/wcgw-detection.js` - `runDetection()` | `detectionCount`, `highRiskCount`, `mediumRiskCount`, `lowRiskCount` | rule-engine |
| `wcgw.accept` | `js/wcgw-detection.js` - Accept button | `detectionId`, `riskLevel`, `assertion` | manual |
| `wcgw.reject` | `js/wcgw-detection.js` - Reject button | `detectionId`, `riskLevel`, `assertion` | manual |
| `wcgw.mitigate` | `js/wcgw-detection.js` - Mitigate button | `detectionId`, `riskLevel`, `assertion` | manual |

**Implementation Status:** ✅ Complete

---

### 4.1 Control Events (Phase 6A/6B)

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `control.recommend.generated` | `js/flowchart-editor.js` - `generateControlRecommendations()` | `projectId`, `detectionCount`, `recommendationCount`, `timestamp` | rule-engine |
| `control.effectiveness.assessed` | `js/flowchart-editor.js` - `assessControlAction()` | `projectId`, `controlId`, `controlName`, `effectivenessScore`, `effectivenessCategory`, `rationale`, `timestamp` | manual |

**Implementation Status:** ✅ Complete

---

### 4.2 Risk Assessment Events (Phase 6C)

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `risk.residual.calculated` | `js/flowchart-editor.js` - `calculateAndRenderResidualRisk()` | `projectId`, `detectionCount`, `assessmentCount`, `residualRiskCount`, `averageResidualRisk`, `averageRiskReduction`, `highRiskCount`, `mediumRiskCount`, `lowRiskCount`, `timestamp` | rule-engine |

**Implementation Status:** ✅ Complete

---

### 4.3 Audit Recommendation Events (Phase 6D)

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `audit.recommendation.generated` | `js/flowchart-editor.js` - `calculateAndRenderAuditRecommendations()` | `projectId`, `detectionCount`, `residualRiskCount`, `recommendationCount`, `highPriorityCount`, `mediumPriorityCount`, `lowPriorityCount`, `timestamp` | rule-engine |

**Implementation Status:** ✅ Complete

---

### 5. Review Events

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `review.approve` | Future implementation | `projectId`, `flowchartId`, `comments`, `score` | manual |
| `review.reject` | Future implementation | `projectId`, `flowchartId`, `comments`, `reason` | manual |
| `review.comment` | Future implementation | `projectId`, `commentId`, `content` | manual |

**Implementation Status:** ⚠️ Pending - Will be implemented in Review module

---

### 6. Understanding Business Events

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `understanding-business.update` | `js/understanding-business.js` - `saveDraft()` | `projectId`, `wordCount`, `characterCount`, `hasFile`, `version` | manual |

**Implementation Status:** ✅ Complete

---

### 7. Export Events

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `export.pdf` | Future implementation | `projectId`, `exportFormat`, `includesWCGW` | manual |
| `export.json` | `js/riskEngine.js` - `exportData()` | `projectId`, `format`, `detectionCount` | manual |
| `export.image` | Future implementation | `projectId`, `imageFormat`, `dimensions` | manual |

**Implementation Status:** ⚠️ Partial - JSON export exists but not audited

---

### 8. Version Events

| Event | Trigger Location | Context Data | Source |
|-------|------------------|--------------|--------|
| `version.save` | Future implementation | `projectId`, `versionNumber`, `label`, `changeSummary` | system |
| `version.restore` | Future implementation | `projectId`, `versionNumber`, `restoredFrom` | manual |
| `version.compare` | Future implementation | `projectId`, `versionA`, `versionB`, `differences` | manual |

**Implementation Status:** ⚠️ Pending - Will be implemented with version history feature

---

## Source Classification

| Source | Description | Examples |
|--------|-------------|----------|
| `manual` | User-initiated actions | Clicking buttons, editing fields |
| `rule-engine` | Automated detection/analysis | Flowchart generation, WCGW detection |
| `ai` | AI/ML-powered actions | Future AI suggestions, auto-classification |
| `system` | System lifecycle events | Session start/end, version auto-save |

---

## Audit Entry Structure

Every audit entry follows this structure:

```javascript
{
  id: "audit_<timestamp>_<random>",
  action: "action.type",
  userId: "user_id",
  projectId: "project_id",
  timestamp: "2026-07-24T06:00:00.000Z",
  source: "manual|rule-engine|ai|system",
  status: "active|deleted|restored",
  summary: "Human-readable summary",
  details: { /* action-specific details */ },
  sessionId: "session_id",
  userAgent: "browser_info"
}
```

---

## Implementation Checklist

| Module | File | Events | Status |
|--------|------|--------|--------|
| Login | `js/login.js` | `session.start` | ✅ Complete |
| App Core | `js/app.js` | `session.end` | ✅ Complete |
| App Core | `js/app.js` | `project.create` | ✅ Complete |
| Dashboard | `js/dashboard.js` | Activity display | ✅ Complete |
| Understanding Business | `js/understanding-business.js` | `understanding-business.update` | ✅ Complete |
| Flowchart Prep | `js/flowchart-prep.js` | `flowchart.generate` | ✅ Complete |
| Flowchart State | `js/flowchart-state.js` | `flowchart.node.*`, `flowchart.connector.*` | ✅ Complete |
| WCGW Detection | `js/wcgw-detection.js` | `wcgw.*` | ✅ Complete |
| Control Recommender | `js/flowchart-editor.js` | `control.recommend.generated` | ✅ Complete |
| Effectiveness Assessor | `js/flowchart-editor.js` | `control.effectiveness.assessed` | ✅ Complete |
| Risk Engine | `js/riskEngine.js` | Future export audit | ⚠️ Pending |
| Project Management | `js/app.js` | `project.update/delete/open` | ⚠️ Pending |
| Review Module | Future | `review.*` | ⚠️ Pending |
| Version History | Future | `version.*` | ⚠️ Pending |

---

## Non-Blocking Design

All audit recording follows the non-blocking principle:

```javascript
try {
  AuditTrail.record(action, context);
} catch (e) {
  console.warn('AuditTrail action failed:', e);
  // Silent fail - main functionality continues
}
```

This ensures that audit failures never affect the user experience or core application functionality.

---

## Storage Structure

Audit data is stored in localStorage under the key `auditflow_audit_trail`:

```javascript
{
  entries: [],      // AuditEntry[]
  versions: [],     // VersionEntry[]
  approvals: [],    // ApprovalEntry[]
  lastPruned: "2026-07-24T06:00:00.000Z"
}
```

---

**End of Event Mapping Matrix**
