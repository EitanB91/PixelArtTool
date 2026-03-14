'use strict';

// tests/history.test.js
// Algorithm-extraction pattern — does NOT import the IIFE module.
// Reimplements the pure history stack logic as a standalone class and tests it directly.

// ── Extracted pure logic ──────────────────────────────────────────────────────

var MAX_HISTORY = 50;

function makeHistory() {
    var _stack = [];
    var _pos   = -1;

    function push(pixelData) {
        _stack = _stack.slice(0, _pos + 1);
        _stack.push(Array.from(pixelData)); // copy
        if (_stack.length > MAX_HISTORY) _stack.shift();
        _pos = _stack.length - 1;
    }

    function undo() {
        if (_pos <= 0) return null;
        _pos--;
        return _stack[_pos].slice();
    }

    function redo() {
        if (_pos >= _stack.length - 1) return null;
        _pos++;
        return _stack[_pos].slice();
    }

    function canUndo() { return _pos > 0; }
    function canRedo() { return _pos < _stack.length - 1; }
    function reset()   { _stack = []; _pos = -1; }
    function size()    { return _stack.length; }
    function pos()     { return _pos; }

    return { push, undo, redo, canUndo, canRedo, reset, size, pos };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('History — push', function() {
    test('push adds to stack and advances position', function() {
        var h = makeHistory();
        h.push([1, 2, 3]);
        expect(h.size()).toBe(1);
        expect(h.pos()).toBe(0);
    });

    test('push stores a copy, not the original reference', function() {
        var h = makeHistory();
        var data = [10, 20, 30];
        h.push(data);
        data[0] = 99; // mutate original
        var result = h.undo(); // should be null (pos <= 0), so test with two pushes
        // Redo test: push initial, push second, undo to first, check value
        var h2 = makeHistory();
        var a = [1, 2, 3];
        h2.push(a);
        a[0] = 99;
        h2.push([4, 5, 6]);
        var restored = h2.undo();
        expect(restored[0]).toBe(1); // snapshot was taken before mutation
    });

    test('push drops redo states when writing new entry', function() {
        var h = makeHistory();
        h.push([1]);
        h.push([2]);
        h.push([3]);
        h.undo(); // back to [2]
        h.push([99]); // should discard [3]
        expect(h.size()).toBe(3); // [1], [2], [99]
        expect(h.canRedo()).toBe(false);
    });

    test('push evicts oldest entry when stack exceeds 50', function() {
        var h = makeHistory();
        for (var i = 0; i <= MAX_HISTORY; i++) {
            h.push([i]);
        }
        expect(h.size()).toBe(MAX_HISTORY); // capped at 50
        expect(h.pos()).toBe(MAX_HISTORY - 1);
    });

    test('exactly 50 pushes: stack stays at 50', function() {
        var h = makeHistory();
        for (var i = 0; i < MAX_HISTORY; i++) {
            h.push([i]);
        }
        expect(h.size()).toBe(MAX_HISTORY);
    });
});

describe('History — undo', function() {
    test('undo returns null when at start', function() {
        var h = makeHistory();
        h.push([1]);
        expect(h.undo()).toBeNull();
    });

    test('undo returns previous state', function() {
        var h = makeHistory();
        h.push([1, 0, 0]);
        h.push([2, 0, 0]);
        var result = h.undo();
        expect(result[0]).toBe(1);
    });

    test('canUndo is false at pos 0', function() {
        var h = makeHistory();
        h.push([1]);
        expect(h.canUndo()).toBe(false);
    });

    test('canUndo is true after second push', function() {
        var h = makeHistory();
        h.push([1]);
        h.push([2]);
        expect(h.canUndo()).toBe(true);
    });

    test('multiple undos walk back through history', function() {
        var h = makeHistory();
        h.push([1]);
        h.push([2]);
        h.push([3]);
        h.undo(); // to [2]
        var result = h.undo(); // to [1]
        expect(result[0]).toBe(1);
        expect(h.undo()).toBeNull(); // at bottom
    });
});

describe('History — redo', function() {
    test('redo returns null when at top', function() {
        var h = makeHistory();
        h.push([1]);
        expect(h.redo()).toBeNull();
    });

    test('redo returns the state after undo', function() {
        var h = makeHistory();
        h.push([1]);
        h.push([2]);
        h.undo();
        var result = h.redo();
        expect(result[0]).toBe(2);
    });

    test('canRedo is false at top', function() {
        var h = makeHistory();
        h.push([1]);
        h.push([2]);
        expect(h.canRedo()).toBe(false);
    });

    test('canRedo is true after undo', function() {
        var h = makeHistory();
        h.push([1]);
        h.push([2]);
        h.undo();
        expect(h.canRedo()).toBe(true);
    });
});

describe('History — reset', function() {
    test('reset clears stack and position', function() {
        var h = makeHistory();
        h.push([1]);
        h.push([2]);
        h.reset();
        expect(h.size()).toBe(0);
        expect(h.pos()).toBe(-1);
        expect(h.canUndo()).toBe(false);
        expect(h.canRedo()).toBe(false);
    });
});
