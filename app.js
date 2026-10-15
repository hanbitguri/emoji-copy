(()=>{
const $=s=>document.querySelector(s);
const GROUPS=[[0,'😊','표정'],[1,'👋','사람'],[3,'🐻','동물·자연'],[4,'🍓','음식'],[5,'✈️','여행'],[6,'⚽','활동'],[7,'💡','사물'],[8,'💟','기호'],[9,'🏳️','깃발']];
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('emo-'+k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem('emo-'+k,JSON.stringify(v))}catch{}}};
let DATA=[],BYBASE=new Map(),tone=LS.get('tone',0),favs=LS.get('favs',[]),recent=LS.get('recent',[]),basketMode=false,basket=[];
const strip=s=>s.replace(/\uFE0F/g,'');
const withTone=d=>tone&&d[4]?d[4][tone-1]:d[0];
const cell=(d,ch)=>{const b=document.createElement('button');b.className='e'+(favs.includes(strip(d[0]))?' fav':'');b.textContent=ch||withTone(d);b.dataset.base=strip(d[0]);b.title=d[1];b.setAttribute('aria-label',d[1]);return b};
function fill(grid,list,useStored){const f=document.createDocumentFragment();for(const x of list){if(useStored){const d=BYBASE.get(x.b);if(d)f.append(cell(d,x.c))}else f.append(cell(x))}grid.replaceChildren(f)}
// ---------- lazy group rendering
const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){const g=e.target;io.unobserve(g);renderGroup(g)}},{rootMargin:'600px 0px'});
function renderGroup(sec){const grid=sec.querySelector('.grid');fill(grid,DATA.filter(d=>d[3]==sec.dataset.g));grid.classList.add('in');sec.classList.remove('lazy');sec.dataset.done=1}
function buildGroups(){const root=$('#groups'),nav=$('#cats');
  for(const[g,ic,name]of GROUPS){const n=DATA.filter(d=>d[3]==g).length;
    const s=document.createElement('section');s.className='sec lazy';s.id='g'+g;s.dataset.g=g;s.style.setProperty('--h',Math.ceil(n/7)*52+'px');
    s.innerHTML=`<h2>${ic} ${name}</h2><div class="grid"></div>`;root.append(s);io.observe(s);
    const c=document.createElement('button');c.className='cat';c.dataset.g=g;c.innerHTML=`<b>${ic}</b>${name}`;
    c.onclick=()=>{if(q.value){q.value='';search()}if(!s.dataset.done)renderGroup(s);s.scrollIntoView({behavior:'smooth'})};nav.append(c)}
}
// ---------- scrollspy
let spyT;addEventListener('scroll',()=>{cancelAnimationFrame(spyT);spyT=requestAnimationFrame(spy)},{passive:true});
function spy(){const top=$('.top').offsetHeight+8;let cur=null;for(const s of document.querySelectorAll('#groups .sec'))if(s.getBoundingClientRect().top<=top+40)cur=s.dataset.g;
  document.querySelectorAll('.cat').forEach(c=>{const on=c.dataset.g===cur;if(on&&!c.classList.contains('on'))c.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});c.classList.toggle('on',on)})}
function setTopH(){document.documentElement.style.setProperty('--topH',$('.top').offsetHeight+'px')}
// ---------- copy
async function copy(text){
  try{if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(text);return true}}catch{}
  // iOS Safari fallback: contenteditable + selection range + execCommand
  const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.contentEditable=true;
  Object.assign(t.style,{position:'fixed',top:'0',left:'0',opacity:'0',fontSize:'16px'});document.body.append(t);
  const r=document.createRange();r.selectNodeContents(t);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);t.setSelectionRange(0,text.length);
  let ok=false;try{ok=document.execCommand('copy')}catch{}t.remove();sel.removeAllRanges();return ok}
let toastT;function toast(html){const el=$('#toast');el.innerHTML=html;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),1400)}
function burst(x,y,ch){const h=document.createElement('span');h.className='fly';h.textContent=ch;h.style.left=x-12+'px';h.style.top=y-24+'px';h.style.fontSize='28px';$('#hearts').append(h);setTimeout(()=>h.remove(),1200)}
async function use(btn,ev){const ch=btn.textContent;btn.classList.remove('pop');void btn.offsetWidth;btn.classList.add('pop');
  if(basketMode){basket.push(ch);renderBasket(true);return}
  const ok=await copy(ch);toast(ok?`<span class="te">${ch}</span>복사됨`:'복사에 실패했어요 😢');
  if(ok){if(ev)burst(ev.clientX,ev.clientY,ch);addRecent(btn.dataset.base,ch)}}
function addRecent(b,c){recent=[{b,c},...recent.filter(x=>x.b!==b)].slice(0,24);LS.set('recent',recent);renderTop()}
function toggleFav(btn){const b=btn.dataset.base,i=favs.indexOf(b);if(i<0){favs.unshift(b);toast('💟 즐겨찾기에 추가')}else{favs.splice(i,1);toast('즐겨찾기에서 뺐어요')}
  LS.set('favs',favs);document.querySelectorAll(`.e[data-base="${CSS.escape(b)}"]`).forEach(e=>e.classList.toggle('fav',i<0));renderTop();navigator.vibrate?.(10)}
function renderTop(){const fl=favs.map(b=>({b,c:null}));fill($('#favGrid'),fl.map(x=>({b:x.b,c:BYBASE.get(x.b)?withTone(BYBASE.get(x.b)):''})),true);$('#favSec').hidden=!favs.length;
  fill($('#recGrid'),recent,true);$('#recSec').hidden=!recent.length}
// ---------- pointer: tap = copy, long-press = favorite
let lp,lpFired=false,startXY;
$('#main').addEventListener('pointerdown',e=>{const b=e.target.closest('.e');if(!b)return;lpFired=false;startXY=[e.clientX,e.clientY];clearTimeout(lp);lp=setTimeout(()=>{lpFired=true;toggleFav(b)},480)});
addEventListener('pointermove',e=>{if(startXY&&Math.hypot(e.clientX-startXY[0],e.clientY-startXY[1])>8)clearTimeout(lp)},{passive:true});
['pointerup','pointercancel','scroll'].forEach(t=>addEventListener(t,()=>clearTimeout(lp),{passive:true}));
$('#main').addEventListener('click',e=>{const b=e.target.closest('.e');if(!b)return;if(lpFired){lpFired=false;return}use(b,e)});
$('#main').addEventListener('contextmenu',e=>{if(e.target.closest('.e'))e.preventDefault()});
// ---------- search
const q=$('#q');let sT;
function norm(s){return s.toLowerCase().replace(/\s+/g,'')}
function search(){const v=norm(q.value);$('.search').classList.toggle('has',!!q.value);
  const on=!!v;$('#searchSec').hidden=!on;$('#groups').hidden=on;$('#favSec').hidden=on||!favs.length;$('#recSec').hidden=on||!recent.length;
  if(!on)return;const terms=q.value.toLowerCase().split(/\s+/).filter(Boolean).map(norm);
  const res=DATA.map(d=>{const l=norm(d[1]),tags=d[2].toLowerCase().split(' ');let sc=0;
    for(const t of terms){let s=0;if(l===t||tags.includes(t))s=3;else if(l.startsWith(t)||tags.some(x=>x.startsWith(t)))s=2;else if(l.includes(t)||d[2].toLowerCase().replace(/\s/g,'').includes(t)||d[0].includes(q.value.trim()))s=1;if(!s)return null;sc+=s}return[sc,d]}).filter(Boolean).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
  fill($('#searchGrid'),res);$('#searchTitle').textContent=`🔎 '${q.value.trim()}' ${res.length}개`;$('#empty').hidden=!!res.length;scrollTo({top:0})}
q.addEventListener('input',()=>{clearTimeout(sT);sT=setTimeout(search,120)});
$('#clearQ').onclick=()=>{q.value='';search();q.focus()};
$('#clearRec').onclick=()=>{recent=[];LS.set('recent',recent);renderTop()};
// ---------- skin tone
const TONES=['✋','✋🏻','✋🏼','✋🏽','✋🏾','✋🏿'];
function buildTones(){const w=$('#tones');TONES.forEach((t,i)=>{const b=document.createElement('button');b.textContent=t;b.setAttribute('aria-label',i?`피부색 ${i}`:'기본');b.onclick=()=>{tone=i;LS.set('tone',i);paintTones();retone()};w.append(b)});paintTones()}
function paintTones(){$('#toneBtn').textContent=TONES[tone];document.querySelectorAll('#tones button').forEach((b,i)=>b.classList.toggle('on',i===tone))}
$('#toneBtn').onclick=()=>{$('#tones').classList.toggle('show');setTimeout(setTopH,450)};
function retone(){document.querySelectorAll('#groups .grid .e,#searchGrid .e').forEach(e=>{const d=BYBASE.get(e.dataset.base);if(d&&d[4])e.textContent=withTone(d)});renderTop()}
// ---------- basket
function renderBasket(anim){const s=$('#basketStr');s.replaceChildren(...basket.map((c,i)=>{const x=document.createElement('span');x.textContent=c;if(!(anim&&i===basket.length-1))x.style.animation='none';return x}));s.scrollLeft=s.scrollWidth}
$('#basketBtn').onclick=()=>{basketMode=!basketMode;$('#basketBtn').setAttribute('aria-pressed',basketMode);$('#basket').classList.toggle('show',basketMode);if(basketMode)toast('🧺 탭한 이모지를 모아서 한 번에 복사해요')};
$('#bBack').onclick=()=>{basket.pop();renderBasket()};
$('#bClear').onclick=()=>{basket=[];renderBasket()};
$('#bCopy').onclick=async()=>{if(!basket.length)return toast('먼저 이모지를 담아주세요');const s=basket.join('');const ok=await copy(s);toast(ok?`<span class="te">${s.length>12?[...basket].slice(0,4).join('')+'…':s}</span>복사됨`:'복사에 실패했어요 😢')};
// ---------- boot
fetch('emoji-ko.json?v=1').then(r=>r.json()).then(d=>{DATA=d;for(const x of d)BYBASE.set(strip(x[0]),x);buildGroups();buildTones();renderTop();search();setTopH();spy()});
addEventListener('resize',setTopH);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').then(r=>r.update()).catch(()=>{}));
let reloaded=false;navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(reloaded||!window.__hadSW)return;reloaded=true;location.reload()});window.__hadSW=!!navigator.serviceWorker?.controller;
})();
