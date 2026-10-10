const fs = require('fs');
let svg = fs.readFileSync('fist-logo.svg', 'utf8');
// Extract the head-silhouette group and the face group (full blocks incl. paths)
const hs = svg.match(/  <g id="head-silhouette">[\s\S]*?\n  <\/g>/);
const face = svg.match(/  <g id="face" class="part">[\s\S]*?\n  <\/g>/);
if (!hs || !face) { console.log('match failed'); process.exit(1); }
// Remove face block, then reinsert it right after background group's closing tag
svg = svg.replace(face[0], '');
const bgClose = '  </g>';
const idx = svg.indexOf(bgClose);
svg = svg.slice(0, idx + bgClose.length) + '\n\n' + face[0] + svg.slice(idx + bgClose.length);
fs.writeFileSync('fist-logo.svg', svg);
console.log('reordered. head-silhouette first?', svg.indexOf('head-silhouette') < svg.indexOf('<g id="face"'));
