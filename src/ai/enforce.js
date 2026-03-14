'use strict';

// AI Enforce — post-generation style enforcement.
// reduce():        palette reduction via nearest-neighbor Euclidean RGB merging.
// detectOutline(): stub — will be implemented in Phase 6 (O1).
// enforce():       entry point called after AI generation.

var AIEnforce = (function() {

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _rgbToHex(r, g, b) {
        return '#' +
            ('0' + r.toString(16)).slice(-2).toUpperCase() +
            ('0' + g.toString(16)).slice(-2).toUpperCase() +
            ('0' + b.toString(16)).slice(-2).toUpperCase();
    }

    function _hexToRgb(hex) {
        return [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
    }

    function _nearestColor(r, g, b, keptRgb) {
        var best = null;
        var bestDist = Infinity;
        for (var j = 0; j < keptRgb.length; j++) {
            var dr = r - keptRgb[j][0];
            var dg = g - keptRgb[j][1];
            var db = b - keptRgb[j][2];
            var dist = dr * dr + dg * dg + db * db;
            if (dist < bestDist) {
                bestDist = dist;
                best = keptRgb[j];
            }
        }
        return best;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    // reduce(pixels, maxColors)
    // Scans the pixel array, keeps the top N colors by frequency,
    // remaps all other pixels to their nearest kept color.
    // Modifies pixels in-place. Returns true if any pixels were changed.
    function reduce(pixels, maxColors) {
        maxColors = maxColors || 6;

        // Count distinct opaque colors
        var colorMap = {};
        for (var i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] < 128) continue;
            var hex = _rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2]);
            colorMap[hex] = (colorMap[hex] || 0) + 1;
        }

        var colors = Object.keys(colorMap);
        if (colors.length <= maxColors) return false;

        // Keep the most-used N colors
        colors.sort(function(a, b) { return colorMap[b] - colorMap[a]; });
        var kept    = colors.slice(0, maxColors);
        var keptSet = {};
        kept.forEach(function(h) { keptSet[h] = true; });
        var keptRgb = kept.map(_hexToRgb);

        // Remap pixels not in the kept set to their nearest kept color
        var changed = false;
        for (var i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] < 128) continue;
            var hex = _rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2]);
            if (keptSet[hex]) continue;

            var nearest = _nearestColor(pixels[i], pixels[i + 1], pixels[i + 2], keptRgb);
            pixels[i]     = nearest[0];
            pixels[i + 1] = nearest[1];
            pixels[i + 2] = nearest[2];
            changed = true;
        }

        return changed;
    }

    // detectOutline(pixels, w, h)
    // Stub — Phase 6 (O1). Will detect boundary pixels and enforce outline color.
    function detectOutline(pixels, w, h) {
        // Not yet implemented
    }

    // enforce(pixels, w, h, statusEl)
    // Entry point. Checks the artist toggle; if enabled, runs reduce().
    // If pixels changed: commits a new History entry and redraws.
    // Appends a note to statusEl if provided.
    function enforce(pixels, w, h, statusEl) {
        var toggle = document.getElementById('enforce-toggle');
        if (toggle && !toggle.checked) return;

        var changed = reduce(pixels);
        if (changed) {
            History.push(pixels);
            PixelCanvas.redraw();
            if (statusEl) {
                statusEl.textContent += ' · palette enforced';
            }
        }
    }

    return { reduce, detectOutline, enforce };
})();
