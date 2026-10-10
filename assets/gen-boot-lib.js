const fs = require('fs');
const raw = fs.readFileSync('C:/Users/Gabrl/Desktop/NewSkeleton/assets/fist-logo.svg', 'utf8');
const svgStart = raw.indexOf('<svg');
const svgEnd = raw.lastIndexOf('</svg>') + '</svg>'.length;
const inner = raw.slice(svgStart, svgEnd);

const layers = [
    ['background',   0.00,   0,   0, 'fade'],
    ['face',         0.06,   0, 140, 'slide'],
    ['face-mark',    0.28,   0, -150, 'slide'],
    ['accent-l',     0.48, 150,   0, 'slide'],
    ['ear-detail-l', 0.62, -150, -170, 'slide'],
    ['ear-detail-r', 0.72, 150, -170, 'slide'],
    ['snout',        0.86,   0, 150, 'slide'],
    ['eye-l',        1.08, -230,   0, 'eye'],
    ['eye-r',        1.16, 230,   0, 'eye']
];

const map = {};
const re = /<g id="([\w-]+)"[^>]*>[\s\S]*?<\/g>/g;
let m;
while ((m = re.exec(inner)) !== null) map[m[1]] = m[0];
map.background = map.background.replace('fill="#F2F6F8"', 'fill="#FFFFFF"');

let out = '';
for (const [id, delay, dx, dy, kind] of layers) {
    const rawG = map[id];
    if (!rawG) { out += '<!-- MISSING ' + id + ' -->'; continue; }
    if (kind === 'fade') {
        out += '<g class="boot-fade" style="animation-delay:' + delay + 's">' + rawG + '</g>';
    } else if (kind === 'eye') {
        const withCls = rawG.replace(/(<g id="[^"]*")([^>]*)>/, (a, b, c) =>
            b + (c.indexOf('class=') >= 0
                ? c.replace(/class="([^"]*)"/, 'class="$1 splash-eyes"')
                : c + ' class="splash-eyes"') + '>');
        out += '<g class="boot-slide" style="--dx:' + dx + 'px;--dy:' + dy + 'px;animation-delay:' + delay + 's">' + withCls + '</g>';
    } else {
        out += '<g class="boot-slide" style="--dx:' + dx + 'px;--dy:' + dy + 'px;animation-delay:' + delay + 's">' + rawG + '</g>';
    }
}
const vBox = inner.match(/viewBox="[^"]*"/)[0];
const w = inner.match(/width="[^"]*"/)[0];
const h = inner.match(/height="[^"]*"/)[0];

const style = '<defs><style>' +
    '.stage-box { width:min(640px, 84vw); }' +
    '.stage-box svg { width:100%; height:auto; display:block; }' +
    '.splash-overlay { animation:stage-exit .5s ease 2.5s forwards; }' +
    '.boot-slide { animation:boot-slide .45s cubic-bezier(.22,1.2,.36,1) backwards; }' +
    '.boot-fade { opacity:0; animation:boot-fade .5s ease-out both; }' +
    '.splash-eyes { transform-box:fill-box; transform-origin:center; animation:splash-blink .26s ease-in-out 1.9s, splash-blink .26s ease-in-out 2.08s; }' +
    '@keyframes boot-slide { from { transform:translate(var(--dx,0), var(--dy,0)); opacity:0; } to { transform:translate(0,0); opacity:1; } }' +
    '@keyframes boot-fade { to { opacity:1; } }' +
    '@keyframes splash-blink { 0%,40%,100% { transform:scaleY(1); } 50% { transform:scaleY(0.14); } }' +
    '@keyframes stage-exit { to { opacity:0; visibility:hidden; } }' +
    '</style></defs>';

const svgMarkup = '<svg xmlns="http://www.w3.org/2000/svg" ' + w + ' ' + h + ' ' + vBox + '>' + style + out + '</svg>';
const js = '/* eslint-disable */\nexport const FIST_LOGO_BOOT = `' + svgMarkup + '`;\n';
const target = 'C:/Users/Gabrl/Desktop/NewSkeleton/scratch-gui/src/lib/fist-logo-boot.js';
fs.writeFileSync(target, js);
console.log('escrito', target, '->', js.length, 'bytes');
