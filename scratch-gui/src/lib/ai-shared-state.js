var sharedMessages = [];
var pendingRestore = false;

export function getSharedMessages() {
    return sharedMessages;
}

export function setSharedMessages(msgs, options) {
    if (options && options.restore) {
        pendingRestore = true;
    }
    sharedMessages = msgs;
    try {
        window.dispatchEvent(new CustomEvent('aisharedmessagechange', {
            detail: {restore: !!(options && options.restore)}
        }));
    } catch (e) {}
}

export function consumePendingRestore() {
    var value = pendingRestore;
    pendingRestore = false;
    return value;
}

export function clearSharedMessages() {
    sharedMessages = [];
    try {
        window.dispatchEvent(new CustomEvent('aisharedmessagechange'));
    } catch (e) {}
}
