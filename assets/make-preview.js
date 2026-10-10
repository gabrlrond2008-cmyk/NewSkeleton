const fs = require('fs');
const svg = fs.readFileSync('fist-logo.svg', 'utf8');
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Fist - logo preview / animacion</title>
<style>
  body { margin:0; font-family:system-ui,sans-serif; background:#eef2f5; display:flex; flex-wrap:wrap; gap:28px; padding:32px; }
  .scene { background:#fff; border-radius:18px; box-shadow:0 10px 30px rgba(30,60,90,.12); padding:26px; min-width:320px; }
  .scene svg { width:260px; height:auto; display:block; margin:0 auto; }
  h2 { font-size:15px; color:#1f3a5c; margin:0 0 12px; }
  .panel { max-width:420px; }
  .group { margin:0 0 10px; }
  .group label { font-weight:600; color:#254979; }
  .grp-desc { color:#60738d; font-size:12px; margin:2px 0 10px; }
  button, input { font: inherit; padding:8px 12px; border:1px solid #c5d2e0; border-radius:8px; background:#fff; cursor:pointer; }
  button:hover { background:#f0f6fb; }
  #colorPick { width:40px; height:34px; padding:2px; }
</style>
</head>
<body>
  <div class="scene">
    <h2>&#128049; Fist con animaciones activas</h2>
    SVG_GOES_HERE
  </div>
  <div class="panel">
    <h2>Controles (editar / animar por capa)</h2>
    <div class="group">
      <label><input type="checkbox" id="blink" checked> Parpadeo de ojos</label>
      <div class="grp-desc">Efecto sobre los grupos #eye-l y #eye-r (los simbolos <code>&lt;/&gt;</code>)</div>
    </div>
    <div class="group">
      <label><input type="checkbox" id="twitch" checked> Orejas que se mueven</label>
      <div class="grp-desc">Grupos #ear-detail-l y #ear-detail-r (las orejas)</div>
    </div>
    <div class="group">
      <label for="colorPick">Recolor (color azul navy)</label>
      <div class="grp-desc">Cambia el color de todas las partes azules del logo</div>
      <input type="color" id="colorPick" value="#254979">
    </div>
    <div class="group">
      <label>Capas</label>
      <div class="grp-desc">
        background (fondo), face (cara clara), face-mark (marca azul en la cara),<br>
        eye-l/eye-r (<code>&lt;/&gt;</code>), snout (hocico), ear-detail-l/r (orejas), accent-l.
      </div>
    </div>
  </div>
  <script>
    var eyeL = document.getElementById('eye-l');
    var eyeR = document.getElementById('eye-r');
    var earL = document.getElementById('ear-detail-l');
    var earR = document.getElementById('ear-detail-r');
    function sync(){
      eyeL.classList.toggle('anim-blink', document.getElementById('blink').checked);
      eyeR.classList.toggle('anim-blink', document.getElementById('blink').checked);
      earL.classList.toggle('anim-twitch', document.getElementById('twitch').checked);
      earR.classList.toggle('anim-twitch', document.getElementById('twitch').checked);
    }
    document.getElementById('blink').addEventListener('change', sync);
    document.getElementById('twitch').addEventListener('change', sync);
    document.getElementById('colorPick').addEventListener('input', function(){
      var c = this.value;
      document.querySelectorAll('svg [fill]').forEach(function(p){
        var f = p.getAttribute('fill');
        if (f && f.length === 7 && f[0] === '#') p.setAttribute('fill', c);
      });
    });
    sync();
  </script>
</body>
</html>`;
fs.writeFileSync('fist-logo-preview.html', html.replace('SVG_GOES_HERE', svg));
console.log('preview regenerado:', fs.statSync('fist-logo-preview.html').size, 'bytes');
