'use strict';

// tests/animation-regions.test.js
// Phase O6-1: region struct tests (creation, pixel assignment, size gate).
// Shift engine tests deferred to Phase O6-3 when the engine is implemented.

// ── Extracted pure logic ───────────────────────────────────────────────────────

function makeAnimRegions() {
    var _regions = {};
    var _counter = 0;

    function addRegion(name, color) {
        _counter++;
        var id = 'r' + _counter;
        _regions[id] = {
            id:     id,
            name:   name || ('Region ' + _counter),
            color:  color || '#FF6B6B',
            pixels: new Set(),
            zOrder: 0
        };
        return _regions[id];
    }

    function removeRegion(id) {
        delete _regions[id];
    }

    function paintPixel(id, x, y) {
        var key = x + ',' + y;
        Object.keys(_regions).forEach(function(rid) {
            _regions[rid].pixels.delete(key);
        });
        if (_regions[id]) {
            _regions[id].pixels.add(key);
        }
    }

    function unpaintPixel(x, y) {
        var key = x + ',' + y;
        Object.keys(_regions).forEach(function(rid) {
            _regions[rid].pixels.delete(key);
        });
    }

    function getAll()     { return Object.values(_regions); }
    function getById(id)  { return _regions[id]; }

    function clear() {
        _regions = {};
        _counter = 0;
    }

    function isSizeGateOpen(w, h) {
        return w >= 24 && h >= 24;
    }

    return { addRegion, removeRegion, paintPixel, unpaintPixel, getAll, getById, clear, isSizeGateOpen };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AnimRegions — addRegion', function() {
    test('addRegion creates a region with unique id', function() {
        var ar = makeAnimRegions();
        var r1 = ar.addRegion('head', '#FF0000');
        var r2 = ar.addRegion('torso', '#00FF00');
        expect(r1.id).not.toBe(r2.id);
    });

    test('addRegion stores name and color', function() {
        var ar = makeAnimRegions();
        var r = ar.addRegion('legs', '#0000FF');
        expect(r.name).toBe('legs');
        expect(r.color).toBe('#0000FF');
    });

    test('addRegion defaults name when not provided', function() {
        var ar = makeAnimRegions();
        var r = ar.addRegion();
        expect(typeof r.name).toBe('string');
        expect(r.name.length).toBeGreaterThan(0);
    });

    test('addRegion starts with empty pixel set', function() {
        var ar = makeAnimRegions();
        var r = ar.addRegion('head', '#FF0000');
        expect(r.pixels.size).toBe(0);
    });

    test('addRegion includes zOrder field for Sprint 2 (D12)', function() {
        var ar = makeAnimRegions();
        var r = ar.addRegion('head', '#FF0000');
        expect(r).toHaveProperty('zOrder');
        expect(typeof r.zOrder).toBe('number');
    });
});

describe('AnimRegions — removeRegion', function() {
    test('removeRegion removes the region', function() {
        var ar = makeAnimRegions();
        var r = ar.addRegion('head', '#FF0000');
        ar.removeRegion(r.id);
        expect(ar.getById(r.id)).toBeUndefined();
    });

    test('removeRegion reduces getAll count', function() {
        var ar = makeAnimRegions();
        ar.addRegion('head', '#FF0000');
        var r = ar.addRegion('torso', '#00FF00');
        ar.removeRegion(r.id);
        expect(ar.getAll().length).toBe(1);
    });
});

describe('AnimRegions — paintPixel', function() {
    test('paintPixel assigns pixel to a region', function() {
        var ar = makeAnimRegions();
        var r = ar.addRegion('head', '#FF0000');
        ar.paintPixel(r.id, 5, 3);
        expect(r.pixels.has('5,3')).toBe(true);
    });

    test('paintPixel removes pixel from any other region first', function() {
        var ar = makeAnimRegions();
        var r1 = ar.addRegion('head', '#FF0000');
        var r2 = ar.addRegion('torso', '#00FF00');
        ar.paintPixel(r1.id, 5, 3);
        ar.paintPixel(r2.id, 5, 3); // reassign to r2
        expect(r1.pixels.has('5,3')).toBe(false);
        expect(r2.pixels.has('5,3')).toBe(true);
    });

    test('a pixel can only belong to one region at a time', function() {
        var ar = makeAnimRegions();
        var r1 = ar.addRegion('a', '#FF0000');
        var r2 = ar.addRegion('b', '#00FF00');
        var r3 = ar.addRegion('c', '#0000FF');
        ar.paintPixel(r1.id, 2, 2);
        ar.paintPixel(r2.id, 2, 2);
        ar.paintPixel(r3.id, 2, 2);
        var owners = ar.getAll().filter(function(r) { return r.pixels.has('2,2'); });
        expect(owners.length).toBe(1);
        expect(owners[0].id).toBe(r3.id);
    });
});

describe('AnimRegions — unpaintPixel', function() {
    test('unpaintPixel removes pixel from its region', function() {
        var ar = makeAnimRegions();
        var r = ar.addRegion('head', '#FF0000');
        ar.paintPixel(r.id, 4, 4);
        ar.unpaintPixel(4, 4);
        expect(r.pixels.has('4,4')).toBe(false);
    });

    test('unpaintPixel on unassigned pixel does not throw', function() {
        var ar = makeAnimRegions();
        ar.addRegion('head', '#FF0000');
        expect(function() { ar.unpaintPixel(99, 99); }).not.toThrow();
    });
});

describe('AnimRegions — getAll', function() {
    test('getAll returns all regions', function() {
        var ar = makeAnimRegions();
        ar.addRegion('a', '#FF0000');
        ar.addRegion('b', '#00FF00');
        ar.addRegion('c', '#0000FF');
        expect(ar.getAll().length).toBe(3);
    });

    test('getAll returns empty array when no regions', function() {
        var ar = makeAnimRegions();
        expect(ar.getAll()).toEqual([]);
    });
});

describe('AnimRegions — clear', function() {
    test('clear removes all regions', function() {
        var ar = makeAnimRegions();
        ar.addRegion('a', '#FF0000');
        ar.addRegion('b', '#00FF00');
        ar.clear();
        expect(ar.getAll().length).toBe(0);
    });

    test('clear resets id counter so first post-clear region is r1', function() {
        var ar = makeAnimRegions();
        ar.addRegion('a', '#FF0000');
        ar.clear();
        var r = ar.addRegion('new', '#FFFFFF');
        expect(r.id).toBe('r1');
    });
});

describe('AnimRegions — isSizeGateOpen', function() {
    test('returns true for 24×24', function() {
        var ar = makeAnimRegions();
        expect(ar.isSizeGateOpen(24, 24)).toBe(true);
    });

    test('returns true for 32×32', function() {
        var ar = makeAnimRegions();
        expect(ar.isSizeGateOpen(32, 32)).toBe(true);
    });

    test('returns false for 16×22 (default player sprite)', function() {
        var ar = makeAnimRegions();
        expect(ar.isSizeGateOpen(16, 22)).toBe(false);
    });

    test('returns false when only width meets threshold', function() {
        var ar = makeAnimRegions();
        expect(ar.isSizeGateOpen(24, 16)).toBe(false);
    });

    test('returns false when only height meets threshold', function() {
        var ar = makeAnimRegions();
        expect(ar.isSizeGateOpen(16, 24)).toBe(false);
    });

    test('returns false for 8×8', function() {
        var ar = makeAnimRegions();
        expect(ar.isSizeGateOpen(8, 8)).toBe(false);
    });
});
