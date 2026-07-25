/**
 * AuditFlow - Flowchart Interactions
 * Handles user interactions: drag, click, context menu, property panel
 */

const FlowchartInteractions = (function () {
    'use strict';

    // Private state
    let selectedNode = null;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let onNodeClickCallback = null;
    let onNodeDeleteCallback = null;
    let onNodeUpdateCallback = null;

    /**
     * Initialize interactions
     */
    function init(callbacks = {}) {
        onNodeClickCallback = callbacks.onNodeClick || null;
        onNodeDeleteCallback = callbacks.onNodeDelete || null;
        onNodeUpdateCallback = callbacks.onNodeUpdate || null;
    }

    /**
     * Handle node mouse down (start drag)
     */
    function handleNodeMouseDown(e, node, group, flowchartData) {
        if (e.button !== 0) return; // Only left click

        isDragging = true;
        const pt = getMousePosition(e, group.ownerSVGElement);
        dragOffset.x = pt.x - node.x;
        dragOffset.y = pt.y - node.y;

        e.stopPropagation();
    }

    /**
     * Handle node mouse move (during drag)
     */
    function handleNodeMouseMove(e, node, flowchartData) {
        if (!isDragging) return;

        const pt = getMousePosition(e, flowchartData.canvas);
        node.x = pt.x - dragOffset.x;
        node.y = pt.y - dragOffset.y;

        // Update visual position
        const group = flowchartData.canvas.querySelector(`[data-node-id="${node.id}"]`);
        if (group) {
            group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        }

        e.preventDefault();
    }

    /**
     * Handle node mouse up (end drag)
     */
    function handleNodeMouseUp() {
        isDragging = false;
    }

    /**
     * Handle node click (select)
     */
    function handleNodeClick(e, node, group) {
        e.stopPropagation();
        selectNode(node, group);

        if (onNodeClickCallback) {
            onNodeClickCallback(node);
        }
    }

    /**
     * Handle context menu (right click)
     */
    function handleContextMenu(e, node, contextMenu) {
        e.preventDefault();
        selectNode(node, null);
        showContextMenu(e.clientX, e.clientY, contextMenu);
    }

    /**
     * Select a node
     */
    function selectNode(node, group) {
        selectedNode = node;

        // Remove selection from all nodes
        document.querySelectorAll('.node.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to current node
        if (group) {
            group.classList.add('selected');
        }
    }

    /**
     * Get selected node
     */
    function getSelectedNode() {
        return selectedNode;
    }

    /**
     * Clear selection
     */
    function clearSelection() {
        selectedNode = null;
        document.querySelectorAll('.node.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }

    /**
     * Show context menu
     */
    function showContextMenu(x, y, contextMenu) {
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');
    }

    /**
     * Hide context menu
     */
    function hideContextMenu(contextMenu) {
        contextMenu.classList.add('hidden');
    }

    /**
     * Get mouse position relative to SVG
     */
    function getMousePosition(e, svg) {
        const rect = svg.getBoundingClientRect();
        const ctm = svg.getScreenCTM();
        return {
            x: (e.clientX - ctm.e) / ctm.a,
            y: (e.clientY - ctm.f) / ctm.d
        };
    }

    /**
     * Setup canvas event listeners
     */
    function setupCanvasListeners(canvas, flowchartData) {
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging && selectedNode) {
                handleNodeMouseMove(e, selectedNode, { canvas });
            }
        });

        canvas.addEventListener('mouseup', () => {
            handleNodeMouseUp();
        });

        canvas.addEventListener('click', (e) => {
            if (e.target === canvas || e.target.classList.contains('swimlane')) {
                clearSelection();
            }
        });
    }

    /**
     * Setup node event listeners
     */
    function setupNodeListeners(nodeGroup, node, canvas, contextMenu) {
        nodeGroup.addEventListener('mousedown', (e) => {
            handleNodeMouseDown(e, node, canvas);
        });

        nodeGroup.addEventListener('click', (e) => {
            handleNodeClick(e, node, nodeGroup);
        });

        nodeGroup.addEventListener('contextmenu', (e) => {
            handleContextMenu(e, node, contextMenu);
        });
    }

    /**
     * Add new node at position
     */
    function addNodeAtPosition(type, x, y, flowchartState, flowchartRenderer) {
        const nodes = flowchartState.getFlowchartData().nodes || [];
        const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1;

        const newNode = {
            id: newId,
            type: type,
            text: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            x: x,
            y: y,
            swimlane: 'lane1',
            color: type
        };

        flowchartState.addNode(newNode);
        return newNode;
    }

    /**
     * Delete selected node
     */
    function deleteSelectedNode(flowchartState) {
        if (!selectedNode) return false;

        flowchartState.deleteNode(selectedNode.id);

        if (onNodeDeleteCallback) {
            onNodeDeleteCallback(selectedNode);
        }

        selectedNode = null;
        return true;
    }

    /**
     * Update selected node properties
     */
    function updateSelectedNode(updates, flowchartState) {
        if (!selectedNode) return false;

        flowchartState.updateNode(selectedNode.id, updates);
        Object.assign(selectedNode, updates);

        if (onNodeUpdateCallback) {
            onNodeUpdateCallback(selectedNode);
        }

        return true;
    }

    /**
     * Duplicate selected node
     */
    function duplicateSelectedNode(flowchartState) {
        if (!selectedNode) return null;

        const newNode = {
            ...JSON.parse(JSON.stringify(selectedNode)),
            id: Date.now(), // Generate unique ID
            x: selectedNode.x + 50,
            y: selectedNode.y + 50
        };

        flowchartState.addNode(newNode);
        return newNode;
    }

    // Public API
    return {
        init,
        handleNodeMouseDown,
        handleNodeMouseMove,
        handleNodeMouseUp,
        handleNodeClick,
        handleContextMenu,
        selectNode,
        getSelectedNode,
        clearSelection,
        showContextMenu,
        hideContextMenu,
        getMousePosition,
        setupCanvasListeners,
        setupNodeListeners,
        addNodeAtPosition,
        deleteSelectedNode,
        updateSelectedNode,
        duplicateSelectedNode
    };
})();