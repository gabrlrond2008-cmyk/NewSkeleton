const fs = require('fs');
const boot = fs.readFileSync('C:/Users/Gabrl/Desktop/NewSkeleton/scratch-gui/src/lib/fist-logo-boot.js', 'utf8');

const checks = {
    'bg blanco (FFFFFF)': boot.indexOf('fill="#FFFFFF"') !== -1,
    'sin card (border-radius)': boot.indexOf('border-radius:20px') === -1,
    'sin box-shadow card': boot.indexOf('box-shadow:0 16px 40px') === -1,
    'stage-box width': boot.indexOf('.stage-box { width:min(640px, 84vw); }') !== -1,
    'overlay stage-exit': boot.indexOf('.splash-overlay { animation:stage-exit') !== -1
};

let ok = true;
for (const k of Object.keys(checks)) {
    console.log((checks[k] ? 'OK  ' : 'FAIL') + ' ' + k);
    if (!checks[k]) ok = false;
}
console.log(ok ? 'BOOT OK' : 'BOOT FAIL');
