const $=s=>document.querySelector(s),V=$('#view');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get:(k,d)=>{try{return localStorage.getItem(k)??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}},del:k=>{try{localStorage.removeItem(k)}catch{}}};
const LIM={free:{mb:200,albums:3},prem:{mb:2048}}; // yönetimden tanımlanır
const FRAMES=[{id:'classic',name:'Klasik',free:true},{id:'film',name:'Film şeridi'},{id:'noir',name:'Siyah pasparto'},{id:'stamp',name:'Tarih damgası'}];
let stream=null,sel=LS.get('cam',CAMERAS[0].id),facing='environment',urls=[],frame=LS.get('frame','classic'),timer=+LS.get('timer',0),snd=LS.get('snd','1')==='1',inst=null,rid=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const url=b=>{const u=URL.createObjectURL(b);urls.push(u);return u};
const cam=id=>CAMERAS.find(c=>c.id===id)||CAMERAS[0];
const fmt=n=>n>=1073741824?(n/1073741824).toFixed(2)+' GB':n>1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB';
const specs=c=>[c.flash?'Flaşlı':'Flaşsız',c.frames?c.frames+' kare şerit':({full:'Tam kare',white:'Beyaz çerçeve',strip:'Şerit'})[c.layout]].join(' · ');

/* ---------- Bildirim ve diyalog ---------- */
let tt;function toast(m,h){const t=$('#toast');t.textContent=m;t.className='show';t.onclick=h?()=>{location.hash=h;t.className=''}:null;clearTimeout(tt);tt=setTimeout(()=>t.className='',4200)}
const ask=(t,v='')=>new Promise(ok=>{const d=$('#dlg');d.innerHTML=`<form method="dialog"><h3>${esc(t)}</h3><input id="dv" value="${esc(v)}" maxlength="40" autofocus><div class="row"><button class="pri" value="ok">Tamam</button><button value="no" formnovalidate>Vazgeç</button></div></form>`;d.onclose=()=>ok(d.returnValue==='ok'?$('#dv').value.trim():null);d.showModal()});
const needPrem=f=>toast(f+' Premium özelliğidir — dokun ve incele.','#/premium');

/* ---------- Premium durumu (yalnızca FOREVYE sunucusu; API yokken yalnızca gizli önizleme) ---------- */
const P={on:false,exp:null,err:'',demo:LS.get('demo','0')==='1',ready:null,
 async load(){this.on=false;this.exp=null;this.err='';
  if(FOREVYE.configured){try{const s=await FOREVYE.status();this.on=!!(s.active??s.premium_active??s.is_premium);this.exp=s.expires_at||s.expires||null}catch(e){this.err=e.message}}
  else this.on=this.demo;
  const b=$('#pb');b.textContent=this.on?'★ Premium':'Ücretsiz';b.className='pb'+(this.on?' on':'');return this.on},
 get mb(){return this.on?LIM.prem.mb:LIM.free.mb}};

/* ---------- IndexedDB (özel yerel arşiv) — v2: blob'lar ayrı depoda, v1 verisi otomatik taşınır ---------- */
const DB=(()=>{let d;const open=()=>d||(d=new Promise((ok,no)=>{const r=indexedDB.open('retrocam',2);
 r.onupgradeneeded=e=>{const db=r.result,t=r.transaction;
  if(e.oldVersion<1){db.createObjectStore('photos',{keyPath:'id'});db.createObjectStore('albums',{keyPath:'id'})}
  if(e.oldVersion<2){db.createObjectStore('blobs',{keyPath:'id'});const bs=t.objectStore('blobs');
   t.objectStore('photos').openCursor().onsuccess=ev=>{const c=ev.target.result;if(c){const v=c.value;if(v.blob){bs.put({id:v.id,blob:v.blob});v.size=v.blob.size;delete v.blob;c.update(v)}c.continue()}}}};
 r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}));
 const run=async(st,m,f)=>{const db=await open();return new Promise((ok,no)=>{const t=db.transaction(st,m);let q;try{q=f(...[].concat(st).map(s=>t.objectStore(s)))}catch(e){return no(e)}
  t.oncomplete=()=>ok(q&&q.result);t.onerror=t.onabort=()=>no(t.error||new Error('Depolama hatası'))})};
 return{all:s=>run(s,'readonly',o=>o.getAll()),get:(s,k)=>run(s,'readonly',o=>o.get(k)),put:(s,v)=>run(s,'readwrite',o=>o.put(v)),del:(s,k)=>run(s,'readwrite',o=>o.delete(k)),
  addPhoto:(m,b)=>run(['photos','blobs'],'readwrite',(p,x)=>{p.put(m);x.put({id:m.id,blob:b})}),
  rmPhoto:id=>run(['photos','blobs'],'readwrite',(p,x)=>{p.delete(id);x.delete(id)}),
  async wipe(){if(d){(await d).close();d=null}await new Promise(ok=>{const r=indexedDB.deleteDatabase('retrocam');r.onsuccess=r.onerror=r.onblocked=ok})}}})();
const usage=async()=>(await DB.all('photos')).reduce((n,p)=>n+(p.size||0)+(p.thumb?.size||0),0);

/* ---------- Görüntü işleme (sabit profil) ---------- */
function process(src,c,flash,mirror){
 const p=c.p,sw=src.videoWidth||src.width,sh=src.videoHeight||src.height;
 let cw=sw,ch=sw/c.aspect;if(ch>sh){ch=sh;cw=sh*c.aspect}
 const W=Math.min(1200,Math.round(cw)),H=Math.round(W/c.aspect);
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d',{willReadFrequently:true});
 if(mirror){x.translate(W,0);x.scale(-1,1)}
 x.drawImage(src,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,W,H);x.setTransform(1,0,0,1,0,0);
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
 if(c.layout==='full')return f;
 const o=document.createElement('canvas'),x=o.getContext('2d'),m=Math.round(W*.06);
 if(c.layout==='white'){o.width=W+m*2;o.height=H+m+Math.round(W*.2);x.fillStyle='#fbf8f1';x.fillRect(0,0,o.width,o.height);x.drawImage(f,m,m)}
 else{o.width=W+m*2;o.height=(H+m)*frames.length+m*2;x.fillStyle='#fbf8f1';x.fillRect(0,0,o.width,o.height);frames.forEach((fr,i)=>x.drawImage(fr,m,m+i*(H+m)))}
 return o}
/* Premium "Collections": baskı çerçeveleri (kamera karakterine dokunmaz, yalnızca baskıyı süsler) */
function decorate(cv,f,t){
 const W=cv.width,H=cv.height,mk=(w,h)=>{const o=document.createElement('canvas');o.width=w;o.height=h;return[o,o.getContext('2d')]};
 if(f==='stamp'){const x=cv.getContext('2d'),d=new Date(t);x.font=`bold ${Math.round(W*.045)}px monospace`;x.textAlign='right';x.fillStyle='#ff9a2e';x.shadowColor='rgba(255,120,0,.7)';x.shadowBlur=W*.01;
  x.fillText(`'${String(d.getFullYear()).slice(2)} ${d.getMonth()+1} ${d.getDate()}`,W-W*.05,H-W*.045);return cv}
 if(f==='film'){const m=Math.round(W*.09),[o,x]=mk(W+m*2,H);x.fillStyle='#16110d';x.fillRect(0,0,o.width,H);x.drawImage(cv,m,0);x.fillStyle='#f4ecdc';
  const h=m*.4,g=h*2.2;for(let y=g/2;y<H;y+=g)[m*.3,o.width-m*.3-h*.8].forEach(px=>{x.beginPath();x.rect(px,y,h*.8,h);x.fill()});return o}
 if(f==='noir'){const m=Math.round(W*.08),[o,x]=mk(W+m*2,H+m*2);x.fillStyle='#0d0a08';x.fillRect(0,0,o.width,o.height);x.drawImage(cv,m,m);
  x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=2;x.strokeRect(m-6,m-6,W+12,H+12);return o}
 return cv}
const blob=(cv,q=.9)=>new Promise(r=>cv.toBlob(r,'image/jpeg',q));
function stop(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream){stop();if(location.hash.startsWith('#/camera'))render()}});
addEventListener('pagehide',stop);
let ac;const click=()=>{try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=900;g.gain.setValueAtTime(.07,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.06);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.07)}catch{}};
const dl=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),6000)};
async function share(b,n){const f=new File([b],n,{type:b.type||'image/jpeg'});
 if(navigator.canShare?.({files:[f]})){try{await navigator.share({files:[f],title:'RETRO CAMERA'})}catch{}}else{dl(b,n);toast('Bu cihaz doğrudan paylaşımı desteklemiyor; dosya indirildi.')}}

/* ---------- Ekranlar ---------- */
const ICON=`<svg class="hero-ic" viewBox="0 0 120 100" aria-hidden="true"><rect x="6" y="22" width="108" height="68" rx="12" fill="var(--brown)"/><rect x="6" y="48" width="108" height="42" rx="0" fill="var(--copper)" opacity=".35"/><rect x="22" y="12" width="26" height="14" rx="4" fill="var(--brown)"/><circle cx="60" cy="56" r="25" fill="var(--bg)"/><circle cx="60" cy="56" r="18" fill="#2a211a"/><circle cx="53" cy="49" r="5" fill="#fff" opacity=".5"/><circle cx="98" cy="36" r="5" fill="var(--bg)"/></svg>`;
const grid=(l)=>`<div class="grid">${l.map(p=>`<button class="ph${p.fav?' f':''}" data-id="${p.id}"><img src="${url(p.thumb)}" alt="${esc(cam(p.cam).model)}"></button>`).join('')}</div>`;
function camCard(c){return`<button class="card cam ${c.id===sel?'sel':''}" data-cam="${c.id}"><div class="sw" style="background:${c.sw}"></div><h3>${esc(c.brand+' '+c.model)}</h3><small>${esc(c.category)} · ${c.era}</small><small class="sp">${specs(c)}</small></button>`}
const routes={
 '/':async()=>{const ph=(await DB.all('photos')).sort((a,b)=>b.at-a.at),c=cam(sel);
  return`<section class="hero"><div><h1>A moment from another time.</h1><p>Bir kamera seç, çek; kameranın sabit karakteri baskıya dönüşsün. Ayar yok, filtre yok — sadece o kameranın görünümü.</p>
  <div class="row"><a href="#/camera"><button class="pri">Hızlı çekim</button></a><a href="#/catalog"><button>Kamera kataloğu</button></a></div></div>${ICON}</section>
  <h2>Öne çıkan: ${esc(c.brand+' '+c.model)}</h2><p class="muted">${esc(c.category)} · ${c.era} · ${specs(c)}</p>
  <h2>Son fotoğraflar</h2>${ph.length?grid(ph.slice(0,8)):'<p class="muted">Henüz fotoğraf yok. İlk karenizi çekin.</p>'}
  ${P.on?'':'<div class="note promo">★ <b>Premium</b> ile 2 GB arşiv, sınırsız albüm, kolleksiyon çerçeveleri ve PDF fotokitap. <a href="#/premium">İncele</a></div>'}`},
 '/catalog':()=>`<h1>Camera Catalog</h1><p class="muted">Tüm kameralar ücretsizdir.</p><div class="grid">${CAMERAS.map(camCard).join('')}</div>`,
 '/camera':()=>`<h1>Camera</h1><div class="grid" id="pick">${CAMERAS.map(camCard).join('')}</div>
  <div class="row"><label class="muted">Zamanlayıcı <select id="tm">${[0,3,10].map(s=>`<option value="${s}" ${s===timer?'selected':''}>${s?s+' sn':'Kapalı'}</option>`).join('')}</select></label></div>
  <div class="row chips" id="frs"><span class="muted">Çerçeve:</span>${FRAMES.map(f=>`<button class="chip ${f.id===frame&&(f.free||P.on)?'on':''}" data-fr="${f.id}">${f.name}${f.free||P.on?'':' 🔒'}</button>`).join('')}</div>
  <div class="row"><button class="pri" id="start">Kamerayı aç</button><button id="flip" hidden>Ön/Arka</button><button id="torch" hidden>Fener</button></div>
  <p class="muted" id="msg">Kamera yalnızca sen izin verince açılır.</p>
  <div class="stage" id="stage" hidden><video id="vid" playsinline muted></video><div class="flash" id="fl"></div><div id="cnt"></div></div>
  <div class="row" style="justify-content:center"><button class="pri" id="shot" hidden>● Çek</button></div><div id="res"></div>`,
 '/album':async()=>{const [ph,al]=await Promise.all([DB.all('photos'),DB.all('albums')]);
  const q=new URLSearchParams(location.hash.split('?')[1]||''),a=q.get('a')||'',s=q.get('s')||'date',f=q.get('f')==='1',A=al.find(x=>x.id===a);
  const list=ph.filter(p=>(!a||(A?.ids||[]).includes(p.id))&&(!f||p.fav)).sort((x,y)=>s==='cam'?x.cam.localeCompare(y.cam)||y.at-x.at:y.at-x.at);
  const cards=!a&&al.length?`<div class="grid albums">${al.map(x=>{const cv=ph.find(p=>p.id===(x.cover||x.ids[0]));return`<a class="card cam" href="#/album?a=${x.id}">${cv?`<img class="cov" src="${url(cv.thumb)}" alt="">`:'<div class="sw"></div>'}<h3>${esc(x.title)}</h3><small>${x.ids.length} fotoğraf</small></a>`}).join('')}</div>`:'';
  return`<h1>${A?esc(A.title):'My Album'}</h1><div class="row"><select id="fa"><option value="">Tüm fotoğraflar</option>${al.map(x=>`<option value="${x.id}" ${x.id===a?'selected':''}>${esc(x.title)}</option>`).join('')}</select>
  <select id="fs"><option value="date">Tarihe göre</option><option value="cam" ${s==='cam'?'selected':''}>Kameraya göre</option></select>
  <label class="chip ${f?'on':''}"><input type="checkbox" id="ff" ${f?'checked':''} hidden>♥ Favoriler</label>
  <button id="na">+ Albüm (${al.length}/${P.on?'∞':LIM.free.albums})</button>${A?'<button id="ra">Adı değiştir</button><button id="da">Albümü sil</button>':''}
  <button id="bk">📖 Fotokitap${P.on?'':' 🔒'}</button></div>${cards}
  ${list.length?grid(list):'<p class="muted">Bu görünümde fotoğraf yok.</p>'}`},
 '/archive':async()=>{const ph=await DB.all('photos'),used=ph.reduce((n,p)=>n+(p.size||0)+(p.thumb?.size||0),0),lim=P.mb*1048576;
  let q='';try{const e=await navigator.storage.estimate();q=`<p class="muted">Tarayıcı kotası: ${fmt(e.usage)} / ${fmt(e.quota)}</p>`}catch{}
  const pct=Math.min(100,used/lim*100);
  return`<h1>My Archive</h1><div class="card"><b>${ph.length} fotoğraf</b> · ${fmt(used)} / ${P.on?'2 GB (Extended Archive)':LIM.free.mb+' MB'}<div class="bar ${pct>85?'warn':''}"><i style="width:${pct}%"></i></div>${q}
  <p class="muted">${CAMERAS.map(c=>[c,ph.filter(p=>p.cam===c.id).length]).filter(x=>x[1]).map(x=>esc(x[0].model)+': '+x[1]).join(' · ')||'—'}</p></div>
  ${P.on?'':'<div class="note promo" style="margin-top:12px">Alan dolarsa Extended Archive ile 2 GB’a çık. <a href="#/premium">Premium</a></div>'}
  <p class="note" style="margin-top:12px">Fotoğraflar bu cihazda özel olarak saklanır. Bulut arşivi FOREVYE/arka uç bağlantısı gerektirir. Düzenli yedek için ZIP indir.</p>
  <div class="row"><button class="pri" id="exp" ${ph.length?'':'disabled'}>Tümünü ZIP olarak indir</button></div>`},
 '/premium':async()=>{let body;
  if(!FOREVYE.configured)body=`<p class="note">FOREVYE merkezi servisi bağlı değil. Kristal bakiyesi ve premium yetkisi yerelde üretilmez; <code>js/forevye-adapter.js</code> içindeki <code>API_BASE</code> ayarlanınca paketler ve fiyatlar sunucudan okunur.</p>`;
  else try{const c=await FOREVYE.catalog();body=`<div class="grid">${c.map(p=>`<div class="card"><h3>${p.duration_hours/24} Günlük Premium</h3><p>${p.duration_hours} saat · ${p.crystal_price} kristal</p><button class="pri buy" data-c="${esc(p.package_code)}">Kristalle etkinleştir</button></div>`).join('')}</div>`}catch(e){body=`<p class="note">${esc(e.message)}</p>${e.status===401?'<button id="fv2">FOREVYE’yi bağla</button>':''}`}
  const row=(a,b,c)=>`<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
  return`<h1>Premium</h1><p>3 günlük ve 7 günlük süreli erişim; yalnızca kristal ile, otomatik yenilenmez. Kamera modelleri ve temel çekim her zaman ücretsiz.</p>
  <div class="card ${P.on?'okc':''}"><b>${P.on?'★ Premium aktif':'Premium aktif değil'}</b>${P.exp?`<p class="muted">Bitiş: ${new Date(P.exp).toLocaleString('tr-TR')}</p>`:''}${P.err?`<p class="muted">${esc(P.err)}</p>`:''}</div>
  <div class="grid feat"><div class="card"><h3>📚 Premium Albums</h3><small>Sınırsız albüm, albüm kapağı seçimi, albüm kartları.</small></div><div class="card"><h3>💾 Extended Archive</h3><small>200 MB yerine 2 GB cihaz arşivi.</small></div>
  <div class="card"><h3>🎞 Premium Collections</h3><small>Film şeridi, siyah pasparto ve tarih damgası çerçeveleri.</small></div><div class="card"><h3>📖 Photo Book</h3><small>Fotoğraf veya albümünüzden A4 PDF fotokitap.</small></div></div>
  <div class="tw"><table class="tbl"><tr><th></th><th>Ücretsiz</th><th>Premium</th></tr>${row('Tüm kameralar','✓','✓')}${row('Arşiv alanı','200 MB','2 GB')}${row('Albüm sayısı','3','Sınırsız + kapak')}${row('Çerçeveler','Klasik','Klasik + 3 kolleksiyon')}${row('Fotokitap (PDF)','—','✓')}${row('ZIP yedek, paylaş, favoriler','✓','✓')}</table></div>
  <h2>Paketler</h2>${body}<p class="muted">Premium bitince fotoğraflar silinmez; sadece premium özellikler kapanır ve yeni kayıt sınırları ücretsiz seviyeye döner.</p>`},
 '/settings':()=>{const demo=/demo/.test(location.hash)&&!FOREVYE.configured;
  return`<h1>Profile / Settings</h1><div class="card"><h3>FOREVYE hesabı</h3><p class="muted">İsteğe bağlı. Şifren bu uygulamaya girilmez; güvenli yetkilendirme sayfasına yönlendirilirsin.</p><button id="fv">FOREVYE'yi bağla</button></div>
  <div class="card" style="margin-top:12px"><h3>Deneyim</h3><label class="row"><input type="checkbox" id="sn" ${snd?'checked':''}> Deklanşör sesi</label>${inst?'<button id="ins">Uygulamayı ana ekrana ekle</button>':'<p class="muted">Tarayıcı menüsünden “Ana ekrana ekle” ile uygulama gibi kurabilirsin; çevrimdışı çalışır.</p>'}</div>
  ${demo?`<div class="card" style="margin-top:12px"><h3>Satış önizlemesi</h3><p class="muted">Premium özellikleri bu cihazda dener. Gerçek satın alma değildir; API_BASE tanımlanınca devre dışı kalır.</p><label class="row"><input type="checkbox" id="dm" ${P.demo?'checked':''}> Premium önizleme</label></div>`:''}
  <div class="card" style="margin-top:12px"><h3>Gizlilik</h3><p class="muted">Fotoğraflar varsayılan olarak özeldir ve bu cihazda tutulur; hiçbir yere gönderilmez. Paylaşım, cihazının kendi paylaşım menüsüyle yapılır. Bağlantı ile paylaşım sunucu (Faz 3) gerektirir.</p></div>
  <div class="card" style="margin-top:12px"><h3>Veri</h3><button id="wipe">Tüm yerel verileri sil</button></div>`}
};

/* ---------- Router ---------- */
async function render(){
 const my=++rid;stop();urls.forEach(URL.revokeObjectURL);urls=[];await P.ready;
 const path=(location.hash.slice(1)||'/').split('?')[0],r=routes[path]||routes['/'];
 document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+path));
 let h;try{h=await r()}catch(e){h=`<p class="note">Bir hata oluştu: ${esc(e.message||e)}</p>`}
 if(my!==rid)return;V.innerHTML=h;bind(path);if(path!==lastPath)scrollTo(0,0);lastPath=path}
let lastPath='';
addEventListener('hashchange',render);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();inst=e});
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
P.ready=P.load();render();

function bind(path){
 document.querySelectorAll('[data-cam]').forEach(b=>b.onclick=()=>{sel=b.dataset.cam;LS.set('cam',sel);
  document.querySelectorAll('[data-cam]').forEach(x=>x.classList.toggle('sel',x===b));const s=$('#stage');if(s)s.style.aspectRatio=cam(sel).aspect;if(path==='/catalog')location.hash='#/camera'});
 const ids=[...document.querySelectorAll('.ph[data-id]')].map(b=>b.dataset.id);
 document.querySelectorAll('.ph[data-id]').forEach(b=>b.onclick=()=>openPhoto(b.dataset.id,ids));
 if(path==='/camera')bindCamera();
 if(path==='/album'){const go=()=>location.hash=`#/album?a=${$('#fa').value}&s=${$('#fs').value}&f=${$('#ff').checked?1:0}`;$('#fa').onchange=go;$('#fs').onchange=go;$('#ff').onchange=go;
  const a=$('#fa').value;
  $('#na').onclick=async()=>{const al=await DB.all('albums');if(!P.on&&al.length>=LIM.free.albums)return needPrem(`Ücretsiz planda en fazla ${LIM.free.albums} albüm açılır.`);
   const t=await ask('Albüm adı');if(t){await DB.put('albums',{id:crypto.randomUUID(),title:t,ids:[],cover:null});render()}};
  const ra=$('#ra');if(ra){ra.onclick=async()=>{const al=(await DB.all('albums')).find(x=>x.id===a),t=await ask('Yeni ad',al.title);if(t){al.title=t;await DB.put('albums',al);render()}};
   $('#da').onclick=async()=>{if(confirm('Albüm silinsin mi? Fotoğraflar silinmez.')){await DB.del('albums',a);location.hash='#/album'}}}
  $('#bk').onclick=async()=>{const al=await DB.all('albums');book(ids,al.find(x=>x.id===a)?.title||'Anilarim')}}
 if(path==='/archive'&&$('#exp'))$('#exp').onclick=async e=>{const b=e.target;b.disabled=true;b.textContent='Hazırlanıyor…';
  try{const ps=(await DB.all('photos')).sort((x,y)=>x.at-y.at),files=[];
   for(const[i,p]of ps.entries()){const x=await DB.get('blobs',p.id);if(x)files.push({name:`retro-${p.cam}-${new Date(p.at).toISOString().slice(0,10)}-${i+1}.jpg`,blob:x.blob})}
   dl(await makeZip(files),'retro-camera-yedek.zip');toast('ZIP indirildi ✓')}catch(er){toast('Dışa aktarma başarısız: '+er.message)}
  b.disabled=false;b.textContent='Tümünü ZIP olarak indir'};
 if(path==='/premium'){document.querySelectorAll('.buy').forEach(b=>b.onclick=async()=>{b.disabled=true;
   try{await FOREVYE.purchase(b.dataset.c);P.ready=P.load();await P.ready;toast('Premium etkinleştirildi ★');render()}catch(e){toast(e.message)}b.disabled=false});
  const f=$('#fv2');if(f)f.onclick=()=>FOREVYE.connect()}
 if(path==='/settings'){$('#fv').onclick=()=>{try{FOREVYE.connect()}catch(e){toast(e.message)}};
  $('#sn').onchange=e=>{snd=e.target.checked;LS.set('snd',snd?'1':'0')};
  const i=$('#ins');if(i)i.onclick=async()=>{inst.prompt();await inst.userChoice;inst=null;render()};
  const d=$('#dm');if(d)d.onchange=async e=>{P.demo=e.target.checked;LS.set('demo',P.demo?'1':'0');P.ready=P.load();await P.ready;toast(P.demo?'Premium önizleme açık':'Önizleme kapalı')};
  $('#wipe').onclick=async()=>{if(!confirm('Tüm fotoğraflar ve albümler silinecek. Emin misin?'))return;await DB.wipe();['cam','frame','timer','snd','demo'].forEach(LS.del);P.demo=false;P.ready=P.load();toast('Tüm yerel veriler silindi.');render()}}}

function bindCamera(){
 const msg=$('#msg'),vid=$('#vid'),st=$('#stage');st.style.aspectRatio=cam(sel).aspect;
 $('#tm').onchange=e=>{timer=+e.target.value;LS.set('timer',timer)};
 document.querySelectorAll('[data-fr]').forEach(b=>b.onclick=()=>{const f=FRAMES.find(x=>x.id===b.dataset.fr);if(!f.free&&!P.on)return needPrem('Kolleksiyon çerçeveleri');
  frame=f.id;LS.set('frame',frame);document.querySelectorAll('[data-fr]').forEach(x=>x.classList.toggle('on',x===b))});
 async function open(){stop();
  if(!navigator.mediaDevices?.getUserMedia){msg.textContent='Bu tarayıcı kamerayı desteklemiyor ya da bağlantı güvenli (HTTPS) değil.';return}
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facing,width:{ideal:1280}},audio:false});
   vid.srcObject=stream;vid.classList.toggle('mir',facing==='user');await vid.play();st.hidden=false;$('#shot').hidden=false;$('#flip').hidden=false;$('#start').hidden=true;msg.textContent='';
   const caps=stream.getVideoTracks()[0].getCapabilities?.()||{};$('#torch').hidden=!caps.torch;
  }catch(e){msg.textContent=e.name==='NotFoundError'?'Kamera bulunamadı.':'Kamera izni verilmedi. Çekim için tarayıcı ayarlarından izin ver; izin atlatılmaz.'}}
 $('#start').onclick=open;$('#flip').onclick=()=>{facing=facing==='user'?'environment':'user';open()};
 let on=false;$('#torch').onclick=async()=>{on=!on;try{await stream.getVideoTracks()[0].applyConstraints({advanced:[{torch:on}]})}catch{}};
 $('#shot').onclick=async()=>{const c=cam(sel),n=c.frames||1,fr=[],btn=$('#shot'),mir=facing==='user',fid=(FRAMES.find(f=>f.id===frame)||FRAMES[0]);btn.disabled=true;
  for(let i=0;i<n;i++){const w=i===0?timer:(n>1?3:0);
   for(let k=w;k>0;k--){$('#cnt').innerHTML=`<div class="count">${k}</div>`;await sleep(w>3?1000:700)}$('#cnt').innerHTML='';
   const f=$('#fl');f.classList.add('on');if(snd)click();navigator.vibrate?.(15);await sleep(60);fr.push(process(vid,c,c.flash,mir));f.classList.remove('on');await sleep(300)}
  const at=Date.now(),useF=fid.free||P.on?fid.id:'classic',out=decorate(layout(fr,c),useF,at);
  stop();vid.srcObject=null;st.hidden=true;btn.hidden=true;$('#flip').hidden=true;$('#torch').hidden=true;$('#start').hidden=false;btn.disabled=false;
  const b=await blob(out),th=document.createElement('canvas');th.width=320;th.height=Math.round(320*out.height/out.width);th.getContext('2d').drawImage(out,0,0,th.width,th.height);
  const tb=await blob(th,.8);
  $('#res').innerHTML=`<div class="ph print" style="max-width:340px;margin:16px auto"><img src="${url(b)}" alt="Baskı"></div><div class="row" style="justify-content:center"><button class="pri" id="sv">Kaydet</button><button id="dlb">İndir</button><button id="shb">Paylaş</button><button id="rt">Yeniden çek</button></div>`;
  $('#sv').onclick=async()=>{const used=await usage();
   if(used+b.size+tb.size>P.mb*1048576)return toast(P.on?'Arşiv dolu. Eski fotoğrafları indirip sil.':'Ücretsiz arşiv (200 MB) dolu. Extended Archive için Premium’a geç.','#/'+(P.on?'archive':'premium'));
   try{await DB.addPhoto({id:crypto.randomUUID(),cam:c.id,ver:c.version,at,size:b.size,thumb:tb,fav:false,frame:useF,w:out.width,h:out.height},b);$('#sv').disabled=true;$('#sv').textContent='Kaydedildi ✓'}
   catch(e){toast(e.name==='QuotaExceededError'?'Cihaz depolama alanı dolu.':'Kaydedilemedi: '+e.message)}};
  $('#dlb').onclick=()=>dl(b,`retro-${c.id}.jpg`);$('#shb').onclick=()=>share(b,`retro-${c.id}.jpg`);$('#rt').onclick=()=>{$('#res').innerHTML='';open()}}}

/* ---------- Fotoğraf görüntüleyici ---------- */
let vl=[],vi=0,vurl=null;
const closeM=()=>{const m=$('#modal');m.hidden=true;m.innerHTML='';if(vurl){URL.revokeObjectURL(vurl);vurl=null}};
async function openPhoto(id,list){vl=list||[id];vi=Math.max(0,vl.indexOf(id));await showPhoto()}
async function showPhoto(){
 const id=vl[vi],[p,x,al]=await Promise.all([DB.get('photos',id),DB.get('blobs',id),DB.all('albums')]);if(!p||!x)return closeM();
 const m=$('#modal'),c=cam(p.cam),A=new URLSearchParams(location.hash.split('?')[1]||'').get('a'),inA=A&&al.find(a=>a.id===A);
 if(vurl)URL.revokeObjectURL(vurl);vurl=URL.createObjectURL(x.blob);m.hidden=false;
 m.innerHTML=`<div class="box"><img src="${vurl}" alt=""><p class="muted">${esc(c.brand+' '+c.model)} · profil v${p.ver} · ${new Date(p.at).toLocaleString('tr-TR')} · ${fmt(p.size||x.blob.size)}</p>
 <div class="row"><button id="pv" ${vi?'':'disabled'} aria-label="Önceki">‹</button><span class="muted">${vi+1}/${vl.length}</span><button id="nx" ${vi<vl.length-1?'':'disabled'} aria-label="Sonraki">›</button>
 <button id="fav" aria-pressed="${!!p.fav}">${p.fav?'♥':'♡'}</button><button id="d">İndir</button><button id="sh">Paylaş</button><button id="x">Sil</button><button id="c">Kapat</button></div>
 <div class="row"><select id="ad"><option value="">Albüme ekle…</option>${al.map(a=>`<option value="${a.id}">${esc(a.title)}</option>`).join('')}</select>
 ${inA?`<button id="rm">Albümden çıkar</button><button id="cv">Kapak yap${P.on?'':' 🔒'}</button>`:''}</div></div>`;
 m.onclick=e=>{if(e.target===m)closeM()};$('#c').onclick=closeM;
 $('#pv').onclick=()=>{vi--;showPhoto()};$('#nx').onclick=()=>{vi++;showPhoto()};
 $("#fav").onclick=async()=>{p.fav=!p.fav;await DB.put('photos',p);showPhoto();render()};
 $('#d').onclick=()=>dl(x.blob,`retro-${p.cam}-${p.at}.jpg`);$('#sh').onclick=()=>share(x.blob,`retro-${p.cam}-${p.at}.jpg`);
 $('#x').onclick=async()=>{if(!confirm('Fotoğraf silinsin mi?'))return;await DB.rmPhoto(id);for(const a of al)if(a.ids.includes(id)){a.ids=a.ids.filter(i=>i!==id);if(a.cover===id)a.cover=null;await DB.put('albums',a)}
  vl.splice(vi,1);if(!vl.length)closeM();else{vi=Math.min(vi,vl.length-1);showPhoto()}render()};
 $('#ad').onchange=async e=>{const a=al.find(y=>y.id===e.target.value);if(a&&!a.ids.includes(id)){a.ids.push(id);a.cover=a.cover||id;await DB.put('albums',a);toast('“'+a.title+'” albümüne eklendi')}e.target.value='';render()};
 if(inA){$('#rm').onclick=async()=>{inA.ids=inA.ids.filter(i=>i!==id);if(inA.cover===id)inA.cover=null;await DB.put('albums',inA);vl.splice(vi,1);if(!vl.length)closeM();else{vi=Math.min(vi,vl.length-1);showPhoto()}render()};
  $('#cv').onclick=async()=>{if(!P.on)return needPrem('Albüm kapağı seçimi');inA.cover=id;await DB.put('albums',inA);toast('Kapak güncellendi');render()}}}
addEventListener('keydown',e=>{const m=$('#modal');if(m.hidden)return;if(e.key==='Escape')closeM();if(e.key==='ArrowLeft'&&vi>0){vi--;showPhoto()}if(e.key==='ArrowRight'&&vi<vl.length-1){vi++;showPhoto()}});

/* ---------- Premium: Photo Book ---------- */
async function book(ids,title){
 if(!P.on)return needPrem('Fotokitap');if(!ids.length)return toast('Kitap için fotoğraf yok.');
 toast('Fotokitap hazırlanıyor…');const imgs=[];
 try{for(const id of ids.slice(0,60)){const[p,b]=await Promise.all([DB.get('photos',id),DB.get('blobs',id)]);if(!p||!b)continue;
   const bm=await createImageBitmap(b.blob),c=cam(p.cam);imgs.push({at:p.at,blob:b.blob,w:bm.width,h:bm.height,cap:`${c.brand} ${c.model}  -  ${new Date(p.at).toLocaleDateString('tr-TR')}`});bm.close?.()}
  imgs.sort((a,b)=>a.at-b.at);const f=new Date(imgs[0].at).toLocaleDateString('tr-TR'),l=new Date(imgs[imgs.length-1].at).toLocaleDateString('tr-TR');
  dl(await makePDF(title,`${imgs.length} fotograf  |  ${f===l?f:f+' - '+l}`,imgs),'retro-fotokitap.pdf');toast('Fotokitap indirildi ✓'+(ids.length>60?' (ilk 60 fotoğraf)':''))
 }catch(e){toast('Fotokitap oluşturulamadı: '+e.message)}}
