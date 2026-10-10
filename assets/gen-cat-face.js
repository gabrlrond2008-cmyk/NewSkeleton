const fs = require('fs');
const raw = fs.readFileSync('C:/Users/Gabrl/Desktop/NewSkeleton/assets/fist-logo.svg', 'utf8');
const svgStart = raw.indexOf('<svg');
const svgEnd = raw.lastIndexOf('</svg>') + '</svg>'.length;
const inner = raw.slice(svgStart, svgEnd);

const map = {};
const re = /<g id="([\w-]+)"[^>]*>[\s\S]*?<\/g>/g;
let m;
while ((m = re.exec(inner)) !== null) map[m[1]] = m[0];

const LAYER_ORDER = [
    'background', 'face', 'face-mark', 'eye-l', 'eye-r',
    'snout', 'ear-detail-l', 'ear-detail-r', 'accent-l'
];

function stripPart(g) {
    return g.replace(/\sclass="part"/g, '');
}
function addEyeClass(g) {
    if (/class=/.test(g)) {
        return g.replace(/class="([^"]*)"/, 'class="$1 fistEye"');
    }
    return g.replace(/^<g/, '<g class="fistEye"');
}

const body = [];
for (const id of LAYER_ORDER) {
    let g = map[id];
    if (!g) { body.push('<!-- MISSING ' + id + ' -->'); continue; }
    g = stripPart(g);
    if (id === 'eye-l' || id === 'eye-r') g = addEyeClass(g);
    body.push(g);
}
const bodyHtml = body.join('');

const VIEWBOX = '520 150 370 370';

const faceSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VIEWBOX + '">' + bodyHtml + '</svg>';
const iconBody = bodyHtml.replace(map.background, '');
const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VIEWBOX + '">' + iconBody + '</svg>';

const js =
    '/* eslint-disable */\n' +
    'export const FIST_CAT_FACE = ' + JSON.stringify(faceSvg) + ';\n' +
    'export const FIST_CAT_ICON = ' + JSON.stringify(iconSvg) + ';\n';

const target = 'C:/Users/Gabrl/Desktop/NewSkeleton/scratch-gui/src/lib/fist-cat-face.js';
fs.writeFileSync(target, js);
console.log('escrito', target, '->', js.length, 'bytes');
console.log('face tiene fistEye x2:', (faceSvg.match(/fistEye/g) || []).length);
console.log('icon sin background:', iconSvg.indexOf('F2F6F8') === -1);
