# AuditFlow Architecture - Module Dependencies

**Project:** AuditFlow - Audit Flowchart Application  
**Version:** 2.0 (Post-Sprint 5)  
**Date:** 2026-07-24  
**Status:** ✅ Complete - Ready for Sprint 6

This document describes the architectural dependencies between modules in the AuditFlow application, serving as a reference for understanding data flow and integration points.

---

## Table of Contents

1. [Overview](#overview)
2. [Module Dependency Graph](#module-dependency-graph)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Module Responsibilities](#module-responsibilities)
5. [Integration Points](#integration-points)
6. [Storage Architecture](#storage-architecture)
7. [Future Architecture (Sprint 6-7)](#future-architecture-sprint-6-7)

---

## Overview

AuditFlow is a web-based audit flowchart application built with vanilla JavaScript, following a modular architecture with clear separation of concerns. The application consists of:

- **5 HTML Pages**: Login, Dashboard, Create Project, Understanding Business, Flowchart Prep/Editor
- **15 JavaScript Modules**: Core utilities, business logic, analysis, and audit trail
- **8 CSS Files**: Page-specific and component-specific styling
- **4 Documentation Files**: Schema, event mapping, validation, and migration

### Design Principles

1. **Modular Architecture**: Each module has a single responsibility
2. **Non-blocking Integration**: Audit trail failures don't affect core functionality
3. **Immutable Data**: Audit entries are write-once, read-many
4. **LocalStorage Persistence**: All data stored in browser localStorage
5. **Progressive Enhancement**: Core features work without audit trail

---

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                   HTML Pages                                 │
├─────────────┬─────────────┬──────────────┬──────────────┬──────────────────┤
│  index.html │ dashboard.  │ create-      │ understand-  │ flowchart-prep.  │
│   (Login)   │   html      │ project.html │ ing-business │     html         │
│             │ (Dashboard) │ (Wizard 1)   │    .html     │ (Wizard 3)       │
│             │             │              │  (Wizard 2)  │                  │
│             │             │              │              │ flowchart-editor.│
│             │             │              │              │     html         │
│             │             │              │              │  (Wizard 3 cont) │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬───────┴────────┬─────────┘
       │             │             │             │                │
       ▼             ▼             ▼             ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Core Application Layer                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   app.js     │  │  login.js    │  │ dashboard.js │  │create-project│   │
│  │              │  │              │  │              │  │    .js       │   │
│  │ - AuditFlow  │  │ - Login form │  │ - Project    │  │              │   │
│  │   namespace  │  │ - Validation │  │   grid       │  │ - Wizard     │   │
│  │ - Utils      │  │ - Session    │  │ - Filters    │  │   steps      │   │
│  │ - Navigation │  │   management │  │ - KPI cards  │  │ - Form       │   │
│  │ - DummyData  │  │ - Auth       │  │ - Activity   │  │   validation │   │
│  │              │  │   state      │  │   timeline   │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│         └─────────────────┴─────────────────┴─────────────────┘            │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Support Modules (Optional)                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ┌──────────────┐                  ┌──────────────┐                 │   │
│  │  │schema-       │                  │data-         │                 │   │
│  │  │validator.js  │                  │migration.js  │                 │   │
│  │  │              │                  │              │                 │   │
│  │  │ - JSON       │                  │ - Schema     │                 │   │
│  │  │   schema     │                  │   versioning │                 │   │
│  │  │   validation │                  │ - Data       │                 │   │
│  │  │ - Data type  │                  │   migration  │                 │   │
│  │  │   checking   │                  │ - Backward   │                 │   │
│  │  │              │                  │   compat     │                 │   │
│  │  └──────────────┘                  └──────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Business Logic Layer                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │understanding-│  │flowchart-    │  │flowchart-    │  │flowchart-    │   │
│  │business.js   │  │prep.js       │  │editor.js     │  │generator.js  │   │
│  │              │  │              │  │              │  │              │   │
│  │ - Text input │  │ - Orientation│  │ - Canvas     │  │ - Parser     │   │
│  │ - File upload│  │   selection  │  │   rendering  │  │ - Actor      │   │
│  │ - Text       │  │ - Output     │  │ - Node CRUD  │  │   extraction │   │
│  │   extraction │  │   type       │  │ - Connector  │  │ - Activity   │   │
│  │ - Validation │  │   selection  │  │   management │  │   extraction │   │
│  │ - Save draft │  │ - Generate   │  │ - Zoom/Pan   │  │ - Decision   │   │
│  │ - Auto-save  │  │   trigger    │  │ - Undo/Redo  │  │   extraction │   │
│  │              │  │              │  │              │  │ - Document   │   │
│  │              │  │              │  │              │  │   extraction │   │
│  │              │  │              │  │              │  │ - Database   │   │
│  │              │  │              │  │              │  │   extraction │   │
│  │              │  │              │  │              │  │ - Layout     │   │
│  │              │  │              │  │              │  │   calculation│   │
│  │              │  │              │  │              │  │ - Metadata   │   │
│  │              │  │              │  │              │  │   generation │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│         └─────────────────┴─────────────────┴─────────────────┘            │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Flowchart State & Support Modules                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │flowchart-    │  │flowchart-    │  │flowchart-    │              │   │
│  │  │state.js      │  │renderer.js   │  │interactions. │              │   │
│  │  │              │  │              │  │js            │              │   │
│  │  │ - Flowchart  │  │ - Canvas     │  │ - Node drag  │              │   │
│  │  │   data model │  │   drawing    │  │ - Click      │              │   │
│  │  │ - Node CRUD  │  │ - Shape      │  │   handling   │              │   │
│  │  │ - Connector  │  │   rendering  │  │ - Context    │              │   │
│  │  │   CRUD       │  │ - Labels     │  │   menu       │              │   │
│  │  │ - Save/Load  │  │ - Connectors │  │ - Add node   │              │   │
│  │  │ - Audit      │  │              │  │   at position│              │   │
│  │  │   hooks      │  │              │  │ - Delete     │              │   │
│  │  │              │  │              │  │   node       │              │   │
│  │  └──────────────┘  └──────────────┘  │              │              │   │
│  │                                      └──────────────┘              │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐                                │   │
│  │  │flowchart-    │  │shared-utils. │                                │   │
│  │  │undo-redo.js  │  │js            │                                │   │
│  │  │              │  │              │                                │   │
│  │  │ - Command    │  │ - Shared     │                                │   │
│  │  │   pattern    │  │   utilities  │                                │   │
│  │  │ - History    │  │ - Common     │                                │   │
│  │  │   stack      │  │   functions  │                                │   │
│  │  │ - Undo/Redo  │  │              │                                │   │
│  │  │   operations │  │              │                                │   │
│  │  └──────────────┘  └──────────────┘                                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Analysis & Detection Layer                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │wcgw-         │  │riskEngine.js │  │knowledgeBase │                     │
│  │detection.js  │  │              │  │.js           │                     │
│  │              │  │              │  │              │                     │
│  │ - Orchestrates│ │ - Rule-based │  │ - WCGW       │                     │
│  │   WCGW UI    │  │   evaluation │  │   assertions │                     │
│  │ - Detection  │  │ - Fuzzy      │  │ - Risk rules │                     │
│  │   workflow   │  │   matching   │  │ - Control    │                     │
│  │ - Manages    │  │ - Process    │  │   objectives │                     │
│  │   detection  │  │   extraction │  │              │                     │
│  │   lifecycle  │  │              │  │              │                     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘                     │
│         │                 │                                                │
│         ▼                 ▼                                                │
│  ┌──────────────┐  ┌──────────────┐                                       │
│  │wcgw-         │  │wcgw-         │                                       │
│  │detection-    │  │detection-    │                                       │
│  │ui.js         │  │actions.js    │                                       │
│  │              │  │              │                                       │
│  │ - Detection  │  │ - Accept     │                                       │
│  │   panel UI   │  │   detection  │                                       │
│  │ - Stats      │  │ - Reject     │                                       │
│  │   display    │  │   detection  │                                       │
│  │ - Detail     │  │ - Mitigate   │                                       │
│  │   modal      │  │ - Export     │                                       │
│  │              │  │   report     │                                       │
│  └──────────────┘  └──────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Audit Trail Layer (Sprint 5)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │audit-trail.  │  │audit-        │  │activity-     │                     │
│  │js            │  │formatter.js  │  │timeline.js   │                     │
│  │              │  │              │  │              │                     │
│  │ - record()   │  │ - format()   │  │ - render()   │                     │
│  │ - getTimeline│  │ - formatChange│ │ - Filtering  │                     │
│  │ - getVersions│  │   ()         │  │ - Icons      │                     │
│  │ - getApprovals│ │ - formatParser│ │ - Badges     │                     │
│  │ - exportData │  │   Metadata() │  │              │                     │
│  │ - prune()    │  │              │  │              │                     │
│  │ - getRecent  │  │              │  │              │                     │
│  │   Activities │  │              │  │              │                     │
│  │ - getStatistics│ │              │  │              │                     │
│  │              │  │              │  │              │                     │
│  │ Storage:     │  │ Templates:   │  │ Display:     │                     │
│  │ localStorage │  │ All action   │  │ Dashboard    │                     │
│  │ Key:         │  │ types        │  │ Project      │                     │
│  │ auditflow_   │  │ covered      │  │ Detail       │                     │
│  │ audit_trail  │  │              │  │              │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
│                                                                              │
│  Audit Action Types Connected (12 total):                                   │
│  - session.start / session.end                                            │
│  - flowchart.generate                                                     │
│  - flowchart.node.add / edit / delete                                     │
│  - flowchart.connector.add                                                │
│  - wcgw.detect / accept / reject / mitigate                               │
│  - understanding-business.update                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Data Layer                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         localStorage                                  │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  Key: auditflow_user                 → User session data             │  │
│  │  Key: auditflow_projects             → Projects list                 │  │
│  │  Key: auditflow_current_project      → Current project state         │  │
│  │  Key: auditflow_audit_trail          → Audit entries, versions, approvals │
│  │  Key: auditflow_schema_version       → Schema version for migration  │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Example 1: User Login → Dashboard

```
index.html (login form)
    │
    ▼
login.js (validate email, password, role)
    │
    ▼ (on success)
AuditTrail.record('session.start', {...}) ← Audit Hook (Sprint 5)
    │
    ▼
AuditFlow.setUser(user) → localStorage.setItem('auditflow_user', ...)
    │
    ▼
Navigation.goToDashboard() → window.location.href = 'dashboard.html'
    │
    ▼
dashboard.html loads
    │
    ▼
dashboard.js (load projects from AuditFlow.getProjectsList())
    │
    ▼
AuditTrail.getRecentActivities(10) ← Audit Query (Sprint 5)
    │
    ▼
Render activity timeline in Dashboard
```

### Example 2: Generate Flowchart

```
flowchart-prep.html (select orientation & output type)
    │
    ▼
flowchart-prep.js (user clicks "Generate Flowchart")
    │
    ▼
showGeneratingModal() → showSuccessModal()
    │
    ▼
AuditTrail.record('flowchart.generate', {
    projectId, orientation, outputType, description, wordCount,
    parserMetadata: {...}
}) ← Audit Hook (Sprint 5)
    │
    ▼
FlowchartGenerator.generate(text, options)
    │
    ├─► Parser.extractActors(text) → actors[]
    ├─► Parser.extractActivities(text) → activities[]
    ├─► Parser.extractDecisions(text) → decisions[]
    ├─► Parser.extractDocuments(text) → documents[]
    ├─► Parser.extractDatabases(text) → databases[]
    │
    ▼
LayoutCalculator.calculate(actors, activities, orientation)
    │
    ▼
Flowchart data saved to project → AuditFlow.saveProject(project)
    │
    ▼
Redirect to flowchart-editor.html
```

### Example 3: Edit Flowchart Node (with Audit)

```
flowchart-editor.html (canvas)
    │
    ▼
flowchart-interactions.js (user clicks to add node)
    │
    ▼
flowchart-interactions.addNodeAtPosition(x, y, type, text)
    │
    ▼
flowchart-state.addNode(node)
    │
    ▼
AuditTrail.record('flowchart.node.add', {
    projectId, nodeId, nodeType, nodeText, position,
    entityType: 'node', entityId: node.id
}) ← Audit Hook (Sprint 5)
    │
    ▼
flowchart-renderer.drawNode(node)
    │
    ▼
Canvas updated visually
```

### Example 4: WCGW Detection Workflow

```
flowchart-editor.html (WCGW panel)
    │
    ▼
wcgw-detection.js (user clicks "Run Detection")
    │
    ▼
WCGWDetection.runDetection()
    │
    ▼
RiskEngine.init(projectInfo, flowchartData)
    │
    ▼
RiskEngine.runDetection() → detections[]
    │
    ▼
AuditTrail.record('wcgw.detect', {
    projectId, detectionCount, highRiskCount,
    mediumRiskCount, lowRiskCount, wcgwMetadata: {...}
}) ← Audit Hook (Sprint 5)
    │
    ▼
wcgw-detection-ui.js (show detection panel with results)
    │
    ▼
User clicks "Accept" on a detection
    │
    ▼
wcgw-detection-actions.acceptDetection(id)
    │
    ▼
AuditTrail.record('wcgw.accept', {
    projectId, detectionId, riskLevel, assertion
}) ← Audit Hook (Sprint 5)
    │
    ▼
UI updated (detection marked as accepted)
```

---

## Module Responsibilities

| Module | File | Responsibility | Dependencies |
|--------|------|----------------|--------------|
| **Core App** | `js/app.js` | Global state, utilities, navigation, dummy data | None |
| **Login** | `js/login.js` | Authentication, session start, form validation | `app.js`, `AuditTrail` |
| **Dashboard** | `js/dashboard.js` | Project grid, KPI display, activity timeline | `app.js`, `AuditTrail`, `activity-timeline.js` |
| **Create Project** | `js/create-project.js` | Project creation wizard step 1 | `app.js` |
| **Understanding Business** | `js/understanding-business.js` | Business description input, file upload, text extraction | `app.js`, `AuditTrail` |
| **Flowchart Prep** | `js/flowchart-prep.js` | Flowchart generation setup (orientation, output type) | `app.js`, `AuditTrail` |
| **Flowchart Generator** | `js/flowchart-generator.js` | Text parsing, actor/activity/decision extraction, layout | None (pure functions) |
| **Flowchart Editor** | `js/flowchart-editor.js` | Main editor UI initialization | `flowchart-state.js`, `flowchart-renderer.js`, `flowchart-interactions.js` |
| **Flowchart State** | `js/flowchart-state.js` | Flowchart data model, node/connector CRUD, save/load | `AuditTrail` |
| **Flowchart Renderer** | `js/flowchart-renderer.js` | Canvas drawing, shape rendering, connector drawing | `flowchart-state.js` |
| **Flowchart Interactions** | `js/flowchart-interactions.js` | User interactions (drag, click, context menu) | `flowchart-state.js`, `flowchart-renderer.js` |
| **Flowchart Undo/Redo** | `js/flowchart-undo-redo.js` | Command pattern, history stack | `flowchart-state.js` |
| **Flowchart Prep** | `js/flowchart-prep.js` | Generation configuration | `app.js`, `AuditTrail` |
| **WCGW Detection** | `js/wcgw-detection.js` | Orchestrates WCGW detection workflow | `riskEngine.js`, `wcgw-detection-ui.js`, `AuditTrail` |
| **Risk Engine** | `js/riskEngine.js` | Rule-based evaluation, fuzzy matching | `knowledgeBase.js` |
| **Knowledge Base** | `js/knowledgeBase.js` | WCGW assertions, risk rules, control objectives | None (data only) |
| **WCGW Detection UI** | `js/wcgw-detection-ui.js` | Detection panel UI, stats display | None |
| **WCGW Detection Actions** | `js/wcgw-detection-actions.js` | Accept/reject/mitigate actions | `AuditTrail` |
| **Audit Trail** | `js/audit-trail.js` | Core audit service, recording, querying | None (standalone) |
| **Audit Formatter** | `js/audit-formatter.js` | Centralized summary formatting | None (pure functions) |
| **Activity Timeline** | `js/activity-timeline.js` | Reusable timeline UI component | `AuditTrail` |
| **Schema Validator** | `js/schema-validator.js` | JSON schema validation | None (optional) |
| **Data Migration** | `js/data-migration.js` | Schema versioning, data migration | None (optional) |
| **Shared Utils** | `js/shared-utils.js` | Common utilities across modules | None |

---

## Integration Points

### Audit Trail Integration Pattern

Every module that performs meaningful actions should follow this pattern:

```javascript
// 1. Check if AuditTrail is available
if (typeof AuditTrail !== 'undefined') {
    try {
        // 2. Record action with context
        AuditTrail.record(actionType, {
            userId: AuditFlow.currentUser?.id,
            projectId: AuditFlow.getCurrentProject()?.id,
            // ... action-specific details
            source: 'manual' | 'rule-engine' | 'ai' | 'system'
        });
    } catch (e) {
        // 3. Handle errors gracefully - never block main functionality
        console.warn('AuditTrail recording failed:', e);
    }
}
```

### Current Integration Points (Sprint 5)

| Module | File | Action Types | Status |
|--------|------|--------------|--------|
| Login | `js/login.js` | `session.start` | ✅ Complete |
| App Core | `js/app.js` | `session.end` | ✅ Complete |
| Dashboard | `js/dashboard.js` | Activity display (read-only) | ✅ Complete |
| Understanding Business | `js/understanding-business.js` | `understanding-business.update` | ✅ Complete |
| Flowchart Prep | `js/flowchart-prep.js` | `flowchart.generate` | ✅ Complete |
| Flowchart State | `js/flowchart-state.js` | `flowchart.node.add/edit/delete`, `flowchart.connector.add` | ✅ Complete |
| WCGW Detection | `js/wcgw-detection.js` | `wcgw.detect/accept/reject/mitigate` | ✅ Complete |

### Future Integration Points (Sprint 6-7)

| Module | Action Types | Priority | Notes |
|--------|--------------|----------|-------|
| Project Management | `project.create`, `project.update`, `project.delete`, `project.open` | High | Will be implemented with project management module |
| Flowchart Locking | `flowchart.lock`, `flowchart.unlock` | High | For multi-user collaboration |
| Swimlane Management | `flowchart.swimlane.add/edit/delete` | Medium | Enhanced flowchart editing |
| Layout Management | `flowchart.layout.change` | Low | Orientation changes after generation |
| Review & Approval | `review.approve`, `review.reject`, `review.comment` | High | Review workflow module |
| Export Features | `export.pdf`, `export.json`, `export.image` | Medium | Documentation export |
| Version History | `version.save`, `version.restore`, `version.compare` | High | Version control system |

---

## Storage Architecture

### localStorage Keys

| Key | Purpose | Data Structure | Managed By |
|-----|---------|----------------|------------|
| `auditflow_user` | Current user session | `{id, email, name, role}` | `AuditFlow` |
| `auditflow_projects` | Projects list | `ProjectSummary[]` | `AuditFlow` |
| `auditflow_current_project` | Current project state | `Project` | `AuditFlow` |
| `auditflow_audit_trail` | Audit trail data | `{entries, versions, approvals}` | `AuditTrail` |
| `auditflow_schema_version` | Schema version for migration | `{version, migratedAt}` | `DataMigration` |

### Audit Trail Storage Structure

```javascript
// localStorage key: auditflow_audit_trail
{
  entries: [
    // AuditEntry[] - All audit log entries
    {
      id: "audit_timestamp_random",
      projectId: "project_id",
      type: "action.type",
      timestamp: "2026-07-24T06:00:00.000Z",
      userId: "user_id",
      source: "manual|rule-engine|ai|system",
      status: "active|deleted|restored",
      summary: "Human-readable summary",
      details: { /* action-specific details */ },
      entityType: "node|connector|detection|...",
      entityId: "specific_entity_id",
      sessionId: "session_id",
      userAgent: "browser_info"
    }
  ],
  versions: [
    // VersionEntry[] - Version history snapshots
    {
      id: "version_timestamp_random",
      projectId: "project_id",
      versionNumber: 1,
      timestamp: "2026-07-24T06:00:00.000Z",
      userId: "user_id",
      action: "flowchart.generate",
      changeSummary: ["Added 5 nodes", "Added 4 connectors"],
      snapshot: { /* flowchart data */ },
      snapshotOmitted: false
    }
  ],
  approvals: [
    // ApprovalEntry[] - Approval/review records
    {
      id: "approval_timestamp_random",
      projectId: "project_id",
      status: "approve|reject|comment",
      timestamp: "2026-07-24T06:00:00.000Z",
      userId: "user_id",
      reviewerId: "reviewer_id",
      comments: "Approval comments",
      approvalData: { /* approval details */ }
    }
  ],
  lastPruned: "2026-07-24T06:00:00.000Z"
}
```

---

## Future Architecture (Sprint 6-7)

### Planned Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         New Modules (Sprint 6-7)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │project-      │  │review-       │  │version-      │  │export-       │   │
│  │management.js │  │workflow.js   │  │history.js    │  │service.js    │   │
│  │              │  │              │  │              │  │              │   │
│  │ - Project    │  │ - Review     │  │ - Version    │  │ - PDF export │   │
│  │   CRUD       │  │   assignment │  │   snapshots  │  │ - JSON       │   │
│  │ - Project    │  │ - Approval   │  │ - Version    │  │   export     │   │
│  │   list       │  │   workflow   │  │   comparison │  │ - Image      │   │
│  │   management │  │ - Comments   │  │ - Restore    │  │   export     │   │
│  │ - Project    │  │   and        │  │   previous   │  │ - Report     │   │
│  │   permissions│  │   feedback   │  │   versions   │  │   generation │   │
│  │              │  │              │  │              │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│         └─────────────────┴─────────────────┴─────────────────┘            │
│                                   │                                         │
│                                   ▼                                         │
│                    All integrate with AuditTrail                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### New Audit Action Types (Planned)

| Category | Action Types | Sprint |
|----------|--------------|--------|
| Project Management | `project.create`, `project.update`, `project.delete`, `project.open` | 6 |
| Flowchart Locking | `flowchart.lock`, `flowchart.unlock` | 6 |
| Swimlane Management | `flowchart.swimlane.add`, `flowchart.swimlane.edit`, `flowchart.swimlane.delete` | 6 |
| Layout Management | `flowchart.layout.change` | 6 |
| Review & Approval | `review.approve`, `review.reject`, `review.comment` | 7 |
| Export Features | `export.pdf`, `export.json`, `export.image` | 7 |
| Version History | `version.save`, `version.restore`, `version.compare` | 7 |

---

## Conclusion

This architecture provides a clear separation of concerns with the following layers:

1. **HTML Pages** - User interface entry points
2. **Core Application Layer** - Global state, utilities, authentication
3. **Business Logic Layer** - Domain-specific functionality (Understanding Business, Flowchart, WCGW)
4. **Analysis & Detection Layer** - Risk engine and WCGW detection
5. **Audit Trail Layer** - Immutable activity tracking (Sprint 5)
6. **Data Layer** - localStorage persistence

The modular design allows for independent development and testing of each component, with clear integration points through the Audit Trail system for comprehensive activity tracking.

---

**Document Version:** 2.0  
**Last Updated:** 2026-07-24  
**Status:** ✅ Complete - Ready for Sprint 6
