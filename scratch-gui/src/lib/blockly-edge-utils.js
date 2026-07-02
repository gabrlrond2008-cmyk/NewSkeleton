function smoothstepPath(x1, y1, x2, y2) {
    var dy = y2 - y1;
    var my = Math.max(20, Math.abs(dy) * 0.45);
    var dx = x2 - x1;
    var mx = Math.max(20, Math.abs(dx) * 0.45);
    if (dy > 0) {
        return 'M ' + x1 + ' ' + y1 +
            ' C ' + x1 + ' ' + (y1 + my) +
            ', ' + x2 + ' ' + (y2 - my) +
            ', ' + x2 + ' ' + y2;
    }
    return 'M ' + x1 + ' ' + y1 +
        ' C ' + (x1 + mx) + ' ' + y1 +
        ', ' + (x2 - mx) + ' ' + y2 +
        ', ' + x2 + ' ' + y2;
}

function loopbackPath(x, y, w) {
    var r = Math.max(20, w * 0.3);
    return 'M ' + x + ' ' + y +
        ' C ' + (x + r) + ' ' + y +
        ', ' + (x + r) + ' ' + (y - 30) +
        ', ' + x + ' ' + (y - 30);
}

export {
    smoothstepPath,
    loopbackPath
};
