const fs = require('fs');
const raw = fs.readFileSync('C:/Users/Gabrl/Desktop/NewSkeleton/assets/fist-logo.svg', 'utf8');

const groups = {};
const re = /<g id="([\w-]+)"[^>]*>([\s\S]*?)<\/g>/g;
let m;
while ((m = re.exec(raw)) !== null) {
    groups[m[1]] = m[2];
}

function pathBBox(d) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const toks = d.match(/-?\d+(?:\.\d+)?/g);
    for (let i = 0; i + 1 < toks.length; i += 2) {
        const x = parseFloat(toks[i]);
        const y = parseFloat(toks[i + 1]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    return {minX, minY, maxX, maxY};
}

const pathsIn = (inner) => {
    const out = [];
    const pr = /<path d="([^"]*)"[^>]*transform="translate\((-?[\d.]+)\s*,(-?[\d.]+)\)"/g;
    let pm;
    while ((pm = pr.exec(inner)) !== null) {
        out.push({d: pm[1], tx: parseFloat(pm[2]), ty: parseFloat(pm[3])});
    }
    return out;
};

let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
for (const id of Object.keys(groups)) {
    if (id === 'background') continue;
    for (const p of pathsIn(groups[id])) {
        const b = pathBBox(p.d);
        const x0 = b.minX + p.tx, x1 = b.maxX + p.tx;
        const y0 = b.minY + p.ty, y1 = b.maxY + p.ty;
        if (x0 < gMinX) gMinX = x0;
        if (x1 > gMaxX) gMaxX = x1;
        if (y0 < gMinY) gMinY = y0;
        if (y1 > gMaxY) gMaxY = y1;
    }
}
console.log('cat bbox x:', gMinX, gMaxX, 'y:', gMinY, gMaxY);
console.log('w:', gMaxX - gMinX, 'h:', gMaxY - gMinY);
