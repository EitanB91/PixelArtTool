'use strict';

// History — 50-step undo/redo stack

var History = (function() {
    var _stack = [];
    var _pos   = -1;
    var MAX    = 50;

    function push(pixelData) {
        // Drop any redo states
        _stack = _stack.slice(0, _pos + 1);
        _stack.push(new Uint8ClampedArray(pixelData));
        if (_stack.length > MAX) _stack.shift();
        _pos = _stack.length - 1;
    }

    function undo() {
        if (_pos <= 0) return null;
        _pos--;
        return new Uint8ClampedArray(_stack[_pos]);
    }

    function redo() {
        if (_pos >= _stack.length - 1) return null;
        _pos++;
        return new Uint8ClampedArray(_stack[_pos]);
    }

    function canUndo() { return _pos > 0; }
    function canRedo() { return _pos < _stack.length - 1; }

    function reset() { _stack = []; _pos = -1; }

    return { push, undo, redo, canUndo, canRedo, reset };
})();
