import { readFile, writeFile } from 'node:fs/promises'
import ts from 'typescript'

const data = await readFile('src/lib/brand-morph-data.json', 'utf8')
const source = await readFile('src/lib/brand-morph.ts', 'utf8')
const runtime = ts
  .transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  .outputText.replace(/^import data.*$/m, '')
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YourDreamAnchor — Logo formation</title><style>
*{box-sizing:border-box}body{margin:0;background:#0d0812;color:#f6eee2;font:15px/1.6 system-ui,sans-serif}main{max-width:850px;margin:0 auto;padding:clamp(24px,6vw,64px)}h1{font-size:21px;font-weight:500;letter-spacing:-.02em;margin:0 0 8px}p{color:#b8a9bf;margin:0;max-width:55ch}.stage{display:flex;align-items:center;min-height:310px;padding:50px 0;overflow:hidden}svg{width:100%;height:auto;color:white;overflow:visible}.controls{display:grid;gap:20px}label{font-size:13px;color:#b8a9bf;display:flex;justify-content:space-between}input{width:100%;accent-color:#e9b64e;cursor:pointer}.actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}button{font:inherit;font-size:13px;padding:12px 18px;min-height:44px;border:1px solid #44354f;border-radius:10px;color:inherit;background:#1d1427;cursor:pointer}button:first-child{color:#160e1a;background:#e9b64e;border-color:#e9b64e}button:active{transform:scale(.97)}a{color:#e9b64e;font-size:13px;text-underline-offset:5px;margin-left:auto}:focus-visible{outline:2px solid #e9b64e;outline-offset:4px}.hint{font-size:12px;margin-top:25px}@media(max-width:500px){.stage{min-height:220px}a{margin-left:0}}
</style></head><body><main><h1>YourDreamAnchor → the monogram</h1><p>The actual header animation, enlarged. The letters become fifteen pieces of your logo. Drag slowly to see it form.</p><div class="stage"><svg id="wordmark" viewBox="0 0 234 48" width="702" height="144" fill="currentColor" aria-label="YourDreamAnchor logo formation"></svg></div><div class="controls"><div><label for="progress"><span>Formation</span><output id="position">Wordmark · 0%</output></label><input id="progress" type="range" min="0" max="100" step="1" value="0"></div><div class="actions"><button id="play">Play formation</button><button id="reset">Reset</button><a href="http://localhost:3000/" target="_blank" rel="noopener">Open the website ↗</a></div></div><p class="hint">On the website, scrolling controls this same sequence. Scroll back up to reverse it.</p></main><script type="module">
const data = ${data};
${runtime}
const svg=document.querySelector('#wordmark');
const paths=wordmarkGlyphs.map(glyph=>{const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',glyph.sourceD);path.setAttribute('fill-rule','evenodd');svg.append(path);return path});
const input=document.querySelector('#progress');const output=document.querySelector('#position');const play=document.querySelector('#play');let frame=0;
function pose(value){input.value=String(value);morphWordmark(paths,value/100);output.textContent=(value===0?'Wordmark':value===100?'Monogram':'Forming')+' · '+Math.round(value)+'%'}
function stop(){cancelAnimationFrame(frame);frame=0;play.textContent='Play formation'}
input.addEventListener('input',()=>{stop();pose(Number(input.value))});
play.addEventListener('click',()=>{if(frame){stop();return}const start=performance.now();pose(0);play.textContent='Pause';function tick(now){const value=Math.min(100,(now-start)/2800*100);pose(value);if(value<100)frame=requestAnimationFrame(tick);else stop()}frame=requestAnimationFrame(tick)});
document.querySelector('#reset').addEventListener('click',()=>{stop();pose(0)});
</script></body></html>`
await writeFile('ui-demos/logo-motion.html', html)
