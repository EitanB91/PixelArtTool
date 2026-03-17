'use strict';

// tests/animation-frames.test.js
// Algorithm-extraction pattern — pure logic reimplemented as standalone functions.
// Tests: frame add/remove/navigate, per-frame history isolation.

// ── Extracted pure logic ───────────────────────────────────────────────────────

var MAX_HISTORY = 50;

function makeHistory() {
    var _stack = [];
    var _pos   = -1;

    function push(pixelData) {
        _stack = _stack.slice(0, _pos + 1);
        _stack.push(Array.from(pixelData));
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

    return { push, undo, redo, canUndo, canRedo, reset, size };
}

function makeAnimFrames(w, h) {
    var _frames    = [];
    var _activeIdx = 0;
    var _w = w;
    var _h = h;

    function _blankPixels() {
        return new Array(_w * _h * 4).fill(0);
    }

    function _makeFrame(pixelData) {
        var hist = makeHistory();
        hist.push(pixelData);
        return { pixels: pixelData.slice(), history: hist };
    }

    function seed(pixelData) {
        _frames    = [_makeFrame(pixelData)];
        _activeIdx = 0;
    }

    function addFrame(duplicateCurrent) {
        var src = duplicateCurrent
            ? _frames[_activeIdx].pixels.slice()
            : _blankPixels();
        _frames.push(_makeFrame(src));
        return _frames.length - 1;
    }

    function removeFrame(idx) {
        if (_frames.length <= 1) return false;
        _frames.splice(idx, 1);
        if (_activeIdx >= _frames.length) {
            _activeIdx = _frames.length - 1;
        }
        return true;
    }

    function goToFrame(idx) {
        _activeIdx = Math.max(0, Math.min(_frames.length - 1, idx));
        return _frames[_activeIdx];
    }

    function setCurrentPixels(pixelData) {
        _frames[_activeIdx].pixels = pixelData.slice();
    }

    function getCurrentPixels() {
        return _frames[_activeIdx].pixels;
    }

    function getCurrentHistory() {
        return _frames[_activeIdx].history;
    }

    function getAll()         { return _frames.slice(); }
    function getFrameCount()  { return _frames.length; }
    function getActiveIndex() { return _activeIdx; }

    function reset() {
        _frames    = [];
        _activeIdx = 0;
    }

    return {
        seed, addFrame, removeFrame, goToFrame,
        setCurrentPixels, getCurrentPixels, getCurrentHistory,
        getAll, getFrameCount, getActiveIndex, reset
    };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AnimFrames — seed', function() {
    test('seed creates exactly one frame', function() {
        var af = makeAnimFrames(16, 16);
        af.seed([1, 2, 3, 4]);
        expect(af.getFrameCount()).toBe(1);
    });

    test('seed sets activeIndex to 0', function() {
        var af = makeAnimFrames(16, 16);
        af.seed([1, 2, 3, 4]);
        expect(af.getActiveIndex()).toBe(0);
    });

    test('seed stores a copy of pixel data', function() {
        var af = makeAnimFrames(4, 1);
        var src = [10, 20, 30, 255];
        af.seed(src);
        src[0] = 99; // mutate original
        expect(af.getCurrentPixels()[0]).toBe(10); // snapshot preserved
    });
});

describe('AnimFrames — addFrame', function() {
    test('addFrame increases frame count', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        expect(af.getFrameCount()).toBe(2);
    });

    test('addFrame returns new frame index', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        var idx = af.addFrame();
        expect(idx).toBe(1);
    });

    test('addFrame blank produces all-zero pixels', function() {
        var af = makeAnimFrames(1, 1);
        af.seed([255, 0, 0, 255]);
        af.addFrame(false);
        af.goToFrame(1);
        var px = af.getCurrentPixels();
        expect(px.every(function(v) { return v === 0; })).toBe(true);
    });

    test('addFrame duplicate copies current frame pixels', function() {
        var af = makeAnimFrames(1, 1);
        af.seed([255, 128, 0, 255]);
        af.addFrame(true);
        af.goToFrame(1);
        var px = af.getCurrentPixels();
        expect(px[0]).toBe(255);
        expect(px[1]).toBe(128);
        expect(px[2]).toBe(0);
        expect(px[3]).toBe(255);
    });

    test('duplicate does not share reference with original frame', function() {
        var af = makeAnimFrames(1, 1);
        af.seed([100, 100, 100, 255]);
        af.addFrame(true);
        // Mutate frame 0
        af.goToFrame(0);
        af.setCurrentPixels([50, 50, 50, 255]);
        // Frame 1 should still have original values
        af.goToFrame(1);
        expect(af.getCurrentPixels()[0]).toBe(100);
    });
});

describe('AnimFrames — removeFrame', function() {
    test('removeFrame returns false when only one frame exists', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        expect(af.removeFrame(0)).toBe(false);
    });

    test('removeFrame decreases frame count', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        af.removeFrame(1);
        expect(af.getFrameCount()).toBe(1);
    });

    test('removeFrame clamps activeIndex when active frame is removed', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        af.addFrame();
        af.goToFrame(2); // active = 2
        af.removeFrame(2);
        expect(af.getActiveIndex()).toBe(1); // clamped to last
    });

    test('removeFrame on non-active frame preserves activeIndex', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        af.addFrame();
        af.goToFrame(1);
        af.removeFrame(2); // remove last, not active
        expect(af.getActiveIndex()).toBe(1);
    });
});

describe('AnimFrames — goToFrame', function() {
    test('goToFrame sets active index', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        af.goToFrame(1);
        expect(af.getActiveIndex()).toBe(1);
    });

    test('goToFrame clamps to 0 for negative index', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.goToFrame(-5);
        expect(af.getActiveIndex()).toBe(0);
    });

    test('goToFrame clamps to last for out-of-range index', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        af.goToFrame(99);
        expect(af.getActiveIndex()).toBe(1);
    });

    test('goToFrame returns the frame object', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([1, 2, 3, 4]);
        af.addFrame(true);
        var frame = af.goToFrame(1);
        expect(frame).toBeDefined();
        expect(frame.pixels).toBeDefined();
        expect(frame.history).toBeDefined();
    });
});

describe('AnimFrames — per-frame history isolation', function() {
    test('undo on frame 1 does not affect frame 0 pixels', function() {
        var af = makeAnimFrames(1, 1);
        af.seed([100, 100, 100, 255]);
        af.addFrame(false);

        // Edit frame 1
        af.goToFrame(1);
        var h1 = af.getCurrentHistory();
        af.setCurrentPixels([200, 200, 200, 255]);
        h1.push([200, 200, 200, 255]);

        // Undo frame 1 back to blank
        var restored = h1.undo();
        if (restored) af.setCurrentPixels(restored);

        // Frame 0 must be untouched
        af.goToFrame(0);
        expect(af.getCurrentPixels()[0]).toBe(100);
    });

    test('each frame gets an independent history instance', function() {
        var af = makeAnimFrames(1, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame(false);

        var h0 = af.goToFrame(0).history;
        var h1 = af.goToFrame(1).history;

        expect(h0).not.toBe(h1);
    });

    test('undo on frame 0 does not alter frame 1 history', function() {
        var af = makeAnimFrames(1, 1);
        af.seed([10, 10, 10, 255]);

        var h0 = af.getCurrentHistory();
        h0.push([20, 20, 20, 255]); // second state on frame 0

        af.addFrame(true);
        var h1 = af.goToFrame(1).history;

        h0.undo(); // undo on frame 0

        // frame 1 history size unchanged
        expect(h1.size()).toBe(1);
    });
});

describe('AnimFrames — getAll', function() {
    test('getAll returns all frames', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        af.addFrame();
        expect(af.getAll().length).toBe(3);
    });

    test('getAll returns a shallow copy (not the internal array)', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        var all = af.getAll();
        all.push('bogus');
        expect(af.getFrameCount()).toBe(1); // internal array unaffected
    });
});

describe('AnimFrames — reset', function() {
    test('reset clears all frames', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        af.reset();
        expect(af.getFrameCount()).toBe(0);
    });

    test('reset sets activeIndex to 0', function() {
        var af = makeAnimFrames(4, 1);
        af.seed([0, 0, 0, 0]);
        af.addFrame();
        af.goToFrame(1);
        af.reset();
        expect(af.getActiveIndex()).toBe(0);
    });
});
