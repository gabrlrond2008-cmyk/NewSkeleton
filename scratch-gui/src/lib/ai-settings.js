import {isTauriRuntime} from './dialog-helper';

var isAiKey = function (key) {
    return key.indexOf('ai_') === 0 ||
        key.indexOf('_api_key') === key.length - '_api_key'.length ||
        key.indexOf('_model') === key.length - '_model'.length;
};

function collectSettings() {
    var out = {};
    for (var i = 0; i < window.localStorage.length; i++) {
        var key = window.localStorage.key(i);
        if (isAiKey(key)) {
            out[key] = window.localStorage.getItem(key);
        }
    }
    return out;
}

function applySettings(settings) {
    for (var key in settings) {
        if (Object.prototype.hasOwnProperty.call(settings, key)) {
            try { window.localStorage.setItem(key, settings[key]); } catch (e) {}
        }
    }
}

/*
 * Loads persisted AI settings from disk (Tauri) and hydrates localStorage,
 * so the user doesn't have to re-enter API keys every time they open the app.
 * In the browser it's a no-op (localStorage already persists).
 */
export function loadAiSettings(cb) {
    if (!isTauriRuntime()) {
        if (typeof cb === 'function') cb(null, null);
        return;
    }
    import('@tauri-apps/api/core').then(function (core) {
        return core.invoke('load_ai_settings');
    }).then(function (settings) {
        settings = settings || {};
        applySettings(settings);
        if (typeof cb === 'function') cb(null, settings);
    }).catch(function (e) {
        if (typeof cb === 'function') cb(e);
    });
}

/*
 * Persists every AI setting currently in localStorage to disk (Tauri).
 * No-op in the browser.
 */
export function saveAiSettings() {
    if (!isTauriRuntime()) return Promise.resolve();
    var settings = collectSettings();
    return import('@tauri-apps/api/core').then(function (core) {
        return core.invoke('save_ai_settings', {settings: settings});
    }).catch(function () {});
}