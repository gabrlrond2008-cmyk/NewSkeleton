const fs = require('fs');
let svg = fs.readFileSync('fist-logo.svg', 'utf8');

// 1) remove the surrounding circle group (head-silhouette = path #3, the navy ring)
const before = svg;
svg = svg.replace(/[\t ]*<g id="head-silhouette">[\s\S]*?<\/g>\n/, '');
console.log('circle group removed:', before !== svg);

// 2) remove the bob keyframe and its class
svg = svg.replace(/      @keyframes bob \{[^\n]*\}\n/, '');
svg = svg.replace(/      \.anim-bob \{[^\n]*\}\n/, '');

fs.writeFileSync('fist-logo.svg', svg);

// report remaining groups
const groups = [...svg.matchAll(/<g id="([^"]+)"/g)].map(m => m[1]);
console.log('groups:', groups.join(', '));
console.log('has bob:', /bob/.test(svg));
