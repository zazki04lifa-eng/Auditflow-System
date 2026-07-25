/**
 * AuditFlow - Flowchart Undo/Redo Manager
 * Handles state history for undo and redo operations
 */

const FlowchartUndoRedo = (function () {
    'use strict';

    // Private state
    let undoStack = [];
    let redoStack = [];
    const MAX_HISTORY = 50;

    /**
     * Initialize undo/redo manager
     */
    function init() {
        undoStack = [];
        redoStack = [];
    }

    /**
     * Save current state to undo stack
     */
    function saveState(flowchartData) {
        // Limit stack size
        if (undoStack.length >= MAX_HISTORY) {
            undoStack.shift();
        }

        undoStack.push(JSON.stringify(flowchartData));

        // Clear redo stack on new action
        redoStack = [];
    }

    /**
     * Undo last action
     */
    function undo(flowchartData) {
        if (undoStack.length === 0) {
            return null;
        }

        // Save current state to redo stack
        redoStack.push(JSON.stringify(flowchartData));

        // Return previous state
        const previousState = undoStack.pop();
        return JSON.parse(previousState);
    }

    /**
     * Redo last undone action
     */
    function redo(flowchartData) {
        if (redoStack.length === 0) {
            return null;
        }

        // Save current state to undo stack
        undoStack.push(JSON.stringify(flowchartData));

        // Return next state
        const nextState = redoStack.pop();
        return JSON.parse(nextState);
    }

    /**
     * Check if undo is available
     */
    function canUndo() {
        return undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    function canRedo() {
        return redoStack.length > 0;
    }

    /**
     * Get undo stack length
     */
    function getUndoCount() {
        return undoStack.length;
    }

    /**
     * Get redo stack length
     */
    function getRedoCount() {
        return redoStack.length;
    }

    /**
     * Clear all history
     */
    function clear() {
        undoStack = [];
        redoStack = [];
    }

    // Public API
    return {
        init,
        saveState,
        undo,
        redo,
        canUndo,
        canRedo,
        getUndoCount,
        getRedoCount,
        clear
    };
})();