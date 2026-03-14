'use strict';

var PalettePanel = (function() {
    function init() {
        var picker  = document.getElementById('color-picker');
        var btnAdd  = document.getElementById('btn-add-color');

        btnAdd.addEventListener('click', function() {
            if (Palette.getColors().length >= 8) {
                btnAdd.textContent = 'Palette full!';
                setTimeout(function() { btnAdd.textContent = '+'; }, 1500);
                return;
            }
            Palette.addColor(picker.value);
            refresh();
            Toolbar.refreshColorSwatch();
        });

        picker.addEventListener('input', function() {
            // Live preview: update active swatch color
            var idx = Palette.getActiveIdx();
            Palette.setColor(idx, picker.value);
            refresh();
            Toolbar.refreshColorSwatch();
        });

        refresh();
    }

    function refresh() {
        var container = document.getElementById('palette-swatches');
        container.innerHTML = '';
        var colors = Palette.getColors();
        colors.forEach(function(hex, idx) {
            var swatch = document.createElement('div');
            swatch.className = 'palette-swatch' + (idx === Palette.getActiveIdx() ? ' active' : '');
            swatch.style.background = hex;
            swatch.title = hex;
            swatch.addEventListener('click', function() {
                Palette.setActive(idx);
                document.getElementById('color-picker').value = hex;
                refresh();
                Toolbar.refreshColorSwatch();
            });
            swatch.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                Palette.removeColor(idx);
                refresh();
            });
            container.appendChild(swatch);
        });
    }

    return { init, refresh };
})();
