/**
 * Schema Validator Module
 * Provides validation utilities for data schemas defined in docs/DATA_SCHEMAS.md
 * This module ensures data integrity and prevents crashes from malformed data
 */

const SchemaValidator = (function () {
    'use strict';

    /**
     * Validate Project Schema
     * @param {Object} project - Project object to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    function validateProject(project) {
        const errors = [];

        if (!project || typeof project !== 'object') {
            errors.push('Project must be an object');
            return { isValid: false, errors };
        }

        // Required fields
        const requiredFields = ['id', 'name', 'status', 'schemaVersion'];
        requiredFields.forEach(field => {
            if (project[field] === undefined || project[field] === null) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Schema version check
        if (project.schemaVersion !== undefined && typeof project.schemaVersion !== 'number') {
            errors.push('schemaVersion must be a number');
        }

        // Status validation
        const validStatuses = ['draft', 'in_progress', 'review', 'completed'];
        if (project.status && !validStatuses.includes(project.status)) {
            errors.push(`Invalid status: ${project.status}. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Date validation
        if (project.startDate && isNaN(Date.parse(project.startDate))) {
            errors.push('Invalid startDate format');
        }
        if (project.endDate && isNaN(Date.parse(project.endDate))) {
            errors.push('Invalid endDate format');
        }

        // Flowchart validation (if exists)
        if (project.flowchart && typeof project.flowchart !== 'object') {
            errors.push('flowchart must be an object');
        }

        // WCGW detections validation
        if (project.wcgwDetections && !Array.isArray(project.wcgwDetections)) {
            errors.push('wcgwDetections must be an array');
        }

        // Version history validation
        if (project.versionHistory && !Array.isArray(project.versionHistory)) {
            errors.push('versionHistory must be an array');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: []
        };
    }

    /**
     * Validate Flowchart Schema
     * @param {Object} flowchart - Flowchart object to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    function validateFlowchart(flowchart) {
        const errors = [];

        if (!flowchart || typeof flowchart !== 'object') {
            errors.push('Flowchart must be an object');
            return { isValid: false, errors };
        }

        // Required fields
        if (!flowchart.swimlanes || !Array.isArray(flowchart.swimlanes)) {
            errors.push('flowchart must have swimlanes array');
        }

        if (!flowchart.nodes || !Array.isArray(flowchart.nodes)) {
            errors.push('flowchart must have nodes array');
        }

        if (!flowchart.connectors || !Array.isArray(flowchart.connectors)) {
            errors.push('flowchart must have connectors array');
        }

        // Validate nodes structure
        if (flowchart.nodes) {
            flowchart.nodes.forEach((node, index) => {
                if (!node.id) {
                    errors.push(`Node at index ${index} missing id`);
                }
                if (!node.type) {
                    errors.push(`Node at index ${index} missing type`);
                }
                if (node.x === undefined || node.y === undefined) {
                    errors.push(`Node at index ${index} missing position (x, y)`);
                }

                // Validate wcgwDetectionIds if present
                if (node.wcgwDetectionIds && !Array.isArray(node.wcgwDetectionIds)) {
                    errors.push(`Node ${node.id}: wcgwDetectionIds must be an array`);
                }
            });
        }

        // Validate connectors structure
        if (flowchart.connectors) {
            flowchart.connectors.forEach((connector, index) => {
                if (!connector.id) {
                    errors.push(`Connector at index ${index} missing id`);
                }
                if (!connector.from || !connector.to) {
                    errors.push(`Connector at index ${index} missing from/to reference`);
                }
            });
        }

        // Validate swimlanes structure
        if (flowchart.swimlanes) {
            flowchart.swimlanes.forEach((swimlane, index) => {
                if (!swimlane.id) {
                    errors.push(`Swimlane at index ${index} missing id`);
                }
                if (!swimlane.name) {
                    errors.push(`Swimlane at index ${index} missing name`);
                }
            });
        }

        // Locked field validation
        if (flowchart.locked !== undefined && typeof flowchart.locked !== 'boolean') {
            errors.push('locked must be a boolean');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: []
        };
    }

    /**
     * Validate WCGW Detection Schema
     * @param {Object} detection - WCGW detection object to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    function validateWCGWDetection(detection) {
        const errors = [];

        if (!detection || typeof detection !== 'object') {
            errors.push('WCGWDetection must be an object');
            return { isValid: false, errors };
        }

        // Required fields
        const requiredFields = ['id', 'wcgw', 'riskLevel', 'assertion', 'status'];
        requiredFields.forEach(field => {
            if (detection[field] === undefined || detection[field] === null) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Risk level validation
        const validRiskLevels = ['high', 'medium', 'low'];
        if (detection.riskLevel && !validRiskLevels.includes(detection.riskLevel)) {
            errors.push(`Invalid riskLevel: ${detection.riskLevel}. Must be one of: ${validRiskLevels.join(', ')}`);
        }

        // Status validation
        const validStatuses = ['open', 'accepted', 'rejected', 'mitigated'];
        if (detection.status && !validStatuses.includes(detection.status)) {
            errors.push(`Invalid status: ${detection.status}. Must be one of: ${validStatuses.join(', ')}`);
        }

        // WCGW must be an array
        if (detection.wcgw && !Array.isArray(detection.wcgw)) {
            errors.push('wcgw must be an array');
        }

        // Trigger node validation
        if (detection.triggerNodeId && typeof detection.triggerNodeId !== 'string') {
            errors.push('triggerNodeId must be a string');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: []
        };
    }

    /**
     * Validate User Schema
     * @param {Object} user - User object to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    function validateUser(user) {
        const errors = [];

        if (!user || typeof user !== 'object') {
            errors.push('User must be an object');
            return { isValid: false, errors };
        }

        // Required fields
        const requiredFields = ['id', 'email', 'name', 'role'];
        requiredFields.forEach(field => {
            if (user[field] === undefined || user[field] === null) {
                errors.push(`Missing required field: ${field}`);
            }
        });

        // Email validation
        if (user.email && !user.email.includes('@')) {
            errors.push('Invalid email format');
        }

        // Role validation
        const validRoles = ['auditor', 'audit_manager', 'admin'];
        if (user.role && !validRoles.includes(user.role)) {
            errors.push(`Invalid role: ${user.role}. Must be one of: ${validRoles.join(', ')}`);
        }

        // Name should not contain email-like patterns
        if (user.name && (user.name.includes('@') || user.name.includes('.'))) {
            // This is a warning, not an error - might be intentional
            return {
                isValid: true,
                errors: [],
                warnings: ['User name appears to contain email-like patterns. Consider formatting.']
            };
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings: []
        };
    }

    /**
     * Validate entire project data structure
     * @param {Object} projectData - Complete project data from localStorage
     * @returns {Object} Comprehensive validation result
     */
    function validateProjectData(projectData) {
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            schemaVersion: projectData.schemaVersion || 0
        };

        // Validate project itself
        const projectValidation = validateProject(projectData);
        if (!projectValidation.isValid) {
            results.isValid = false;
            results.errors.push(...projectValidation.errors);
        }
        results.warnings.push(...projectValidation.warnings);

        // Validate flowchart if exists
        if (projectData.flowchart) {
            const flowchartValidation = validateFlowchart(projectData.flowchart);
            if (!flowchartValidation.isValid) {
                results.isValid = false;
                results.errors.push(...flowchartValidation.errors);
            }
            results.warnings.push(...flowchartValidation.warnings);
        }

        // Validate WCGW detections
        if (projectData.wcgwDetections && Array.isArray(projectData.wcgwDetections)) {
            projectData.wcgwDetections.forEach((detection, index) => {
                const detectionValidation = validateWCGWDetection(detection);
                if (!detectionValidation.isValid) {
                    results.isValid = false;
                    results.errors.push(`Detection[${index}]: ${detectionValidation.errors.join(', ')}`);
                }
                results.warnings.push(...detectionValidation.warnings);
            });
        }

        // Validate user if exists
        if (projectData.createdBy && typeof projectData.createdBy === 'object') {
            const userValidation = validateUser(projectData.createdBy);
            if (!userValidation.isValid) {
                results.isValid = false;
                results.errors.push(`createdBy: ${userValidation.errors.join(', ')}`);
            }
            results.warnings.push(...userValidation.warnings);
        }

        return results;
    }

    /**
     * Quick sanity check for critical data structures
     * @param {any} data - Data to check
     * @param {string} type - Expected type
     * @returns {boolean} Whether data passes basic sanity check
     */
    function sanityCheck(data, type) {
        if (!data) return false;

        switch (type) {
            case 'array':
                return Array.isArray(data);
            case 'object':
                return typeof data === 'object' && !Array.isArray(data);
            case 'string':
                return typeof data === 'string' && data.trim().length > 0;
            case 'number':
                return typeof data === 'number' && !isNaN(data);
            case 'boolean':
                return typeof data === 'boolean';
            default:
                return data !== undefined && data !== null;
        }
    }

    // Public API
    return {
        validateProject,
        validateFlowchart,
        validateWCGWDetection,
        validateUser,
        validateProjectData,
        sanityCheck
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemaValidator;
}