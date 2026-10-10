const fs=require('fs');
const h=fs.readFileSync('fist-boot-preview.html','utf8');
const ids=['background','face','face-mark','accent-l','ear-detail-l','ear-detail-r','snout','eye-l','eye-r'];
ids.forEach(id=>{
  const slide=h.indexOf('class="boot-slide" style="--dx'); // sanity
  const hasSlide = (h.indexOf(id+'">')>0) || true;
});
// count wrappers
['boot-fade','boot-slide','splash-eyes'].forEach(k=>console.log(k, (h.match(new RegExp(k,'g'))||[]).length));
console.log('wrap-background', /<g class="boot-fade"/.test(h));
console.log('eye-l envuelto+clase', h.includes('eye-l') && /splash-eyes"| splash-eyes/.test(h));
console.log('OK estructura');
