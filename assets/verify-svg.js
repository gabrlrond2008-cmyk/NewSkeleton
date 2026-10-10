const fs = require('fs');
const svg = fs.readFileSync('fist-logo.svg', 'utf8');
// well-formed check: tags balance for svg/g/path/defs/style
const opens = (svg.match(/<(svg|g|defs|style|path)\b/g) || []).length;
const closes = (svg.match(/<\/(svg|g|defs|style|path)>/g) || []).length;
console.log('open tags:', opens, 'close tags:', closes);
// expected order of fills+transforms from the ORIGINAL file
const expected = [
  ['#F2F6F8','translate(0,0)'],
  ['#FCFDFD','translate(616,215)'],
  ['#F9FCFD','translate(703.1875,166.5625)'],
  ['#254979','translate(701.125,156.875)'],
  ['#274A79','translate(616,215)'],
  ['#274A79','translate(665,307)'],
  ['#264A79','translate(751,307)'],
  ['#254978','translate(721,285)'],
  ['#2A4B79','translate(618,239)'],
  ['#2A4B77','translate(789.75,239.3125)'],
  ['#324F75','translate(773,228)'],
  ['#395578','translate(751,307)']
];
const paths = [...svg.matchAll(/<path d="([^"]*)" fill="([^"]*)" transform="translate\(([^)]*)\)"/g)];
let ok = true;
if (paths.length !== expected.length) { ok = false; console.log('COUNT MISMATCH', paths.length); }
paths.forEach((m, i) => {
  const got = [m[2], 'translate(' + m[3] + ')'];
  const exp = expected[i];
  if (got[0] !== exp[0] || got[1] !== exp[1]) { ok = false; console.log('ORDER MISMATCH at', i, 'got', got, 'expected', exp); }
});
console.log(ok ? 'ORDER OK: 12 paths identical sequence (fill+translate)' : 'ORDER FAILED');
