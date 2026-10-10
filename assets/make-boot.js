const fs = require('fs');
const raw = fs.readFileSync('fist-logo.svg', 'utf8');
const svgStart = raw.indexOf('<svg');
const svgEnd = raw.lastIndexOf('</svg>') + '</svg>'.length;
const inner = raw.slice(svgStart, svgEnd);

const layers = [
  ['background',   0.00,   0,   0, 'fade'],
  ['face',         0.06,   0, 140, 'slide'],
  ['face-mark',    0.28,   0, -150, 'slide'],
  ['accent-l',     0.48, 150,   0, 'slide'],
  ['ear-detail-l', 0.62,-150,-170, 'slide'],
  ['ear-detail-r', 0.72, 150,-170, 'slide'],
  ['snout',        0.86,   0, 150, 'slide'],
  ['eye-l',        1.08,-230,   0, 'eye'],
  ['eye-r',        1.16, 230,   0, 'eye']
];

const map = {};
const re = /<g id="([\w-]+)"[^>]*>[\s\S]*?<\/g>/g;
let m;
while ((m = re.exec(inner)) !== null) map[m[1]] = m[0];

let out = '';
for (const [id, delay, dx, dy, kind] of layers) {
  const rawG = map[id];
  if (!rawG) { out += '<!-- MISSING ' + id + ' -->'; continue; }
  if (kind === 'fade') {
    out += '<g class="boot-fade" style="animation-delay:' + delay + 's">' + rawG + '</g>';
  } else if (kind === 'eye') {
    const withCls = rawG.replace(/(<g id="[^"]*")([^>]*)>/, (a,b,c) => b + (c.indexOf('class=') >= 0 ? c.replace(/class="([^"]*)"/, 'class="$1 splash-eyes"') : c + ' class="splash-eyes"') + '>');
    out += '<g class="boot-slide" style="--dx:' + dx + 'px;--dy:' + dy + 'px;animation-delay:' + delay + 's">' + withCls + '</g>';
  } else {
    out += '<g class="boot-slide" style="--dx:' + dx + 'px;--dy:' + dy + 'px;animation-delay:' + delay + 's">' + rawG + '</g>';
  }
}
const vBox = inner.match(/viewBox="[^"]*"/)[0];
const w = inner.match(/width="[^"]*"/)[0];
const h = inner.match(/height="[^"]*"/)[0];
const svgMarkup = '<svg xmlns="http://www.w3.org/2000/svg" ' + w + ' ' + h + ' ' + vBox + '>' + out + '</svg>';

const html = '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n' +
'<title>Fist - pantalla de carga (armado del logo + guiño)</title>\n' +
'<style>\n' +
'  * { box-sizing: border-box; }\n' +
'  body { margin:0; font-family:system-ui,sans-serif; background:#eef2f5; }\n' +
'  .stage-wrap { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:#eef2f5; }\n' +
'  .stage { width:min(640px, 84vw); background:#fff; border-radius:20px; padding:10px; box-shadow:0 16px 40px rgba(30,60,90,.14); }\n' +
'  .stage svg { width:100%; height:auto; display:block; }\n' +
'  .boot-slide { animation: boot-slide .45s cubic-bezier(.22,1.2,.36,1) backwards; }\n' +
'  .boot-fade { opacity:0; animation: boot-fade .5s ease-out both; }\n' +
'  .splash-eyes { transform-box: fill-box; transform-origin:center; animation: splash-blink .26s ease-in-out 1.9s, splash-blink .26s ease-in-out 2.08s; }\n' +
'  @keyframes boot-slide { from { transform: translate(var(--dx,0), var(--dy,0)); opacity:0; } to { transform: translate(0,0); opacity:1; } }\n' +
'  @keyframes boot-fade { to { opacity:1; } }\n' +
'  @keyframes splash-blink { 0%,40%,100% { transform: scaleY(1);} 50% { transform: scaleY(0.14);} }\n' +
'  .stage { animation: stage-exit .5s ease 2.5s forwards; }\n' +
'  @keyframes stage-exit { to { opacity:0; visibility:hidden; } }\n' +
'  .ui { position:fixed; left:50%; bottom:22px; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; z-index:5; }\n' +
'  button { font:inherit; font-size:14px; padding:9px 18px; border:1px solid #c5d2e0; border-radius:9px; background:#fff; cursor:pointer; box-shadow:0 4px 12px rgba(30,60,90,.08); }\n' +
'  button:hover { background:#f0f6fb; }\n' +
'  .hint { color:#5f728c; font-size:12px; }\n' +
'</style>\n</head>\n<body>\n' +
'  <div class="stage-wrap"><div class="stage" id="stage"></div></div>\n' +
'  <div class="ui"><button id="play">Reproducir de nuevo</button><span class="hint">Así se arma el logo al prender Fist (aprox. 2,5 s)</span></div>\n' +
'  <script>\nvar SVG = ' + JSON.stringify(svgMarkup) + ';\n' +
'var tpl = null;\n' +
'function render(){\n  var s = document.getElementById("stage");\n  s.innerHTML = SVG;\n  tpl = s.cloneNode(true);\n}\n' +
'render();\n' +
'document.getElementById("play").addEventListener("click", function(){\n  var s = document.getElementById("stage");\n  s.parentNode.replaceChild(tpl.cloneNode(true), s);\n  tpl = document.getElementById("stage").cloneNode(true);\n});\n' +
'</script>\n</body>\n</html>\n';

fs.writeFileSync('fist-boot-preview.html', html);
console.log('fist-boot-preview.html escrito:', html.length, 'bytes, svgMarkup:', svgMarkup.length, 'bytes');
