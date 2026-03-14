'use strict';

// AI Client — thin IPC wrapper. All API calls happen in main.js.
// The renderer never sees the API key.

var AIClient = (function() {
    var _hasKey = false;

    async function init() {
        _hasKey = await window.api.checkApiKey();
        return _hasKey;
    }

    async function chat(messages, maxTokens, system) {
        if (!_hasKey) throw new Error('No ANTHROPIC_API_KEY. Add it to .env');
        return window.api.callClaude(messages, maxTokens || 1024, system || null);
    }

    function hasKey() { return _hasKey; }

    return { init, chat, hasKey };
})();
