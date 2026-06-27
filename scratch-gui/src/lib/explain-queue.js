var pending = null;

export function setPendingExplain(data) {
    pending = data;
}

export function getPendingExplain() {
    var d = pending;
    pending = null;
    return d;
}
