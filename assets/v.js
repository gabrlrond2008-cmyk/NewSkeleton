const fs = require('fs');
const svg = fs.readFileSync('fist-logo.svg','utf8');
const paths = [...svg.matchAll(/<path d="([^"]*)" fill="([^"]*)" transform="translate\(([^)]*)\)"/g)];
const exp=[['#F2F6F8','0,0'],['#FCFDFD','616,215'],['#F9FCFD','703.1875,166.5625'],['#274A79','616,215'],['#274A79','665,307'],['#264A79','751,307'],['#254978','721,285'],['#2A4B79','618,239'],['#2A4B77','789.75,239.3125'],['#324F75','773,228'],['#395578','751,307']];
let ok = paths.length===exp.length;
if(!ok) console.log('count',paths.length);
paths.forEach((m,i)=>{ if(m[2]!==exp[i][0]||m[3]!==exp[i][1]){ok=false;console.log('mismatch',i,m[2],m[3]);} });
console.log(ok?'11 paths OK (circulo removido, orden intacto)':'FAIL');
