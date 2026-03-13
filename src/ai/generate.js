'use strict';

// AI Generate — takes a text prompt + optional reference image and describes
// a pixel art sprite as a color grid, then paints it onto the canvas.

var AIGenerate = (function() {

    var SYSTEM_PROMPT = `You are a pixel art sprite generator for a retro arcade game.
Given a description and optional reference image, output a sprite as a JSON color grid.

Rules:
- Use at most 6 colors (including transparent = null).
- Dark outline color for edges (e.g. "#1A1A1A").
- Strong silhouette — the shape must be recognizable at small size.
- Output ONLY valid JSON. No explanation. No markdown fences.
- Format: {"w": <width>, "h": <height>, "palette": ["#HEX", ...], "grid": [[paletteIndex or null, ...], ...]}
- palette[0] is always the darkest outline color.
- grid has h rows, each row has w values (palette index 0-5, or null for transparent).
- Dimensions must match the requested sprite size exactly.`;

    async function run(prompt, w, h, referenceBase64, referenceExt, statusEl) {
        if (!AIClient.hasKey()) {
            statusEl.textContent = 'No API key. Add ANTHROPIC_API_KEY to .env';
            return;
        }

        statusEl.textContent = 'Generating...';

        var userContent = [];

        // Optional reference image
        if (referenceBase64) {
            userContent.push({
                type: 'image',
                source: {
                    type:       'base64',
                    media_type: 'image/' + (referenceExt || 'png'),
                    data:       referenceBase64
                }
            });
        }

        userContent.push({
            type: 'text',
            text: 'Sprite description: ' + prompt + '\nSprite size: ' + w + '×' + h + ' pixels.'
        });

        try {
            var responseText = await AIClient.chat([
                { role: 'user', content: userContent }
            ], 2048);

            var parsed = JSON.parse(responseText);
            _applyGrid(parsed);
            statusEl.textContent = 'Done — ' + parsed.palette.length + ' colors';

        } catch(e) {
            statusEl.textContent = 'Error: ' + e.message;
            console.error(e);
        }
    }

    function _applyGrid(data) {
        var w = data.w;
        var h = data.h;
        var palette = data.palette;
        var grid    = data.grid;

        // Add all palette colors to the Palette module
        palette.forEach(function(hex) { Palette.addColor(hex); });
        if (window.PalettePanel) PalettePanel.refresh();

        // Resize canvas if needed
        var cw = PixelCanvas.getWidth();
        var ch = PixelCanvas.getHeight();
        if (cw !== w || ch !== h) {
            PixelCanvas.resize(w, h);
            document.getElementById('canvas-w').value = w;
            document.getElementById('canvas-h').value = h;
        }

        // Paint pixels by simulating pencil draws
        var pixels = PixelCanvas.getPixels();
        // Clear first
        PixelCanvas.clear();

        for (var py = 0; py < Math.min(h, PixelCanvas.getHeight()); py++) {
            for (var px = 0; px < Math.min(w, PixelCanvas.getWidth()); px++) {
                var idx = grid[py] ? grid[py][px] : null;
                if (idx !== null && idx !== undefined && palette[idx]) {
                    Palette.setActive(palette.indexOf(palette[idx]));
                    AppState.tool = 'pencil';
                    // Simulate a click by calling the internal draw API
                    // We set the pixel directly via a synthetic event isn't ideal;
                    // instead use the exported pixel array approach:
                    var i = (py * PixelCanvas.getWidth() + px) * 4;
                    var rgb = _hexToRgb(palette[idx]);
                    pixels[i]     = rgb[0];
                    pixels[i + 1] = rgb[1];
                    pixels[i + 2] = rgb[2];
                    pixels[i + 3] = 255;
                }
            }
        }

        History.push(pixels);
        PixelCanvas._redraw();
    }

    function _hexToRgb(hex) {
        return [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];
    }

    return { run };
})();
