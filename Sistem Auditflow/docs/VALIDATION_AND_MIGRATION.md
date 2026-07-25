# Validation & Migration Guide
## Scope C & D Implementation for AuditFlow

**Version:** 1.0  
**Date:** 2026-07-23  
**Status:** Implementation Guide

---

## Overview

This document provides implementation guidance for:
- **Scope C:** Basic validation/linting utilities
- **Scope D:** localStorage fallback guards and schema versioning

These utilities ensure data integrity and prevent crashes when loading malformed or outdated data from localStorage.

---

## Scope C: Validation Utilities

### C1. Schema Validation Module

Create `js/schema-validator.js`:

```javascript
/**
 * AuditFlow Schema Validator
 * Provides validation functions for all data schemas
 */

const SchemaValidator = {
  // Current schema version
  CURRENT_SCHEMA_VERSION: 2,

  /**
   * Validate a project object
   * @param {Object} project - Project to validate
   * @returns {Object} Validation result { valid, errors, warnings }
   */
  validateProject(project) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!project.id || typeof project.id !== 'string') {
      errors.push('Project must have a string id');
    }

    if (!project.name || typeof project.name !== 'string') {
      errors.push('Project must have a string name');
    }

    const validStatuses = ['draft', 'in-progress', 'review', 'completed'];
    if (!project.status || !validStatuses.includes(project.status)) {
      errors.push(`Project status must be one of: ${validStatuses.join(', ')}`);
    }

    // Schema version check
    if (project.schemaVersion === undefined) {
      warnings.push('Project missing schemaVersion - may need migration');
    } else if (typeof project.schemaVersion !== 'number') {
      errors.push('schemaVersion must be a number');
    } else if (project.schemaVersion > this.CURRENT_SCHEMA_VERSION) {
      warnings.push(`Project schemaVersion (${project.schemaVersion}) is newer than current (${this.CURRENT_SCHEMA_VERSION})`);
    }

    // Progress validation
    if (typeof project.progress !== 'number' || project.progress < 0 || project.progress > 100) {
      errors.push('Progress must be a number between 0 and 100');
    }

    // Audit trail validation
    if (!project.createdBy || typeof project.createdBy !== 'string') {
      errors.push('Project must have createdBy (User ID)');
    }

    if (!project.updatedBy || typeof project.updatedBy !== 'string') {
      errors.push('Project must have updatedBy (User ID)');
    }

    // Timestamp validation
    if (!project.createdAt || isNaN(Date.parse(project.createdAt))) {
      errors.push('createdAt must be a valid ISO 8601 timestamp');
    }

    if (!project.lastModified || isNaN(Date.parse(project.lastModified))) {
      errors.push('lastModified must be a valid ISO 8601 timestamp');
    }

    // Version history validation
    if (!Array.isArray(project.versionHistory) || project.versionHistory.length === 0) {
      warnings.push('Project missing versionHistory - may need initialization');
    }

    // Optional: Validate nested objects if present
    if (project.projectInfo) {
      const projectInfoErrors = this.validateProjectInfo(project.projectInfo);
      errors.push(...projectInfoErrors);
    }

    if (project.flowchart) {
      const flowchartResult = this.validateFlowchart(project.flowchart);
      if (!flowchartResult.valid) {
        errors.push(...flowchartResult.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Validate projectInfo object
   */
  validateProjectInfo(info) {
    const errors = [];

    const requiredFields = ['projectName', 'auditorName', 'companyName', 'industry', 'auditCycle', 'startDate', 'endDate'];
    requiredFields.forEach(field => {
      if (!info[field] || typeof info[field] !== 'string') {
        errors.push(`projectInfo.${field} is required and must be a string`);
      }
    });

    const validCycles = ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly', 'Ad-hoc'];
    if (info.auditCycle && !validCycles.includes(info.auditCycle)) {
      errors.push(`auditCycle must be one of: ${validCycles.join(', ')}`);
    }

    return errors;
  },

  /**
   * Validate flowchart object
   */
  validateFlowchart(flowchart) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!Array.isArray(flowchart.nodes)) {
      errors.push('Flowchart must have nodes array');
    }

    if (!Array.isArray(flowchart.connectors)) {
      errors.push('Flowchart must have connectors array');
    }

    if (!Array.isArray(flowchart.swimlanes)) {
      errors.push('Flowchart must have swimlanes array');
    }

    if (typeof flowchart.locked !== 'boolean') {
      errors.push('Flowchart must have locked (boolean)');
    }

    // Validate locked state
    if (flowchart.locked === true) {
      if (!flowchart.lockedAt || isNaN(Date.parse(flowchart.lockedAt))) {
        errors.push('When locked is true, lockedAt must be valid timestamp');
      }
      if (!flowchart.lockedBy || typeof flowchart.lockedBy !== 'string') {
        errors.push('When locked is true, lockedBy must be User ID');
      }
    }

    // Validate nodes
    if (flowchart.nodes) {
      const nodeIds = new Set();
      flowchart.nodes.forEach((node, index) => {
        if (typeof node.id !== 'number') {
          errors.push(`Node[${index}] must have numeric id`);
        } else if (nodeIds.has(node.id)) {
          errors.push(`Node id ${node.id} is duplicated`);
        } else {
          nodeIds.add(node.id);
        }

        const validTypes = ['terminator', 'process', 'decision', 'manual-input', 'manual-operation', 'document', 'multiple-documents', 'database', 'connector', 'off-page', 'swimlane'];
        if (node.type && !validTypes.includes(node.type)) {
          errors.push(`Node[${index}] type must be one of: ${validTypes.join(', ')}`);
        }

        if (typeof node.text !== 'string' || !node.text.trim()) {
          errors.push(`Node[${index}] must have non-empty text`);
        }

        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
          errors.push(`Node[${index}] must have numeric x and y coordinates`);
        }
      });

      // Validate connector references
      if (flowchart.connectors) {
        flowchart.connectors.forEach((connector, index) => {
          if (!nodeIds.has(connector.from)) {
            errors.push(`Connector[${index}] references non-existent node id ${connector.from}`);
          }
          if (!nodeIds.has(connector.to)) {
            errors.push(`Connector[${index}] references non-existent node id ${connector.to}`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },

  /**
   * Validate WCGW detection object
   */
  validateDetection(detection) {
    const errors = [];

    if (!detection.id || typeof detection.id !== 'string') {
      errors.push('Detection must have string id');
    }

    if (!detection.ruleId || typeof detection.ruleId !== 'string') {
      errors.push('Detection must have string ruleId');
    }

    // Assertion format validation (must be lowercase-dash)
    const validAssertions = ['occurrence', 'authorization', 'accuracy', 'completeness', 'classification', 'cutoff', 'existence', 'rights-and-obligations', 'valuation'];
    if (detection.assertion && !validAssertions.includes(detection.assertion)) {
      errors.push(`Detection assertion must be one of: ${validAssertions.join(', ')} (lowercase-dash format)`);
    }

    const validRiskLevels = ['high', 'medium', 'low'];
    if (detection.riskLevel && !validRiskLevels.includes(detection.riskLevel)) {
      errors.push(`riskLevel must be one of: ${validRiskLevels.join(', ')}`);
    }

    if (typeof detection.confidence !== 'number' || detection.confidence < 0 || detection.confidence > 100) {
      errors.push('confidence must be number between 0 and 100');
    }

    const validStatuses = ['pending', 'accepted', 'rejected', 'mitigated'];
    if (detection.status && !validStatuses.includes(detection.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    // If not pending, must have manualOverride
    if (detection.status && detection.status !== 'pending' && !detection.manualOverride) {
      errors.push('Non-pending detections must have manualOverride');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate user object
   */
  validateUser(user) {
    const errors = [];

    if (!user.id || typeof user.id !== 'string') {
      errors.push('User must have string id');
    }

    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push('User must have valid email');
    }

    if (!user.name || typeof user.name !== 'string') {
      errors.push('User must have string name');
    }

    // Check name formatting (should be Title Case, not email local part)
    if (user.name && user.name.includes('@')) {
      errors.push('User name should not contain @ symbol - must be formatted from email');
    }

    const validRoles = ['auditor', 'supervisor'];
    if (!user.role || !validRoles.includes(user.role)) {
      errors.push(`role must be one of: ${validRoles.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Simple email validation
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};
```

---

## Scope D: localStorage Fallback Guards

### D1. Data Migration Module

Create `js/data-migration.js`:

```javascript
/**
 * AuditFlow Data Migration
 * Handles schema versioning and data migration for localStorage
 */

const DataMigration = {
  // Current schema version
  CURRENT_VERSION: 2,

  /**
   * Initialize migration system
   * Call this on app startup before loading any data
   */
  init() {
    console.log('[DataMigration] Initializing...');
    
    // Check and migrate projects
    this.migrateProjects();
    
    // Check and migrate current project
    this.migrateCurrentProject();
    
    // Check and migrate user
    this.migrateUser();
    
    console.log('[DataMigration] Initialization complete');
  },

  /**
   * Migrate all projects in localStorage
   */
  migrateProjects() {
    try {
      const stored = localStorage.getItem('auditflow_projects');
      if (!stored) return;

      let projects = JSON.parse(stored);
      if (!Array.isArray(projects)) {
        console.warn('[DataMigration] Invalid projects format, resetting to empty array');
        localStorage.setItem('auditflow_projects', JSON.stringify([]));
        return;
      }

      let migrated = false;
      projects = projects.map(project => {
        const result = this.migrateProject(project);
        if (result.migrated) migrated = true;
        return result.project;
      });

      if (migrated) {
        console.log(`[DataMigration] Migrated ${projects.length} projects`);
        localStorage.setItem('auditflow_projects', JSON.stringify(projects));
      }
    } catch (error) {
      console.error('[DataMigration] Error migrating projects:', error);
      // Safe fallback: reset to empty array
      localStorage.setItem('auditflow_projects', JSON.stringify([]));
    }
  },

  /**
   * Migrate a single project
   * @param {Object} project - Project to migrate
   * @returns {Object} { project, migrated }
   */
  migrateProject(project) {
    let migrated = false;

    // Version 0 -> 1: Add schemaVersion field
    if (project.schemaVersion === undefined) {
      project.schemaVersion = 0;
    }

    // Version 0 -> 1: Add audit trail fields
    if (project.schemaVersion < 1) {
      project.createdBy = project.createdBy || 'system';
      project.updatedBy = project.updatedBy || project.lastModifiedBy || 'system';
      
      // Initialize version history if missing
      if (!project.versionHistory || !Array.isArray(project.versionHistory)) {
        project.versionHistory = [{
          version: 1,
          timestamp: project.createdAt || new Date().toISOString(),
          editor: project.createdBy,
          changes: 'Initial project creation (migrated)',
          snapshot: {
            status: project.status || 'draft',
            progress: project.progress || 0
          }
        }];
      }
      
      project.schemaVersion = 1;
      migrated = true;
    }

    // Version 1 -> 2: Add locked fields to flowchart, normalize assertions
    if (project.schemaVersion < 2) {
      // Migrate flowchart if present
      if (project.flowchart) {
        // Add locked fields if missing
        if (project.flowchart.locked === undefined) {
          project.flowchart.locked = false;
        }
        
        // Ensure flowchart has version history
        if (!project.flowchart.versionHistory || !Array.isArray(project.flowchart.versionHistory)) {
          project.flowchart.versionHistory = [{
            version: 1,
            timestamp: project.flowchart.createdAt || new Date().toISOString(),
            editor: project.updatedBy || 'system',
            changes: 'Initial flowchart (migrated)',
            snapshot: {
              nodes: project.flowchart.nodes || [],
              connectors: project.flowchart.connectors || [],
              swimlanes: project.flowchart.swimlanes || []
            }
          }];
        }
        
        // Add createdBy/updatedBy to flowchart if missing
        if (!project.flowchart.createdBy) {
          project.flowchart.createdBy = project.updatedBy || 'system';
        }
        if (!project.flowchart.updatedBy) {
          project.flowchart.updatedBy = project.updatedBy || 'system';
        }
      }

      // Normalize assertion keys in existing detections
      if (project.auditAnalysis && project.auditAnalysis.detections) {
        project.auditAnalysis.detections = project.auditAnalysis.detections.map(detection => ({
          ...detection,
          assertion: this.normalizeAssertionKey(detection.assertion)
        }));
      }

      project.schemaVersion = 2;
      migrated = true;
    }

    // Validate after migration
    const validation = SchemaValidator.validateProject(project);
    if (!validation.valid) {
      console.warn('[DataMigration] Project failed validation after migration:', validation.errors);
      // Add warnings to project metadata for debugging
      project._migrationWarnings = validation.errors;
    }

    return { project, migrated };
  },

  /**
   * Migrate current project
   */
  migrateCurrentProject() {
    try {
      const stored = localStorage.getItem('auditflow_current_project');
      if (!stored) return;

      let project = JSON.parse(stored);
      const result = this.migrateProject(project);
      
      if (result.migrated) {
        console.log('[DataMigration] Migrated current project');
        localStorage.setItem('auditflow_current_project', JSON.stringify(result.project));
      }
    } catch (error) {
      console.error('[DataMigration] Error migrating current project:', error);
      // Safe fallback: remove corrupted current project
      localStorage.removeItem('auditflow_current_project');
    }
  },

  /**
   * Migrate user data
   */
  migrateUser() {
    try {
      const stored = localStorage.getItem('auditflow_user');
      if (!stored) return;

      let user = JSON.parse(stored);
      
      // Validate user
      const validation = SchemaValidator.validateUser(user);
      if (!validation.valid) {
        console.warn('[DataMigration] User data invalid, clearing:', validation.errors);
        localStorage.removeItem('auditflow_user');
        return;
      }

      // Check name formatting - if name looks like email local part, format it
      if (user.name && (user.name.includes('.') || user.name.includes('_'))) {
        // Check if it matches email local part pattern
        const emailLocalPart = user.email ? user.email.split('@')[0] : '';
        if (user.name.toLowerCase() === emailLocalPart.toLowerCase()) {
          user.name = this.formatNameFromEmail(user.email);
          console.log('[DataMigration] Formatted user name from email');
          localStorage.setItem('auditflow_user', JSON.stringify(user));
        }
      }
    } catch (error) {
      console.error('[DataMigration] Error migrating user:', error);
      localStorage.removeItem('auditflow_user');
    }
  },

  /**
   * Normalize assertion key to lowercase-dash format
   * Handles both old (capitalized) and new formats
   */
  normalizeAssertionKey(key) {
    if (!key || typeof key !== 'string') return 'occurrence'; // Default fallback

    const aliases = {
      'Occurrence': 'occurrence',
      'Authorization': 'authorization',
      'Accuracy': 'accuracy',
      'Completeness': 'completeness',
      'Classification': 'classification',
      'Cutoff': 'cutoff',
      'Existence': 'existence',
      'Rights and Obligations': 'rights-and-obligations',
      'Valuation': 'valuation'
    };

    // Check if it's a known alias
    if (aliases[key]) {
      return aliases[key];
    }

    // Already lowercase-dash or convert
    return key.toLowerCase().replace(/\s+/g, '-');
  },

  /**
   * Format user name from email
   * e.g., "zazkia.nur.alifa@auditflow.com" -> "Zazkia Nur Alifa"
   */
  formatNameFromEmail(email) {
    if (!email || typeof email !== 'string') return 'Unknown User';
    
    const localPart = email.split('@')[0];
    return localPart
      .split(/[._]/)  // Split on dots and underscores
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  /**
   * Safe getter for projects with fallback
   */
  getProjectsSafe() {
    try {
      const stored = localStorage.getItem('auditflow_projects');
      if (!stored) return [];
      
      const projects = JSON.parse(stored);
      if (!Array.isArray(projects)) return [];
      
      // Filter out invalid projects
      return projects.filter(project => {
        const validation = SchemaValidator.validateProject(project);
        if (!validation.valid) {
          console.warn('[DataMigration] Removing invalid project:', project.id, validation.errors);
          return false;
        }
        return true;
      });
    } catch (error) {
      console.error('[DataMigration] Error loading projects:', error);
      return [];
    }
  },

  /**
   * Safe getter for current project with fallback
   */
  getCurrentProjectSafe() {
    try {
      const stored = localStorage.getItem('auditflow_current_project');
      if (!stored) return null;
      
      const project = JSON.parse(stored);
      const validation = SchemaValidator.validateProject(project);
      
      if (!validation.valid) {
        console.warn('[DataMigration] Current project invalid, clearing:', validation.errors);
        localStorage.removeItem('auditflow_current_project');
        return null;
      }
      
      return project;
    } catch (error) {
      console.error('[DataMigration] Error loading current project:', error);
      return null;
    }
  },

  /**
   * Safe getter for user with fallback
   */
  getUserSafe() {
    try {
      const stored = localStorage.getItem('auditflow_user');
      if (!stored) return null;
      
      const user = JSON.parse(stored);
      const validation = SchemaValidator.validateUser(user);
      
      if (!validation.valid) {
        console.warn('[DataMigration] User data invalid, clearing:', validation.errors);
        localStorage.removeItem('auditflow_user');
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('[DataMigration] Error loading user:', error);
      return null;
    }
  }
};
```

---

## Integration Guide

### Step 1: Add Files to HTML

Add these script tags to all HTML files (before other JS files):

```html
<!-- Schema Validator -->
<script src="js/schema-validator.js"></script>

<!-- Data Migration -->
<script src="js/data-migration.js"></script>
```

### Step 2: Initialize Migration on App Startup

In `js/app.js`, modify the `init()` function:

```javascript
init() {
  // Initialize data migration system first
  if (typeof DataMigration !== 'undefined') {
    DataMigration.init();
  }
  
  this.getUser();
}
```

### Step 3: Use Safe Getters

Replace direct localStorage access with safe getters:

**Before:**
```javascript
getProjectsList() {
  const stored = localStorage.getItem('auditflow_projects');
  if (stored) {
    return JSON.parse(stored);
  }
  return DummyData.getProjects();
}
```

**After:**
```javascript
getProjectsList() {
  // Use safe getter with validation
  const projects = DataMigration.getProjectsSafe();
  return projects.length > 0 ? projects : DummyData.getProjects();
}
```

**Before:**
```javascript
getCurrentProject() {
  const stored = localStorage.getItem('auditflow_current_project');
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
}
```

**After:**
```javascript
getCurrentProject() {
  // Use safe getter with validation
  return DataMigration.getCurrentProjectSafe();
}
```

**Before:**
```javascript
getUser() {
  if (this.currentUser) return this.currentUser;
  
  const stored = localStorage.getItem('auditflow_user');
  if (stored) {
    this.currentUser = JSON.parse(stored);
  }
  return this.currentUser;
}
```

**After:**
```javascript
getUser() {
  if (this.currentUser) return this.currentUser;
  
  // Use safe getter with validation
  this.currentUser = DataMigration.getUserSafe();
  return this.currentUser;
}
```

---

## Error Handling Strategy

### Graceful Degradation

1. **Invalid Project:** Remove from list, continue with others
2. **Invalid Current Project:** Clear and return to dashboard
3. **Invalid User:** Clear and redirect to login
4. **Corrupted localStorage:** Reset to empty state, log error

### Console Logging

All migration activities are logged with `[DataMigration]` prefix for easy debugging:

```
[DataMigration] Initializing...
[DataMigration] Migrated 3 projects
[DataMigration] Migrated current project
[DataMigration] Formatted user name from email
[DataMigration] Initialization complete
```

### Warnings vs Errors

- **Warnings:** Data is usable but has issues (e.g., missing optional fields)
- **Errors:** Data is invalid and will be removed/reset

---

## Testing Checklist

### Migration Tests

- [ ] Load project without `schemaVersion` → should add version 0, then migrate to 2
- [ ] Load project with `schemaVersion: 1` → should migrate to 2
- [ ] Load project with capitalized assertions → should normalize to lowercase-dash
- [ ] Load project with missing `createdBy` → should add 'system' as default
- [ ] Load corrupted JSON → should reset to empty array
- [ ] Load user with email-format name → should format to Title Case

### Validation Tests

- [ ] Validate valid project → should return `{ valid: true }`
- [ ] Validate project without `id` → should return error
- [ ] Validate project with `progress: 150` → should return error
- [ ] Validate project with capitalized assertion → should return error
- [ ] Validate flowchart with missing nodes → should return error
- [ ] Validate connector referencing non-existent node → should return error

---

## Summary

### Files Created
1. `docs/VALIDATION_AND_MIGRATION.md` - This document
2. `js/schema-validator.js` - Validation utilities
3. `js/data-migration.js` - Migration system

### Files Modified
1. `js/app.js` - Integration of migration system and safe getters

### Key Features
- ✅ Schema validation for all data types
- ✅ Automatic migration from schema v0/v1 to v2
- ✅ Safe getters with fallback to defaults
- ✅ Graceful error handling (no crashes)
- ✅ Comprehensive logging for debugging
- ✅ Assertion key normalization
- ✅ User name formatting from email

---

**Status:** Ready for implementation. Review and approve before applying code changes.
