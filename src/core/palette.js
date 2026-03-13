'use strict';

// Palette — manages the active color set (max 8 colors for discipline)

var Palette = (function() {
    var _colors = ['#1A1A1A', '#CCCCCC', '#FFFFFF', '#FF8844', '#4488FF', '#44CC44'];
    var _active = 0; // index of active color

    function getColors()   { return _colors.slice(); }
    function getActive()   { return _colors[_active]; }
    function getActiveIdx(){ return _active; }

    function setActive(idx) {
        if (idx >= 0 && idx < _colors.length) _active = idx;
    }

    function addColor(hex) {
        hex = hex.toUpperCase();
        if (_colors.indexOf(hex) !== -1) { setActive(_colors.indexOf(hex)); return; }
        if (_colors.length >= 8) { console.warn('Palette full (max 8)'); return; }
        _colors.push(hex);
        _active = _colors.length - 1;
    }

    function removeColor(idx) {
        if (_colors.length <= 1) return;
        _colors.splice(idx, 1);
        if (_active >= _colors.length) _active = _colors.length - 1;
    }

    function setColor(idx, hex) {
        if (idx >= 0 && idx < _colors.length) _colors[idx] = hex.toUpperCase();
    }

    function reset() {
        _colors = ['#1A1A1A', '#CCCCCC', '#FFFFFF', '#FF8844', '#4488FF', '#44CC44'];
        _active = 0;
    }

    return { getColors, getActive, getActiveIdx, setActive, addColor, removeColor, setColor, reset };
})();
