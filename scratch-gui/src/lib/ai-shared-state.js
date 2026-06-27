var sharedMessages = [];

export function getSharedMessages() {
    return sharedMessages;
}

export function setSharedMessages(msgs) {
    sharedMessages = msgs;
}

export function clearSharedMessages() {
    sharedMessages = [];
}
