function isTauriRuntime() {
    return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
}

/*
 * Confirmation dialog that uses the native Tauri dialog plugin inside the
 * packaged app and falls back to the browser confirm() in dev/browser.
 * Returns a Promise resolving to a boolean.
 */
function confirmDialog(message, options) {
    if (isTauriRuntime()) {
        return import('@tauri-apps/plugin-dialog').then(function (dialog) {
            return dialog.confirm(message, options);
        }).catch(function () {
            return window.confirm(message);
        });
    }
    return Promise.resolve(window.confirm(message));
}

export {confirmDialog, isTauriRuntime};