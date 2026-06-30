var sharedMessages = [];

export function getSharedMessages() {
    return sharedMessages;
}

export function setSharedMessages(msgs) {
    sharedMessages = msgs;
    try {
        window.dispatchEvent(new CustomEvent('aisharedmessagechange'));
    } catch (e) {}
}

export function clearSharedMessages() {
    sharedMessages = [];
    try {
        window.dispatchEvent(new CustomEvent('aisharedmessagechange'));
    } catch (e) {}
}
