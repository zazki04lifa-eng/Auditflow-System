# AuditFlow Data Schemas
## Permanent Contract for Sprint 4+

**Version:** 3.0
**Date:** 2026-07-24
**Status:** Draft - awaiting approval

### Changelog
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-23 | Initial schema documentation |
| 2.0 | 2026-07-23 | Major revisions: removed Node.wcgw, added version history, audit trail fields, assertion standardization |
| 3.0 | 2026-07-24 | Renamed auditCycle → auditFrequency, added businessCycle field to projectInfo |

---

## Overview

This document defines the canonical data schemas for AuditFlow. These schemas serve as the "permanent contract" for data structures used across the application, ensuring consistency for Sprint 4 (Flowchart Generator) and future development.

---

## 1. Node Schema

Represents a single node in the flowchart editor.

### Structure

```typescript
interface Node {
  // Core Identity
  id: number;                    // Unique numeric identifier (auto-increment)
  type: NodeType;                // Shape type (see NodeType enum)
  
  // Display Properties
  text: string;                  // Label text displayed on the node
  x: number;                     // X coordinate on canvas (pixels)
  y: number;                     // Y coordinate on canvas (pixels)
  color?: string;                // Optional custom color (hex or CSS color)
  swimlane?: string;             // Optional swimlane ID reference
  
  // WCGW Detection References (Sprint 3)
  // Note: WCGW data is stored centrally in WCGWDetection, not duplicated here
  wcgwDetectionIds?: string[];   // Array of WCGWDetection.id that reference this node
}

type NodeType = 
  | 'terminator'           // Start/End oval
  | 'process'              // Rectangle (process step)
  | 'decision'             // Diamond (yes/no branch)
  | 'manual-input'         // Trapezoid (manual entry)
  | 'manual-operation'     // Trapezoid with jagged sides
  | 'document'             // Document shape
  | 'multiple-documents'   // Stacked documents
  | 'database'             // Cylinder (data storage)
  | 'connector'            // Small circle (off-page reference)
  | 'off-page'             // Home plate shape
  | 'swimlane'             // Container lane (special type)
  ;
```

### Example

```javascript
{
  id: 1,
  type: 'process',
  text: 'Record Sales Transaction',
  x: 120,
  y: 80,
  color: '#4A90D9',
  swimlane: 'lane1',
  wcgwDetectionIds: ['det_1706119234567_abc123']  // References to WCGW detections
}
```

### Validation Rules

1. `id` must be unique within the flowchart
2. `type` must be a valid NodeType
3. `text` must be non-empty string
4. `x` and `y` must be numbers
5. If `wcgwDetectionIds` exists, it must be an array of valid WCGWDetection.id strings

---

## 2. Connector Schema

Represents a connection between two nodes.

### Structure

```typescript
interface Connector {
  // Core Identity
  id: string;                  // Unique string identifier (UUID or similar)
  
  // Connection Points
  from: number;                // Source node ID
  to: number;                  // Target node ID
  
  // Display Properties
  label?: string;              // Optional label (e.g., "Yes", "No")
  color?: string;              // Optional custom color
  dashed?: boolean;            // Optional dashed line style
  
  // Metadata
  order?: number;              // Optional rendering order
}
```

### Example

```javascript
{
  id: 'conn_1',
  from: 1,
  to: 2,
  label: 'Yes',
  color: '#28a745'
}
```

### Validation Rules

1. `from` and `to` must reference existing node IDs
2. `from` cannot equal `to` (no self-loops in MVP)
3. `id` must be unique within the flowchart

---

## 3. Swimlane Schema

Represents a container lane for organizing nodes.

### Structure

```typescript
interface Swimlane {
  // Core Identity
  id: string;                  // Unique string identifier
  name: string;                // Display name (e.g., "Finance", "Procurement")
  
  // Layout Properties
  x: number;                   // X position of lane
  y: number;                   // Y position of lane
  width: number;               // Lane width in pixels
  height: number;              // Lane height in pixels
  
  // Optional Metadata
  color?: string;              // Optional header color
  order?: number;              // Rendering order
}
```

### Example

```javascript
{
  id: 'lane1',
  name: 'Finance Department',
  x: 50,
  y: 50,
  width: 300,
  height: 600,
  color: '#E3F2FD'
}
```

### Validation Rules

1. `id` must be unique within the flowchart
2. `name` must be non-empty string
3. `width` and `height` must be positive numbers

---

## 4. Flowchart Schema

Complete flowchart data structure.

### Structure

```typescript
interface Flowchart {
  // Core Data
  nodes: Node[];               // All flowchart nodes
  connectors: Connector[];     // All connections
  swimlanes: Swimlane[];       // All swimlanes (can be empty)
  
  // Layout & State
  orientation: 'vertical' | 'horizontal';  // Layout direction
  locked: boolean;             // Lock status (prerequisite for Audit Analysis)
  lockedAt?: string;           // ISO 8601 timestamp when locked
  lockedBy?: string;           // User ID who locked the flowchart
  
  // Version History (for FR-11: Compare & Restore)
  versionHistory: VersionSnapshot[];
  
  // Audit Trail
  createdBy: string;           // User ID of creator
  updatedBy: string;           // User ID of last editor
  
  // Metadata
  title?: string;              // Flowchart title
  description?: string;        // Flowchart description
  createdAt: string;           // ISO 8601 timestamp
  updatedAt: string;           // ISO 8601 timestamp
}

interface VersionSnapshot {
  version: number;             // Version number (incremental)
  timestamp: string;           // ISO 8601 timestamp
  editor: string;              // User ID who made changes
  changes?: string;            // Description of changes
  snapshot: {
    nodes: Node[];
    connectors: Connector[];
    swimlanes: Swimlane[];
  };
}
```

### Example

```javascript
{
  nodes: [
    { id: 1, type: 'terminator', text: 'Start', x: 100, y: 50, swimlane: 'lane1' },
    { id: 2, type: 'process', text: 'Record Sale', x: 100, y: 150, swimlane: 'lane1' },
    { id: 3, type: 'decision', text: 'Approved?', x: 100, y: 250, swimlane: 'lane1' }
  ],
  connectors: [
    { id: 'conn_1', from: 1, to: 2 },
    { id: 'conn_2', from: 2, to: 3 },
    { id: 'conn_3', from: 3, to: 4, label: 'Yes' },
    { id: 'conn_4', from: 3, to: 5, label: 'No' }
  ],
  swimlanes: [
    { id: 'lane1', name: 'Finance', x: 50, y: 50, width: 300, height: 600 }
  ],
  orientation: 'vertical',
  locked: false,
  versionHistory: [
    {
      version: 1,
      timestamp: '2024-01-20T10:30:00.000Z',
      editor: 'user_abc123',
      changes: 'Initial flowchart creation',
      snapshot: { nodes: [...], connectors: [...], swimlanes: [...] }
    }
  ],
  createdBy: 'user_abc123',
  updatedBy: 'user_abc123',
  createdAt: '2024-01-20T10:30:00.000Z',
  updatedAt: '2024-01-20T10:30:00.000Z'
}
```

### Validation Rules

1. All node IDs referenced in connectors must exist in `nodes`
2. All swimlane IDs referenced in nodes must exist in `swimlanes`
3. If `locked` is true, `lockedAt` and `lockedBy` must be present
4. `versionHistory` must contain at least one snapshot
5. `createdBy` and `updatedBy` must be valid User.id values
6. `createdAt` and `updatedAt` must be valid ISO 8601 timestamps

### Version History Behavior

**Project.versionHistory vs Flowchart.versionHistory:**
- **Independent tracking:** Project tracks high-level changes (status, progress, wizard steps)
- **Flowchart tracks detailed changes:** Node positions, connector changes, WCGW edits
- **Sync on restore:** When restoring a Project version, the embedded Flowchart is also restored to its state at that point, maintaining consistency
- **No cross-contamination:** Editing flowchart creates new Flowchart.versionHistory entry but doesn't automatically create Project.versionHistory entry (unless explicitly saved)

---

## 5. Project Schema

Complete project data structure stored in localStorage.

### Structure

```typescript
interface Project {
  // Core Identity
  id: string;                  // Unique project ID (format: 'proj-' + random)
  name: string;                // Project name
  status: ProjectStatus;       // Current status
  
  // Schema Versioning (for localStorage migrations)
  schemaVersion: number;       // Current schema version (for migrations)
  
  // Progress Tracking
  progress: number;            // 0-100 percentage
  currentStep?: number;        // 1-7 wizard step
  
  // Audit Trail
  createdBy: string;           // User ID of creator
  updatedBy: string;           // User ID of last editor
  
  // Timestamps
  createdAt: string;           // ISO 8601 timestamp
  lastModified: string;        // ISO 8601 timestamp
  
  // Version History (for FR-11: Compare & Restore)
  versionHistory: ProjectVersionSnapshot[];
  
  // Wizard Steps Data
  projectInfo?: {
    projectName: string;
    auditorName: string;
    companyName: string;
    industry: string;
    auditFrequency: 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Monthly' | 'Ad-hoc';  // Renamed from auditCycle (v3.0)
    businessCycle: 'Expenditure Cycle' | 'Revenue Cycle' | 'Payroll Cycle' | 'Inventory Cycle' | 'Treasury Cycle' | 'Fixed Asset Cycle' | 'Production Cycle' | 'Procurement Cycle' | 'Cash Receipt Cycle' | 'Cash Disbursement Cycle' | 'Other';  // New field (v3.0) - from Knowledge Base Flowchart Library
    businessCycleOther?: string;  // Custom business cycle if "Other" is selected (v3.0) - required when businessCycle = 'Other'
    startDate: string;         // ISO 8601 date
    endDate: string;           // ISO 8601 date
    notes?: string;
  };
  
  understandingBusiness?: {
    description: string;       // Business process description
    version?: number;          // Version number for tracking changes
    source?: 'text' | 'upload'; // Input method used
  };
  
  flowchartPrep?: {
    orientation: 'vertical' | 'horizontal';
    output: 'flowchart-only' | 'flowchart-wcgw';
  };
  
  flowchart?: Flowchart;       // Complete flowchart data (see Flowchart Schema)
  
  auditAnalysis?: {
    detections?: WCGWDetection[];  // WCGW detection results
    // Future: Risk assessment, control recommendations
  };
  
  review?: ReviewData;         // Review and anchor comments
  
  export?: {
    format: 'png' | 'jpg' | 'pdf' | 'docx';
    exportedAt?: string;
    exportData?: any;
  };
}

interface ProjectVersionSnapshot {
  version: number;
  timestamp: string;
  editor: string;
  changes?: string;
  // Snapshot includes ALL project data for full restoration:
  // - projectInfo, understandingBusiness, flowchartPrep
  // - flowchart (with its own versionHistory)
  // - auditAnalysis (with WCGW detections)
  // - review, export
  // When restoring, both Project.versionHistory and Flowchart.versionHistory
  // are restored together to maintain consistency.
  snapshot: {
    status: ProjectStatus;
    progress: number;
    currentStep?: number;
    projectInfo?: Project['projectInfo'];
    understandingBusiness?: Project['understandingBusiness'];
    flowchartPrep?: Project['flowchartPrep'];
    flowchart?: Project['flowchart'];
    auditAnalysis?: Project['auditAnalysis'];
    review?: Project['review'];
    export?: Project['export'];
  };
}

type ProjectStatus = 
  | 'draft'           // Not yet started
  | 'in-progress'     // Currently being worked on
  | 'review'          // Under review
  | 'completed'       // Finished and approved
  ;
```

### Example

```javascript
{
  id: 'proj-abc123',
  name: 'Audit PT Maju Jaya',
  status: 'in-progress',
  schemaVersion: 2,
  progress: 70,
  createdBy: 'user_abc123',
  updatedBy: 'user_abc123',
  createdAt: '2024-01-15T08:00:00.000Z',
  lastModified: '2024-01-20T10:30:00.000Z',
  versionHistory: [
    {
      version: 1,
      timestamp: '2024-01-15T08:00:00.000Z',
      editor: 'user_abc123',
      changes: 'Initial project creation',
      snapshot: { status: 'draft', progress: 0 }
    }
  ],
  projectInfo: {
    projectName: 'Audit PT Maju Jaya',
    auditorName: 'Zazkia Nur Alifa',
    companyName: 'PT Maju Jaya',
    industry: 'Manufaktur',
    auditCycle: 'Annual',
    startDate: '2024-01-15',
    endDate: '2024-02-28'
  },
  understandingBusiness: {
    description: 'Perusahaan bergerak di bidang manufaktur...',
    version: 1,
    source: 'text'
  },
  flowchartPrep: {
    orientation: 'vertical',
    output: 'flowchart-wcgw'
  },
  flowchart: {
    nodes: [/* ... */],
    connectors: [/* ... */],
    swimlanes: [/* ... */],
    locked: false,
    versionHistory: [/* ... */],
    createdBy: 'user_abc123',
    updatedBy: 'user_abc123'
  }
}
```

### Validation Rules

1. `id` must be unique across all projects
2. `status` must be a valid ProjectStatus
3. `progress` must be between 0 and 100
4. `schemaVersion` must be a positive integer
5. If `projectInfo` exists, all required fields must be present
6. If `flowchart` exists, it must conform to Flowchart Schema
7. `createdBy` and `updatedBy` must be valid User.id values
8. `versionHistory` must contain at least one snapshot
9. `createdAt` and `lastModified` must be valid ISO 8601 timestamps

---

## 6. WCGW Detection Schema

Result structure from RiskEngine detection. This is the **single source of truth** for WCGW data.

### Structure

```typescript
interface WCGWDetection {
  // Core Identity
  id: string;                  // Unique detection ID (format: 'det_' + timestamp + random)
  ruleId: string;              // Reference to triggered rule
  
  // Rule Information
  ruleName: string;            // Human-readable rule name
  description: string;         // Rule description
  assertion: AssertionKey;     // Assertion type (lowercase-dash format)
  riskLevel: RiskLevel;
  
  // Detection Details
  confidence: number;          // 0-100 match confidence percentage
  triggerProcess?: string;     // Name of triggering process
  triggerNodeId?: number;      // ID of triggering node
  
  // Related Entities
  assertionDetails?: {         // Full assertion object from KnowledgeBase
    id: AssertionKey;
    name: string;
    description: string;
  };
  riskDetails?: {              // Full risk object from KnowledgeBase
    id: RiskLevel;
    name: string;
    description: string;
    color: string;
  };
  
  // Missing Controls
  missingControls?: Array<{
    keyword: string;           // Process keyword that's missing
    suggestedProcesses: string[]; // Suggested process names
  }>;
  
  // WCGW & Controls
  wcgw?: Array<{
    id: string;
    name: string;
    description: string;
    indicators?: string[];
  }>;
  recommendedControls?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  
  // Status & Override
  status: DetectionStatus;
  manualOverride?: {
    action: 'accepted' | 'rejected' | 'mitigated';
    notes?: string;
    mitigationPlan?: string;
    timestamp: string;         // ISO 8601 timestamp
  };
  
  // Audit Trail
  createdBy?: string;          // User ID (system or manual)
  updatedBy?: string;          // User ID who last modified
  
  // Metadata
  createdAt: string;           // ISO 8601 timestamp
  updatedAt: string;           // ISO 8601 timestamp
}

// Standardized assertion key format (lowercase-dash)
type AssertionKey = 
  | 'occurrence'
  | 'authorization'
  | 'accuracy'
  | 'completeness'
  | 'classification'
  | 'cutoff'
  | 'existence'
  | 'rights-and-obligations'
  | 'valuation'
  ;

type RiskLevel = 'high' | 'medium' | 'low';

type DetectionStatus = 'pending' | 'accepted' | 'rejected' | 'mitigated';
```

### Example

```javascript
{
  id: 'det_1706119234567_abc123',
  ruleId: 'sales-no-shipping',
  ruleName: 'Penjualan Tanpa Dokumen Pengiriman',
  description: 'Proses pencatatan penjualan ada tetapi tidak ada proses pengiriman barang',
  assertion: 'occurrence',           // ← lowercase-dash format
  riskLevel: 'high',
  confidence: 85,
  triggerProcess: 'Record Sale',
  triggerNodeId: 2,
  missingControls: [
    {
      keyword: 'ship-goods',
      suggestedProcesses: ['Send Goods', 'Create Delivery Order', 'Ship Products']
    }
  ],
  wcgw: [
    {
      id: 'fictitious-sales',
      name: 'Penjualan Fiktif',
      description: 'Pencatatan penjualan untuk barang yang tidak benar-benar terkirim'
    }
  ],
  recommendedControls: [
    {
      id: 'documentation-requirements',
      name: 'Persyaratan Dokumen',
      description: 'Setiap transaksi harus didukung oleh dokumen lengkap'
    }
  ],
  status: 'pending',
  createdBy: 'system',
  createdAt: '2024-01-24T10:30:00.000Z',
  updatedAt: '2024-01-24T10:30:00.000Z'
}
```

### Validation Rules

1. `id` must be unique within detection results
2. `assertion` must use lowercase-dash format (e.g., 'occurrence', not 'Occurrence')
3. `riskLevel` must be one of: 'high', 'medium', 'low'
4. `confidence` must be between 0 and 100
5. `status` must be one of: 'pending', 'accepted', 'rejected', 'mitigated'
6. If `status` is not 'pending', `manualOverride` must exist
7. `createdAt` and `updatedAt` must be valid ISO 8601 timestamps

---

## 7. User Schema

User authentication and profile data.

### Structure

```typescript
interface User {
  // Core Identity
  id: string;                  // Unique user ID
  email: string;               // Email address (login credential)
  name: string;                // Full display name (formatted from email)
  role: 'auditor' | 'supervisor';
  
  // Session
  remember?: boolean;          // Remember me preference
}
```

### Example

```javascript
{
  id: 'user_abc123',
  email: 'zazkia.nur.alifa@auditflow.com',
  name: 'Zazkia Nur Alifa',    // ← Formatted from email
  role: 'auditor',
  remember: true
}
```

### Validation Rules

1. `email` must be valid email format
2. `name` must be properly formatted (Title Case, not extracted directly from email)
3. `role` must be 'auditor' or 'supervisor'

---

## 8. Review Schema

Review data with anchor comments for Sprint 5.

### Structure

```typescript
interface ReviewData {
  // Review Status
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  reviewerNotes?: string;      // Overall review notes
  reviewedAt?: string;         // ISO 8601 timestamp
  reviewedBy?: string;         // User ID of reviewer
  
  // Anchor Comments (comments attached to specific nodes/sections)
  comments: AnchorComment[];
}

interface AnchorComment {
  // Core Identity
  id: string;                  // Unique comment ID
  
  // Target Reference
  targetType: 'node' | 'connector' | 'swimlane' | 'section';
  targetId: number | string;   // ID of the target element
  
  // Comment Content
  author: string;              // User ID of comment author
  text: string;                // Comment text
  status: 'open' | 'resolved' | 'rejected';
  
  // Metadata
  createdAt: string;           // ISO 8601 timestamp
  updatedAt?: string;          // ISO 8601 timestamp
  resolvedAt?: string;         // ISO 8601 timestamp
  resolvedBy?: string;         // User ID who resolved
}
```

### Example

```javascript
{
  status: 'in-review',
  reviewerNotes: 'Overall flowchart looks good, but need to verify shipping process',
  reviewedAt: '2024-01-25T14:30:00.000Z',
  reviewedBy: 'user_supervisor123',
  comments: [
    {
      id: 'comment_abc123',
      targetType: 'node',
      targetId: 2,
      author: 'user_supervisor123',
      text: 'Please verify this process matches the actual workflow',
      status: 'open',
      createdAt: '2024-01-25T14:25:00.000Z'
    },
    {
      id: 'comment_def456',
      targetType: 'connector',
      targetId: 'conn_3',
      author: 'user_supervisor123',
      text: 'This decision path should be labeled "Approved"',
      status: 'resolved',
      createdAt: '2024-01-25T14:26:00.000Z',
      resolvedAt: '2024-01-25T14:30:00.000Z',
      resolvedBy: 'user_abc123'
    }
  ]
}
```

### Validation Rules

1. `status` must be one of: 'pending', 'in-review', 'approved', 'rejected'
2. If `status` is not 'pending', `reviewedBy` and `reviewedAt` must be present
3. Each `comment.id` must be unique within the project
4. `targetType` must be one of: 'node', 'connector', 'swimlane', 'section'
5. `targetId` must reference an existing element of the specified `targetType`
6. `comment.status` must be one of: 'open', 'resolved', 'rejected'

---

## Assertion Key Standardization

### Decision: Lowercase-Dash Format

**Effective immediately**, all new code and data storage must use lowercase-dash format for assertion keys:

| Old Format (Capitalized) | New Format (Lowercase-Dash) |
|--------------------------|-----------------------------|
| 'Occurrence' | 'occurrence' |
| 'Authorization' | 'authorization' |
| 'Accuracy' | 'accuracy' |
| 'Completeness' | 'completeness' |
| 'Classification' | 'classification' |
| 'Cutoff' | 'cutoff' |
| 'Existence' | 'existence' |
| 'Rights and Obligations' | 'rights-and-obligations' |
| 'Valuation' | 'valuation' |

### Migration Strategy

1. **Knowledge Base:** Keep both formats as aliases during transition
2. **New Detections:** Store using lowercase-dash format only
3. **Existing Data:** Create mapping function for backward compatibility
4. **Single Source:** All lookups use lowercase-dash `id` field

### Mapping Function

```javascript
const ASSERTION_ALIASES = {
  'Occurrence': 'occurrence',
  'Authorization': 'authorization',
  'Accuracy': 'accuracy',
  'Completeness': 'completeness',
  'Classification': 'classification',
  'Cutoff': 'cutoff',
  'Existence': 'existence',
  'Rights and Obligations': 'rights-and-obligations',
  'Valuation': 'valuation',
  // Already lowercase-dash (identity mapping)
  'occurrence': 'occurrence',
  'authorization': 'authorization',
  // ... etc
};

function normalizeAssertionKey(key) {
  return ASSERTION_ALIASES[key] || key.toLowerCase().replace(/\s+/g, '-');
}
```

---

## Key Naming Conventions

### ID Formats
- **Project ID:** `'proj-' + randomString`
- **Node ID:** Numeric (auto-increment)
- **Connector ID:** `'conn_' + randomString`
- **Detection ID:** `'det_' + timestamp + '_' + randomString`
- **User ID:** `'user_' + randomString`
- **Comment ID:** `'comment_' + randomString`

### Timestamp Format
- **All timestamps:** ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Date-only fields:** ISO 8601 date format (`YYYY-MM-DD`)

### Status Values
- **Project:** 'draft', 'in-progress', 'review', 'completed'
- **Detection:** 'pending', 'accepted', 'rejected', 'mitigated'
- **Review:** 'pending', 'in-review', 'approved', 'rejected'
- **Comment:** 'open', 'resolved', 'rejected'

---

## Schema Versioning & Migration

### Current Schema Version: 2

### Migration Strategy

When schema changes are needed:

1. **Increment `schemaVersion`** in Project Schema
2. **Add migration function** to convert old data to new format
3. **Update localStorage version key** to trigger migrations on load
4. **Document breaking changes** in changelog

### Example Migration Function

```javascript
function migrateProjectV1ToV2(oldProject) {
  return {
    ...oldProject,
    schemaVersion: 2,
    createdBy: oldProject.createdBy || 'system',
    updatedBy: oldProject.updatedBy || oldProject.lastModifiedBy || 'system',
    versionHistory: oldProject.versionHistory || [{
      version: 1,
      timestamp: oldProject.createdAt,
      editor: 'system',
      changes: 'Initial project creation',
      snapshot: { status: oldProject.status, progress: oldProject.progress }
    }],
    // Normalize assertion keys in existing detections
    auditAnalysis: oldProject.auditAnalysis ? {
      ...oldProject.auditAnalysis,
      detections: (oldProject.auditAnalysis.detections || []).map(d => ({
        ...d,
        assertion: normalizeAssertionKey(d.assertion)
      }))
    } : undefined
  };
}
```

---

## Next Steps

**For Approval:**
1. ✅ Remove Node.wcgw, replace with Node.wcgwDetectionIds
2. ✅ Add `locked` field to Flowchart Schema
3. ✅ Add version history structure to Flowchart and Project
4. ✅ Add createdBy/updatedBy audit trail fields
5. ✅ Expand Review Schema for anchor comments
6. ✅ Standardize assertion format to lowercase-dash
7. ✅ Add schemaVersion to Project Schema

**After Approval:**
1. Implement schema validation utilities
2. Add TypeScript definition files (`.d.ts`)
3. Create migration system for existing localStorage data
4. Update existing code to enforce schemas

---

## 10. Parsed Data Schema (Sprint 4 Final Hardening)

The parser output structure returned by `FlowchartGenerator.generate().parsedData`. This schema maintains backward compatibility with Sprint 1-4 while adding rich metadata for Audit Trail, AI Integration, and Dashboard use.

### Structure

```typescript
interface ParsedData {
  // Legacy fields (backward compatibility with Sprint 1-4)
  actors: string[];                    // Actor names as strings
  activities: ParsedActivity[];        // Activity objects
  decisions: ParsedDecision[];         // Decision objects
  documents: ParsedDocument[];         // Document objects
  databases: ParsedDatabase[];         // Database objects

  // New metadata fields (Sprint 4 Final Hardening)
  actorMetadata: ActorMetadata[];      // Rich actor data with IDs and classification
  activityMetadata: ActivityMetadata[]; // Rich activity data with IDs
  decisionMetadata: DecisionMetadata[]; // Rich decision data with IDs
  documentMetadata: DocumentMetadata[]; // Rich document data with IDs
  databaseMetadata: DatabaseMetadata[]; // Rich database data with IDs
  parserMetadata: ParserMetadata;       // Parser execution metadata
}

// Legacy activity object (existing structure)
interface ParsedActivity {
  text: string;
  actor: string | null;
  keyword: string;
  confidence: number;
  type: 'activity';
}

// Legacy decision object (existing structure)
interface ParsedDecision {
  text: string;
  actor: string | null;
  hasQuestionMark: boolean;
  confidence: number;
  type: 'decision';
}

// Legacy document object (existing structure)
interface ParsedDocument {
  text: string;
  actor: string | null;
  keyword: string;
  confidence: number;
  type: 'document';
}

// Legacy database object (existing structure)
interface ParsedDatabase {
  text: string;
  keyword: string;
  confidence: number;
  type: 'database';
}

// New: Actor metadata with classification
interface ActorMetadata {
  id: string;                    // Stable ID (format: actor_timestamp_random)
  name: string;                  // Actor name (matches actors[] entry)
  displayName: string;           // Capitalized display name
  classification: 'internal' | 'external'; // Internal vs external party
  confidence: number;            // 0-100 confidence score
}

// New: Activity metadata with stable ID
interface ActivityMetadata {
  id: string;                    // Stable ID (format: activity_timestamp_random)
  text: string;                  // Activity text
  actor: string | null;          // Associated actor name
  confidence: number;            // 0-100 confidence score
}

// New: Decision metadata with stable ID
interface DecisionMetadata {
  id: string;                    // Stable ID (format: decision_timestamp_random)
  text: string;                  // Decision text
  actor: string | null;          // Associated actor name
  confidence: number;            // 0-100 confidence score
}

// New: Document metadata with stable ID
interface DocumentMetadata {
  id: string;                    // Stable ID (format: document_timestamp_random)
  text: string;                  // Document name
  actor: string | null;          // Associated actor name
  confidence: number;            // 0-100 confidence score
}

// New: Database metadata with stable ID
interface DatabaseMetadata {
  id: string;                    // Stable ID (format: database_timestamp_random)
  text: string;                  // Database/system name
  confidence: number;            // 0-100 confidence score
}

// New: Parser execution metadata
interface ParserMetadata {
  version: string;               // Parser version (e.g., "4.0-final")
  parsedAt: string;              // ISO 8601 timestamp
  parsingDurationMs: number;     // Parsing duration in milliseconds
  averageConfidence: number;     // Average confidence across all elements
  confidenceByCategory: {
    actor: number;
    activity: number;
    decision: number;
    document: number;
    database: number;
  };
  validationSummary: {
    actors: number;
    activities: number;
    decisions: number;
    documents: number;
    databases: number;
    totalElements: number;
  };
  warnings: ParserWarning[];     // Warnings for low confidence or missing elements
}

// New: Structured warning object
interface ParserWarning {
  type: 'low_confidence' | 'missing_element' | 'validation_error';
  category: 'actor' | 'activity' | 'decision' | 'document' | 'database';
  message: string;               // Human-readable warning message
}
```

### Example

```javascript
{
  // Legacy fields (backward compatible)
  actors: ["sales", "customer", "finance", "gudang"],
  activities: [
    { text: "Menerima order from customer", actor: "sales", keyword: "menerima", confidence: 95, type: "activity" }
  ],
  decisions: [
    { text: "Jika pembayaran belum lunas, sales menagih customer", actor: "sales", hasQuestionMark: false, confidence: 60, type: "decision" }
  ],
  documents: [
    { text: "Invoice", actor: "sales", keyword: "invoice", confidence: 50, type: "document" }
  ],
  databases: [],

  // New metadata fields
  actorMetadata: [
    { id: "actor_1784871290255_da093c", name: "sales", displayName: "Sales", classification: "internal", confidence: 75 },
    { id: "actor_1784871290257_qkv8lg", name: "customer", displayName: "Customer", classification: "external", confidence: 65 },
    { id: "actor_1784871290257_0yti9x", name: "finance", displayName: "Finance", classification: "internal", confidence: 75 },
    { id: "actor_1784871290257_tc1ais", name: "gudang", displayName: "Gudang", classification: "internal", confidence: 75 }
  ],
  activityMetadata: [
    { id: "activity_1784871290255_xc6wbq", text: "Menerima order from customer", actor: "sales", confidence: 95 }
  ],
  decisionMetadata: [
    { id: "decision_1784871290255_0c9rrk", text: "Jika pembayaran belum lunas, sales menagih customer", actor: "sales", confidence: 60 }
  ],
  documentMetadata: [
    { id: "document_1784871290256_4agvpy", text: "Invoice", actor: "sales", confidence: 50 }
  ],
  databaseMetadata: [],
  parserMetadata: {
    version: "4.0-final",
    parsedAt: "2024-01-20T10:30:00.000Z",
    parsingDurationMs: 15.08,
    averageConfidence: 79,
    confidenceByCategory: { actor: 73, activity: 95, decision: 60, document: 50, database: 0 },
    validationSummary: { actors: 4, activities: 4, decisions: 1, documents: 1, databases: 0, totalElements: 10 },
    warnings: []
  }
}
```

### Validation Rules

1. `actors` array length must equal `actorMetadata` array length
2. Each actor in `actors` must have a corresponding entry in `actorMetadata` with matching `name`
3. All metadata IDs must be unique within their category
4. `classification` must be either `'internal'` or `'external'`
5. All confidence scores must be between 0 and 100
6. `parserMetadata.version` must match `PARSER_VERSION` constant
7. `parsedAt` must be a valid ISO 8601 timestamp
8. `validationSummary.totalElements` must equal sum of all element counts

### Usage Notes

- **Backward Compatibility**: Existing code can continue using `actors`, `activities`, `decisions`, `documents`, `databases` without changes
- **Stable IDs**: Use metadata IDs for cross-referencing in Audit Trail, WCGW Detection, and AI systems
- **Actor Classification**: Use `actorMetadata[].classification` to distinguish internal vs external swimlanes in UI
- **Confidence Tracking**: Use `parserMetadata.confidenceByCategory` for quality monitoring
- **Warnings**: Check `parserMetadata.warnings` for elements that may need manual review

---

## 11. Audit Trail Schema (Sprint 5)

The Audit Trail system provides immutable tracking of all user actions, system events, and data changes across the AuditFlow application.

### 11.1 Storage Structure

```typescript
interface AuditStorage {
  entries: AuditEntry[];           // All audit log entries
  versions: VersionEntry[];        // Version history snapshots
  approvals: ApprovalEntry[];      // Approval/review records
  lastPruned: string;              // ISO 8601 timestamp of last prune operation
}
```

**Storage Key:** `auditflow_audit_trail` (localStorage)

### 11.2 AuditEntry Schema

Core audit log entry for tracking user actions and system events.

```typescript
interface AuditEntry {
  // Core Identity
  id: string;                      // Unique ID (format: audit_<timestamp>_<random>)
  action: AuditActionType;         // Action type enum
  
  // Context
  userId: string;                  // User who performed the action
  projectId?: string;              // Related project ID (if applicable)
  timestamp: string;               // ISO 8601 timestamp
  
  // Source & Status
  source: 'manual' | 'rule-engine' | 'ai' | 'system';  // Action source
  status: 'active' | 'deleted' | 'restored';           // Entry status
  
  // Details
  summary: string;                 // Human-readable summary
  details?: {
    [key: string]: any;            // Action-specific details
    previousValue?: any;           // For change tracking
    newValue?: any;                // For change tracking
    snapshot?: any;                // Optional data snapshot (max 100KB)
  };
  
  // Metadata
  sessionId?: string;              // Session identifier
  userAgent?: string;              // Browser/client info
  ipAddress?: string;              // Client IP (if tracked)
}

type AuditActionType =
  // Session Actions
  | 'session.start'                // User login
  | 'session.end'                  // User logout
  
  // Project Actions
  | 'project.create'               // New project created
  | 'project.update'               // Project details updated
  | 'project.delete'               // Project deleted
  | 'project.open'                 // Project opened
  
  // Flowchart Actions
  | 'flowchart.generate'           // Flowchart auto-generated
  | 'flowchart.lock'               // Flowchart locked
  | 'flowchart.unlock'             // Flowchart unlocked
  | 'flowchart.node.add'           // Node added manually
  | 'flowchart.node.edit'          // Node edited manually
  | 'flowchart.node.delete'        // Node deleted manually
  | 'flowchart.connector.add'      // Connector added
  | 'flowchart.connector.delete'   // Connector deleted
  | 'flowchart.swimlane.add'       // Swimlane added
  | 'flowchart.swimlane.edit'      // Swimlane edited
  | 'flowchart.swimlane.delete'    // Swimlane deleted
  | 'flowchart.layout.change'      // Layout orientation changed
  
  // WCGW Detection Actions
  | 'wcgw.detect'                  // WCGW detection triggered
  | 'wcgw.accept'                  // Detection accepted
  | 'wcgw.reject'                  // Detection rejected
  | 'wcgw.mitigate'                // Mitigation plan created
  
  // Review Actions
  | 'review.approve'               // Flowchart approved
  | 'review.reject'                // Flowchart rejected
  | 'review.comment'               // Review comment added
  
  // Understanding Business Actions
  | 'understanding-business.update' // Business understanding updated
  
  // Export Actions
  | 'export.pdf'                   // PDF export
  | 'export.json'                  // JSON export
  | 'export.image'                 // Image export
  
  // Version Actions
  | 'version.save'                 // Version snapshot saved
  | 'version.restore'              // Version restored
  | 'version.compare'              // Versions compared
  ;
```

### 11.3 VersionEntry Schema

Tracks flowchart version history for comparison and restoration.

```typescript
interface VersionEntry {
  // Core Identity
  id: string;                      // Unique ID (format: version_<timestamp>_<random>)
  projectId: string;               // Related project ID
  flowchartId?: string;            // Related flowchart ID
  
  // Version Info
  versionNumber: number;           // Sequential version number
  label?: string;                  // Optional version label (e.g., "Before WCGW detection")
  createdAt: string;               // ISO 8601 timestamp
  createdBy: string;               // User ID who created version
  
  // Snapshot Data
  snapshot: {
    nodes: any[];                  // Serialized nodes
    connectors: any[];             // Serialized connectors
    swimlanes: any[];              // Serialized swimlanes
    orientation: string;           // Layout orientation
    metadata?: any;                // Additional metadata
  };
  
  // Metadata
  changeSummary?: string;          // Brief description of changes
  changeCount?: {
    nodesAdded: number;
    nodesRemoved: number;
    nodesModified: number;
    connectorsAdded: number;
    connectorsRemoved: number;
  };
  
  // Status
  isCurrent: boolean;              // Is this the current version?
}
```

### 11.4 ApprovalEntry Schema

Tracks approval and review workflow history.

```typescript
interface ApprovalEntry {
  // Core Identity
  id: string;                      // Unique ID (format: approval_<timestamp>_<random>)
  projectId: string;               // Related project ID
  flowchartId?: string;            // Related flowchart ID
  
  // Approval Info
  action: 'approve' | 'reject';    // Approval decision
  decidedAt: string;               // ISO 8601 timestamp
  decidedBy: string;               // User ID who made decision
  
  // Review Details
  comments?: string;               // Review comments
  score?: number;                  // Optional quality score (0-100)
  criteria?: {
    completeness?: number;         // Completeness score
    accuracy?: number;             // Accuracy score
    compliance?: number;           // Compliance score
  };
  
  // Snapshot (optional, max 100KB)
  snapshot?: {
    nodes: any[];
    connectors: any[];
    swimlanes: any[];
  };
  
  // Metadata
  previousStatus?: string;         // Status before this approval
  requiresReapproval: boolean;     // Does edit require re-approval?
}
```

### 11.5 Example AuditEntry

```javascript
{
  id: "audit_1784871290255_da093c",
  action: "flowchart.generate",
  userId: "user_001",
  projectId: "proj_001",
  timestamp: "2024-01-20T10:30:00.000Z",
  source: "rule-engine",
  status: "active",
  summary: "Flowchart generated automatically from business description",
  details: {
    inputText: "Departemen Sales menerima order...",
    nodeCount: 12,
    swimlaneCount: 3,
    parsingDurationMs: 15.08,
    confidence: {
      average: 79,
      byCategory: { actor: 73, activity: 95, decision: 60, document: 50 }
    },
    snapshot: { /* flowchart data */ }
  },
  sessionId: "session_20240120_103000",
  userAgent: "Mozilla/5.0..."
}
```

### 11.6 Validation Rules

1. All audit entries must have unique `id` values
2. `timestamp` must be a valid ISO 8601 timestamp
3. `action` must be a valid AuditActionType
4. `source` must be one of: 'manual', 'rule-engine', 'ai', 'system'
5. `status` must be one of: 'active', 'deleted', 'restored'
6. `details.snapshot` must not exceed 100KB when JSON stringified
7. `versionNumber` must be sequential within a project
8. All entries are immutable - no updates or deletes, only new entries with status changes

### 11.7 Audit Trail API

```typescript
interface AuditTrailService {
  // Recording
  record(action: AuditActionType, context: AuditContext): AuditEntry;
  
  // Querying
  getTimeline(projectId?: string, filters?: AuditFilters): AuditEntry[];
  getVersions(projectId: string): VersionEntry[];
  getApprovals(projectId: string): ApprovalEntry[];
  getRecentActivities(limit?: number): AuditEntry[];
  getStatistics(projectId?: string): AuditStatistics;
  
  // Maintenance
  prune(maxAgeDays?: number): { pruned: number; retained: number };
  exportData(projectId?: string): AuditExportData;
  
  // Lifecycle
  init(): void;
}
```

### 11.8 Integration Points

- **Parser Metadata**: Use `parserMetadata` from Sprint 4 for flowchart generation audits
- **Version History**: Integrate with existing `Flowchart.versionHistory`
- **WCGW Detection**: Record all detection actions with full context
- **Session Management**: Track login/logout with session identifiers
- **Dashboard**: Display recent activities timeline

---

**Status:** 📝 Draft v2 - Awaiting your review and approval before proceeding to Scope C and D.
