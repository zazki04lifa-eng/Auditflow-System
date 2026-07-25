/**
 * AuditFlow - Flowchart Renderer
 * Handles SVG rendering of swimlanes, nodes, connectors, and WCGW indicators
 */

const FlowchartRenderer = (function () {
    'use strict';

    // Node color mapping
    const colorMap = {
        start: '#10b981',
        end: '#ef4444',
        process: '#3b82f6',
        decision: '#f59e0b',
        document: '#8b5cf6',
        manual_input: '#06b6d4',
        manual_operation: '#ec4899',
        data: '#6366f1',
        terminator: '#10b981'
    };

    // Shape dimensions
    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 60;

    /**
     * Render all swimlanes
     */
    function renderSwimlanes(swimlanesGroup, swimlanes) {
        swimlanesGroup.innerHTML = '';

        // Add arrowhead marker definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
        `;

        const existingDefs = swimlanesGroup.ownerSVGElement.querySelector('defs');
        if (existingDefs) {
            existingDefs.innerHTML = defs.innerHTML;
        }

        swimlanes.forEach(lane => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', 'swimlane-group');
            group.setAttribute('data-lane-id', lane.id);

            // Lane rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', lane.x);
            rect.setAttribute('y', lane.y);
            rect.setAttribute('width', lane.width);
            rect.setAttribute('height', lane.height);
            rect.setAttribute('class', 'swimlane');
            group.appendChild(rect);

            // Lane header
            const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            header.setAttribute('x', lane.x);
            header.setAttribute('y', lane.y);
            header.setAttribute('width', lane.width);
            header.setAttribute('height', 40);
            header.setAttribute('class', 'swimlane-header');
            group.appendChild(header);

            // Lane name
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', lane.x + lane.width / 2);
            text.setAttribute('y', lane.y + 25);
            text.setAttribute('class', 'swimlane-text');
            text.textContent = lane.name;
            group.appendChild(text);

            swimlanesGroup.appendChild(group);
        });
    }

    /**
     * Render all nodes
     */
    function renderNodes(nodesGroup, nodes) {
        nodesGroup.innerHTML = '';
        nodes.forEach(node => {
            const element = createNodeElement(node);
            nodesGroup.appendChild(element);
        });
    }

    /**
     * Create a single node SVG element
     */
    function createNodeElement(node) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `node node-${node.type}`);
        group.setAttribute('data-node-id', node.id);
        group.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        const color = colorMap[node.color] || colorMap.process;
        const x = 0;
        const y = 0;
        const width = NODE_WIDTH;
        const height = NODE_HEIGHT;

        // Create shape based on node type
        let shape;
        switch (node.type) {
            case 'terminator':
                shape = createRoundedRect(x, y, width, height, 15);
                break;
            case 'decision':
                shape = createDiamond(x + width / 2, y + height / 2, width / 2, height / 2);
                break;
            case 'document':
                shape = createDocumentShape(x, y, width, height);
                break;
            default:
                shape = createRect(x, y, width, height);
        }

        shape.setAttribute('fill', color);
        shape.setAttribute('stroke', '#374151');
        shape.setAttribute('stroke-width', '2');
        group.appendChild(shape);

        // Add text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + width / 2);
        text.setAttribute('y', y + height / 2);
        text.setAttribute('class', 'node-text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.textContent = node.text;
        group.appendChild(text);

        // Add WCGW indicator if present
        if (node.wcgw) {
            const wcgwIndicator = createWCGWIndicator(width, node.wcgw);
            group.appendChild(wcgwIndicator);
        }

        return group;
    }

    /**
     * Create rectangle shape
     */
    function createRect(x, y, width, height) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('rx', '4');
        return rect;
    }

    /**
     * Create rounded rectangle shape
     */
    function createRoundedRect(x, y, width, height, rx) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('rx', rx);
        return rect;
    }

    /**
     * Create diamond shape (for decision nodes)
     */
    function createDiamond(cx, cy, rx, ry) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = [
            `${cx},${cy - ry}`,
            `${cx + rx},${cy}`,
            `${cx},${cy + ry}`,
            `${cx - rx},${cy}`
        ].join(' ');
        polygon.setAttribute('points', points);
        return polygon;
    }

    /**
     * Create document shape
     */
    function createDocumentShape(x, y, width, height) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `
            M ${x} ${y}
            L ${x + width} ${y}
            L ${x + width} ${y + height - 10}
            Q ${x + width / 2} ${y + height} ${x} ${y + height - 10}
            Z
        `;
        path.setAttribute('d', d);
        return path;
    }

    /**
     * Create WCGW indicator
     */
    function createWCGWIndicator(nodeWidth, wcgw) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'wcgw-indicator');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', nodeWidth + 10);
        circle.setAttribute('cy', 10);
        circle.setAttribute('r', 8);

        const riskColor = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#10b981'
        };
        circle.setAttribute('fill', riskColor[wcgw.risk] || '#f59e0b');
        group.appendChild(circle);

        return group;
    }

    /**
     * Render all connectors
     */
    function renderConnectors(connectorsGroup, connectors, nodes) {
        connectorsGroup.innerHTML = '';

        connectors.forEach(connector => {
            const fromNode = nodes.find(n => n.id === connector.from);
            const toNode = nodes.find(n => n.id === connector.to);

            if (fromNode && toNode) {
                const path = createConnectorPath(fromNode, toNode, connector.label);
                connectorsGroup.appendChild(path);
            }
        });
    }

    /**
     * Create connector path between two nodes
     */
    function createConnectorPath(fromNode, toNode, label) {
        const fromX = fromNode.x + NODE_WIDTH / 2;
        const fromY = fromNode.y + NODE_HEIGHT;
        const toX = toNode.x + NODE_WIDTH / 2;
        const toY = toNode.y;

        const midY = fromY + 30;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'connector');

        // Create path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#6b7280');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        group.appendChild(path);

        // Add label if present
        if (label) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', toX);
            text.setAttribute('y', midY - 5);
            text.setAttribute('class', 'connector-label');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = label;
            group.appendChild(text);
        }

        return group;
    }

    /**
     * Show WCGW tooltip
     */
    function showWCGWTooltip(e, wcgw) {
        let tooltip = document.getElementById('wcgw-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'wcgw-tooltip';
            tooltip.className = 'wcgw-tooltip';
            document.body.appendChild(tooltip);
        }

        const riskLabels = {
            high: 'Risiko Tinggi',
            medium: 'Risiko Sedang',
            low: 'Risiko Rendah'
        };

        tooltip.innerHTML = `
            <div class="tooltip-risk ${wcgw.risk}">${riskLabels[wcgw.risk] || wcgw.risk}</div>
            <div class="tooltip-text">${wcgw.text}</div>
            ${wcgw.control ? `<div class="tooltip-control">Kontrol: ${wcgw.control}</div>` : ''}
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX + 15}px`;
        tooltip.style.top = `${e.clientY + 15}px`;
    }

    /**
     * Hide WCGW tooltip
     */
    function hideWCGWTooltip() {
        const tooltip = document.getElementById('wcgw-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    // Public API
    return {
        renderSwimlanes,
        renderNodes,
        createNodeElement,
        renderConnectors,
        createConnectorPath,
        createWCGWIndicator,
        showWCGWTooltip,
        hideWCGWTooltip,
        colorMap,
        NODE_WIDTH,
        NODE_HEIGHT
    };
})();