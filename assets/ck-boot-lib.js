const fs = require('fs');
const s = fs.readFileSync('C:/Users/Gabrl/Desktop/NewSkeleton/scratch-gui/src/lib/fist-logo-boot.js', 'utf8');
const body = s.slice(s.indexOf("= '") + 3, s.lastIndexOf("';"));
console.log('len body:', body.length);
console.log('apostrofes:', (body.match(/'/g) || []).length);
console.log('backslashes:', (body.match(/\\/g) || []).length);
const idx = body.indexOf("'");
if (idx >= 0) {
    console.log('contexto comilla:', JSON.stringify(body.slice(Math.max(0, idx - 60), idx + 60)));
}
