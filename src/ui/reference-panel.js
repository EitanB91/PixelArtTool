'use strict';

var ReferencePanel = (function() {
    function init() {
        document.getElementById('btn-load-ref').addEventListener('click', async function() {
            var result = await window.api.openImage();
            if (!result) return;
            var img = document.getElementById('reference-img');
            var placeholder = document.getElementById('reference-placeholder');
            img.src = 'data:image/' + result.ext + ';base64,' + result.base64;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            // Store base64 for AI panel use
            AppState.referenceBase64 = result.base64;
            AppState.referenceExt    = result.ext;
        });
    }

    return { init };
})();
