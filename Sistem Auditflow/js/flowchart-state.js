/**
 * AuditFlow - Flowchart State Management
 * Handles flowchart data, state persistence, and project integration
 */

const FlowchartState = (function () {
    'use strict';

    // Private state
    let currentProject = null;
    let flowchartData = {
        nodes: [],
        connectors: [],
        swimlanes: []
    };

    /**
     * Initialize state with current project
     */
    function init(project) {
        currentProject = project;
        if (project && project.flowchart) {
            flowchartData = project.flowchart;
        } else {
            // Initialize default swimlanes
            flowchartData.swimlanes = [
                { id: 'lane1', name: 'Finance', x: 50, y: 50, width: 300, height: 600 },
                { id: 'lane2', name: 'Procurement', x: 400, y: 50, width: 300, height: 600 },
                { id: 'lane3', name: 'Warehouse', x: 750, y: 50, width: 300, height: 600 }
            ];
        }
    }

    /**
     * Get current project
     */
    function getProject() {
        return currentProject;
    }

    /**
     * Get flowchart data
     */
    function getFlowchartData() {
        return flowchartData;
    }

    /**
     * Set flowchart data
     */
    function setFlowchartData(data) {
        flowchartData = data;
    }

    /**
     * Add node to flowchart
     */
    function addNode(node) {
        if (!flowchartData.nodes) {
            flowchartData.nodes = [];
        }
        flowchartData.nodes.push(node);

        // Audit Trail: Record flowchart.node.add (Sprint 5)
        recordAuditAction('flowchart.node.add', {
            nodeId: node.id,
            nodeType: node.type,
            nodeText: node.text,
            position: { x: node.x, y: node.y }
        });

        return node;
    }

    /**
     * Update node in flowchart
     */
    function updateNode(nodeId, updates) {
        const node = flowchartData.nodes.find(n => n.id === nodeId);
        if (node) {
            const previousValues = { ...node };
            Object.assign(node, updates);

            // Audit Trail: Record flowchart.node.edit (Sprint 5)
            recordAuditAction('flowchart.node.edit', {
                nodeId: node.id,
                previousValues: previousValues,
                newValues: updates
            });
        }
        return node;
    }

    /**
     * Delete node from flowchart
     */
    function deleteNode(nodeId) {
        const node = flowchartData.nodes.find(n => n.id === nodeId);
        const index = flowchartData.nodes.findIndex(n => n.id === nodeId);
        if (index !== -1) {
            // Audit Trail: Record flowchart.node.delete (Sprint 5)
            if (node) {
                recordAuditAction('flowchart.node.delete', {
                    nodeId: node.id,
                    nodeType: node.type,
                    nodeText: node.text
                });
            }

            flowchartData.nodes.splice(index, 1);
            // Also delete connected connectors
            flowchartData.connectors = flowchartData.connectors.filter(
                c => c.from !== nodeId && c.to !== nodeId
            );
        }
    }

    /**
     * Add connector to flowchart
     */
    function addConnector(connector) {
        if (!flowchartData.connectors) {
            flowchartData.connectors = [];
        }
        flowchartData.connectors.push(connector);

        // Audit Trail: Record flowchart.connector.add (Sprint 5)
        recordAuditAction('flowchart.connector.add', {
            from: connector.from,
            to: connector.to,
            label: connector.label
        });

        return connector;
    }

    /**
     * Helper function to record audit actions (non-blocking)
     */
    function recordAuditAction(action, details) {
        if (typeof AuditTrail === 'undefined') return;

        try {
            const user = AuditFlow.getUser();
            const project = currentProject;
            AuditTrail.record(action, {
                userId: user ? user.id : null,
                projectId: project ? project.id : null,
                ...details,
                source: 'manual'
            });
        } catch (e) {
            // Silent fail - audit should not affect main functionality
            console.warn('AuditTrail action failed:', e);
        }
    }

    /**
     * Get node by ID
     */
    function getNode(nodeId) {
        return flowchartData.nodes.find(n => n.id === nodeId);
    }

    /**
     * Save flowchart to project
     */
    function saveToProject() {
        if (!currentProject) return false;

        currentProject.flowchart = {
            ...flowchartData,
            updatedAt: new Date().toISOString()
        };

        // Use AuditFlow to save
        if (typeof AuditFlow !== 'undefined') {
            AuditFlow.saveProject(currentProject);
        }

        return true;
    }

    /**
     * Create sample flowchart data
     */
    function createSampleFlowchart() {
        const sampleNodes = [
            { id: 1, type: 'terminator', text: 'Start', x: 200, y: 100, swimlane: 'lane1', color: 'start' },
            { id: 2, type: 'process', text: 'Receive Purchase Request', x: 200, y: 200, swimlane: 'lane1', color: 'process' },
            { id: 3, type: 'decision', text: 'Approved?', x: 200, y: 320, swimlane: 'lane1', color: 'decision' },
            { id: 4, type: 'process', text: 'Select Vendor', x: 550, y: 200, swimlane: 'lane2', color: 'process' },
            { id: 5, type: 'process', text: 'Create PO', x: 550, y: 320, swimlane: 'lane2', color: 'process' },
            { id: 6, type: 'document', text: 'PO Document', x: 550, y: 440, swimlane: 'lane2', color: 'document' },
            { id: 7, type: 'process', text: 'Receive Goods', x: 900, y: 200, swimlane: 'lane3', color: 'process' },
            { id: 8, type: 'document', text: 'Receiving Report', x: 900, y: 320, swimlane: 'lane3', color: 'document' },
            { id: 9, type: 'terminator', text: 'End', x: 900, y: 480, swimlane: 'lane3', color: 'end' }
        ];

        flowchartData.nodes = sampleNodes;

        const sampleConnectors = [
            { from: 1, to: 2 },
            { from: 2, to: 3 },
            { from: 3, to: 4, label: 'No' },
            { from: 3, to: 5, label: 'Yes' },
            { from: 4, to: 5 },
            { from: 5, to: 6 },
            { from: 4, to: 7 },
            { from: 7, to: 8 },
            { from: 8, to: 9 }
        ];

        flowchartData.connectors = sampleConnectors;
    }

    // Public API
    return {
        init,
        getProject,
        getFlowchartData,
        setFlowchartData,
        addNode,
        updateNode,
        deleteNode,
        addConnector,
        getNode,
        saveToProject,
        createSampleFlowchart
    };
})();