const $=s=>document.querySelector(s),V=$('#view');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FREE_LIMIT_MB=200; // yönetimden tanımlanır
let stream=null,sel=localStorage.getItem('cam')||CAMERAS[0].id,facing='environment',urls=[];

/* ---------- IndexedDB (özel yerel arşiv) ---------- */
const DB=(()=>{let d;const open=()=>d||(d=new Promise((ok,no)=>{const r=indexedDB.open('retrocam',1);
 r.onupgradeneeded=()=>{r.result.createObjectStore('photos',{keyPath:'id'});r.result.createObjectStore('albums',{keyPath:'id'})};
 r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
 const tx=async(s,m,f)=>{const db=await open();return new Promise((ok,no)=>{const t=db.transaction(s,m);const q=f(t.objectStore(s));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
 return{all:s=>tx(s,'readonly',o=>o.getAll()),put:(s,v)=>tx(s,'readwrite',o=>o.put(v)),del:(s,k)=>tx(s,'readwrite',o=>o.delete(k))}})();
const url=b=>{const u=URL.createObjectURL(b);urls.push(u);return u};
const cam=id=>CAMERAS.find(c=>c.id===id)||CAMERAS[0];
const fmt=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB';

/* ---------- Görüntü işleme (sabit profil) ---------- */
function process(src,c,flash){
 const p=c.p,sw=src.videoWidth||src.width,sh=src.videoHeight||src.height;
 let cw=sw,ch=sw/c.aspect;if(ch>sh){ch=sh;cw=sh*c.aspect}
 const W=Math.min(1200,Math.round(cw)),H=Math.round(W/c.aspect);
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
 x.drawImage(src,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,W,H);
 const im=x.getImageData(0,0,W,H),d=im.data,vg=p.vignette;
 for(let i=0,px=0;i<d.length;i+=4,px++){
  let r=d[i],g=d[i+1],b=d[i+2];
  const l=.3*r+.59*g+.11*b;r=l+(r-l)*p.sat;g=l+(g-l)*p.sat;b=l+(b-l)*p.sat;
  r=(r-128)*p.contrast+128;g=(g-128)*p.contrast+128;b=(b-128)*p.contrast+128;
  r=r*p.bright+p.warm;g=g*p.bright+p.warm*.4;b=b*p.bright-p.warm;
  if(flash){r+=10;g+=10;b+=10}
  if(p.fade){r=r*(1-p.fade)+p.fade*40;g=g*(1-p.fade)+p.fade*36;b=b*(1-p.fade)+p.fade*30}
  const n=(Math.random()-.5)*p.grain*2;r+=n;g+=n;b+=n;
  if(vg){const dx=(px%W)/W-.5,dy=Math.floor(px/W)/H-.5,k=1-vg*Math.min(1,(dx*dx+dy*dy)*3.2);r*=k;g*=k;b*=k}
  d[i]=r;d[i+1]=g;d[i+2]=b}
 x.putImageData(im,0,0);return cv}
function layout(frames,c){
 const f=frames[0],W=f.width,H=f.height;
 if(c.layout==='full'){return frames[0]}
 const o=document.createElement('canvas'),x=o.getContext('2d'),m=Math.round(W*.06);
 if(c.layout==='white'){o.width=W+m*2;o.height=H+m+Math.round(W*.2);x.fillStyle='#fbf8f1';x.fillRect(0,0,o.width,o.height);x.drawImage(f,m,m)}
 else{o.width=W+m*2;o.height=(H+m)*frames.length+m*2;x.fillStyle='#fbf8f1';x.fillRect(0,0,o.width,o.height);frames.forEach((fr,i)=>x.drawImage(fr,m,m+i*(H+m)))}
 return o}
const blob=(cv,q=.9)=>new Promise(r=>cv.toBlob(r,'image/jpeg',q));
function stop(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();const v=$('#vid');if(v)v.srcObject=null}});
addEventListener('pagehide',stop);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- Ekranlar ---------- */
const routes={
 '/':async()=>{const ph=(await DB.all('photos')).sort((a,b)=>b.at-a.at).slice(0,4);
  return`<h1>A moment from another time.</h1><p>Bir kamera seç, çek; kameranın sabit karakteri baskıya dönüşsün. Ayar yok, filtre yok — sadece o kameranın görünümü.</p>
  <div class="row"><a href="#/camera"><button class="pri">Hızlı çekim</button></a><a href="#/catalog"><button>Kamera kataloğu</button></a></div>
  <h2>Öne çıkan: ${esc(cam(sel).brand+' '+cam(sel).model)}</h2><p class="muted">${esc(cam(sel).category)} · ${cam(sel).era}</p>
  <h2>Son fotoğraflar</h2>${ph.length?`<div class="grid">${ph.map(p=>`<div class="ph"><img src="${url(p.thumb)}" alt=""></div>`).join('')}</div>`:'<p class="muted">Henüz fotoğraf yok.</p>'}`},
 '/catalog':()=>`<h1>Camera Catalog</h1><p class="muted">Tüm kameralar ücretsizdir.</p><div class="grid">${CAMERAS.map(c=>camCard(c)).join('')}</div>`,
 '/camera':()=>`<h1>Camera</h1><div class="grid" id="pick">${CAMERAS.map(c=>camCard(c)).join('')}</div>
  <div class="row"><button class="pri" id="start">Kamerayı aç</button><button id="flip" hidden>Ön/Arka</button><button id="torch" hidden>Fener</button></div>
  <p class="muted" id="msg">Kamera yalnızca sen izin verince açılır.</p>
  <div class="stage" id="stage" hidden><video id="vid" playsinline muted></video><div class="flash" id="fl"></div><div id="cnt"></div></div>
  <div class="row" style="justify-content:center"><button class="pri" id="shot" hidden>● Çek</button></div><div id="res"></div>`,
 '/album':async()=>{const [ph,al]=await Promise.all([DB.all('photos'),DB.all('albums')]);
  const q=new URLSearchParams(location.hash.split('?')[1]||''),a=q.get('a')||'',s=q.get('s')||'date';
  let list=ph.filter(p=>!a||(al.find(x=>x.id===a)?.ids||[]).includes(p.id));
  list.sort((x,y)=>s==='cam'?x.cam.localeCompare(y.cam)||y.at-x.at:y.at-x.at);
  return`<h1>My Album</h1><div class="row"><select id="fa"><option value="">Tüm fotoğraflar</option>${al.map(x=>`<option value="${x.id}" ${x.id===a?'selected':''}>${esc(x.title)}</option>`).join('')}</select>
  <select id="fs"><option value="date">Tarihe göre</option><option value="cam" ${s==='cam'?'selected':''}>Kameraya göre</option></select>
  <button id="na">+ Albüm</button>${a?'<button id="ra">Adı değiştir</button>':''}</div>
  ${list.length?`<div class="grid">${list.map(p=>`<button class="ph" data-id="${p.id}"><img src="${url(p.thumb)}" alt="${esc(p.cam)}"></button>`).join('')}</div>`:'<p class="muted">Bu görünümde fotoğraf yok.</p>'}`},
 '/archive':async()=>{const ph=await DB.all('photos');const used=ph.reduce((n,p)=>n+p.blob.size+p.thumb.size,0);
  let q='';try{const e=await navigator.storage.estimate();q=`<p class="muted">Tarayıcı kotası: ${fmt(e.usage)} / ${fmt(e.quota)}</p>`}catch{}
  const pct=Math.min(100,used/(FREE_LIMIT_MB*1048576)*100);
  return`<h1>My Archive</h1><div class="card"><b>${ph.length} fotoğraf</b> · ${fmt(used)} / ${FREE_LIMIT_MB} MB<div class="bar"><i style="width:${pct}%"></i></div>${q}</div>
  <p class="note">Fotoğraflar bu cihazda özel olarak saklanır. Bulut arşivi ve Extended Archive, FOREVYE/arka uç bağlantısı gerektirir.</p>
  <button id="exp">Tüm fotoğrafları indir</button>`},
 '/premium':async()=>{let body;
  if(!FOREVYE.configured)body=`<p class="note">FOREVYE merkezi servisi bağlı değil. Kristal bakiyesi ve premium yetkisi yerelde üretilmez; <code>js/forevye-adapter.js</code> içindeki <code>API_BASE</code> ayarlanınca paketler ve fiyatlar sunucudan okunur.</p>`;
  else try{const c=await FOREVYE.catalog();body=c.map(p=>`<div class="card"><h3>${p.duration_hours/24} Günlük Premium</h3><p>${p.duration_hours} saat · ${p.crystal_price} kristal</p><button class="pri buy" data-c="${esc(p.package_code)}">Kristalle etkinleştir</button></div>`).join('')}catch(e){body=`<p class="note">${esc(e.message)}</p>`}
  return`<h1>Premium</h1><p>3 günlük ve 7 günlük süreli erişim; yalnızca kristal ile, otomatik yenilenmez. Kamera modelleri ve temel çekim her zaman ücretsiz.</p>
  <div class="grid">${['Premium Albums','Extended Archive','Premium Collections','Photo Book'].map(f=>`<div class="card"><h3>${f}</h3></div>`).join('')}</div>
  <h2>Paketler</h2>${body}<p class="muted">Premium bitince fotoğraflar silinmez; sadece premium özellikler kapanır.</p>`},
 '/settings':()=>`<h1>Profile / Settings</h1><div class="card"><h3>FOREVYE hesabı</h3><p class="muted">İsteğe bağlı. Şifren bu uygulamaya girilmez; güvenli yetkilendirme sayfasına yönlendirilirsin.</p><button id="fv">FOREVYE'yi bağla</button></div>
  <div class="card" style="margin-top:12px"><h3>Gizlilik</h3><p class="muted">Fotoğraflar varsayılan olarak özeldir ve bu cihazda tutulur. Paylaşım bağlantıları sunucu (Faz 3) gerektirir; statik sürümde kapalıdır.</p></div>
  <div class="card" style="margin-top:12px"><h3>Veri</h3><button id="wipe">Tüm yerel verileri sil</button></div>`
};
function camCard(c){return`<button class="card cam ${c.id===sel?'sel':''}" data-cam="${c.id}"><div class="sw" style="background:${c.sw}"></div><h3>${esc(c.brand+' '+c.model)}</h3><small>${esc(c.category)} · ${c.era}</small></button>`}

/* ---------- Router ---------- */
async function render(){
 stop();urls.forEach(URL.revokeObjectURL);urls=[];
 const path=(location.hash.slice(1)||'/').split('?')[0],r=routes[path]||routes['/'];
 document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+path));
 V.innerHTML=await r();bind(path);}
addEventListener('hashchange',render);render();

function bind(path){
 document.querySelectorAll('[data-cam]').forEach(b=>b.onclick=()=>{sel=b.dataset.cam;localStorage.setItem('cam',sel);
  document.querySelectorAll('[data-cam]').forEach(x=>x.classList.toggle('sel',x===b));if(path==='/catalog')location.hash='#/camera'});
 if(path==='/camera')bindCamera();
 if(path==='/album'){const go=()=>location.hash=`#/album?a=${$('#fa').value}&s=${$('#fs').value}`;$('#fa').onchange=go;$('#fs').onchange=go;
  $('#na').onclick=async()=>{const t=prompt('Albüm adı');if(t)await DB.put('albums',{id:crypto.randomUUID(),title:t,ids:[],cover:null});render()};
  const ra=$('#ra');if(ra)ra.onclick=async()=>{const al=(await DB.all('albums')).find(x=>x.id===$('#fa').value),t=prompt('Yeni ad',al.title);if(t){al.title=t;await DB.put('albums',al);render()}};
  document.querySelectorAll('.ph[data-id]').forEach(b=>b.onclick=()=>openPhoto(b.dataset.id))}
 if(path==='/archive')$('#exp').onclick=async()=>{for(const p of await DB.all('photos')){dl(p.blob,`retro-${p.cam}-${p.at}.jpg`);await sleep(250)}};
 if(path==='/premium')document.querySelectorAll('.buy').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await FOREVYE.purchase(b.dataset.c);alert('Premium etkinleştirildi.')}catch(e){alert(e.message)}b.disabled=false});
 if(path==='/settings'){$('#fv').onclick=()=>{try{FOREVYE.connect()}catch(e){alert(e.message)}};
  $('#wipe').onclick=async()=>{if(confirm('Tüm fotoğraflar ve albümler silinecek. Emin misin?')){indexedDB.deleteDatabase('retrocam');setTimeout(render,300)}}}}

function bindCamera(){
 const msg=$('#msg'),vid=$('#vid');
 async function open(){stop();try{
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1280}},audio:false});
  vid.srcObject=stream;await vid.play();$('#stage').hidden=false;$('#shot').hidden=false;$('#flip').hidden=false;$('#start').hidden=true;msg.textContent='';
  const caps=stream.getVideoTracks()[0].getCapabilities?.()||{};$('#torch').hidden=!caps.torch;
 }catch(e){msg.innerHTML='Kamera izni verilmedi veya kamera bulunamadı. Çekim için tarayıcı ayarlarından izin ver; izin atlatılmaz.'}}
 $('#start').onclick=open;$('#flip').onclick=()=>{facing=facing==='user'?'environment':'user';open()};
 let on=false;$('#torch').onclick=async()=>{on=!on;try{await stream.getVideoTracks()[0].applyConstraints({advanced:[{torch:on}]})}catch{}};
 $('#shot').onclick=async()=>{const c=cam(sel),n=c.frames||1,fr=[],btn=$('#shot');btn.disabled=true;
  for(let i=0;i<n;i++){if(n>1)for(let k=3;k>0;k--){$('#cnt').innerHTML=`<div class="count">${k}</div>`;await sleep(700)}$('#cnt').innerHTML='';
   const f=$('#fl');f.classList.add('on');await sleep(60);fr.push(process(vid,c,c.flash));f.classList.remove('on');await sleep(300)}
  const out=layout(fr,c);stop();vid.srcObject=null;$('#stage').hidden=true;btn.hidden=true;$('#flip').hidden=true;$('#torch').hidden=true;$('#start').hidden=false;btn.disabled=false;
  const b=await blob(out),th=document.createElement('canvas');th.width=320;th.height=Math.round(320*out.height/out.width);th.getContext('2d').drawImage(out,0,0,th.width,th.height);
  const tb=await blob(th,.8);
  $('#res').innerHTML=`<div class="ph print" style="max-width:340px;margin:16px auto"><img src="${url(b)}" alt="Baskı"></div><div class="row" style="justify-content:center"><button class="pri" id="sv">Kaydet</button><button id="dlb">İndir</button><button id="rt">Yeniden çek</button></div>`;
  $('#sv').onclick=async()=>{await DB.put('photos',{id:crypto.randomUUID(),cam:c.id,ver:c.version,at:Date.now(),blob:b,thumb:tb});$('#sv').disabled=true;$('#sv').textContent='Kaydedildi ✓'};
  $('#dlb').onclick=()=>dl(b,`retro-${c.id}.jpg`);$('#rt').onclick=()=>{$('#res').innerHTML='';open()}}}

const dl=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)};
async function openPhoto(id){
 const p=(await DB.all('photos')).find(x=>x.id===id),al=await DB.all('albums'),m=$('#modal'),c=cam(p.cam);
 m.hidden=false;m.innerHTML=`<div class="box"><img src="${url(p.blob)}" alt=""><p class="muted">${esc(c.brand+' '+c.model)} · profil v${p.ver} · ${new Date(p.at).toLocaleString('tr-TR')}</p>
 <div class="row"><button id="d">İndir</button><button id="x">Sil</button><select id="ad"><option value="">Albüme ekle…</option>${al.map(a=>`<option value="${a.id}">${esc(a.title)}</option>`).join('')}</select>
 <button disabled title="Paylaşım bağlantısı için sunucu gerekir (Faz 3)">Paylaş</button><button id="c">Kapat</button></div></div>`;
 const close=()=>{m.hidden=true;m.innerHTML=''};$('#c').onclick=close;m.onclick=e=>{if(e.target===m)close()};
 $('#d').onclick=()=>dl(p.blob,`retro-${p.cam}-${p.at}.jpg`);
 $('#x').onclick=async()=>{if(!confirm('Fotoğraf silinsin mi?'))return;await DB.del('photos',id);for(const a of al){if(a.ids.includes(id)){a.ids=a.ids.filter(i=>i!==id);await DB.put('albums',a)}}close();render()};
 $('#ad').onchange=async e=>{const a=al.find(x=>x.id===e.target.value);if(a&&!a.ids.includes(id)){a.ids.push(id);a.cover=a.cover||id;await DB.put('albums',a)}e.target.value=''}}
