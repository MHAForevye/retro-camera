'use strict';
/* Retro Camera üyelik (Premium): kodu sunucuda doğrular, süresi dolana kadar cihazda saklar.
   Kod, Nexus Pass'ten kristalle alınır; Kristal sunucusunda (Cloudflare Worker) kontrol edilir.
   Saf mantık: DOM'a dokunmaz. Süre bitince yalnızca özellikler kilitlenir, fotoğraflar silinmez. */
(function (g) {
  const API = 'https://mikroklimakontrolmerkezi.forevye.workers.dev/api/retro/', MARKET = 'https://mhaforevye.github.io/nexus-pass/#discover';
  const KP = 'retro-pass', KD = 'retro-dev', KT = 'retro-pass-t', DAY = 864e5, MAXP = 5;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
  /* Saat geri alınarak süre uzatılmasın: görülen en ileri zaman saklanır, "şimdi" bundan geri gitmez.
     Sunucu kodu hâlâ geçerli saydığında (verify) sıfırlanır; yanlışlıkla ileri alınmış saat kalıcı zarar vermez. */
  let hi = +ls.get(KT) || 0, hiSaved = hi;
  const now = () => { const n = Date.now(); if (n > hi) { hi = n; if (n - hiSaved > 6e4) { hiSaved = n; ls.set(KT, String(n)); } } return hi; };
  const resetClock = () => { hi = Date.now(); hiSaved = hi; ls.set(KT, String(hi)); };
  let list = [];
  try { const j = JSON.parse(ls.get(KP) || '{}'); if (Array.isArray(j.list)) list = j.list.filter(x => x && typeof x.c === 'string' && x.p === 'premium' && Number.isFinite(x.e) && Number.isFinite(x.v)).slice(0, MAXP); } catch (_) {}
  const store = () => ls.set(KP, JSON.stringify({ list }));
  const prune = () => { const n = now(); list = list.filter(x => x.e > n).sort((a, b) => b.e - a.e).slice(0, MAXP); };
  prune();
  const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  function device() {                                          // bu cihaza özel rastgele kimlik (kod en fazla 2 cihaza bağlanır)
    let d = ls.get(KD);
    if (!/^[a-f0-9]{32}$/.test(d || '')) { const a = new Uint8Array(16); crypto.getRandomValues(a); d = [...a].map(b => b.toString(16).padStart(2, '0')).join(''); ls.set(KD, d); }
    return d;
  }
  const expiry = () => Math.max(accountExp>now()?accountExp:0,list.reduce((m, x) => x.e > now() && x.e > m ? x.e : m, 0));
  const on = () => expiry() > 0;
  let accountExp=0, accountPlan='free';
  async function syncAccountSubscription(){
    try{
      await window.KR?.ready?.();
      const pair=window.KR?.creds?.(); if(!pair)return;
      const r=await fetch('https://mikroklimakontrolmerkezi.forevye.workers.dev/api/subscriptions/state',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+pair.id+'.'+pair.token},
        body:'{}',cache:'no-store'
      });
      if(!r.ok)return;
      const j=await r.json(), rows=(j.subscriptions||[]).filter(x=>x.app==='retro'&&x.active);
      if(rows.length){rows.sort((a,b)=>b.expires_at-a.expires_at);accountExp=rows[0].expires_at*1000;accountPlan=rows[0].tier;}
      else {accountExp=0;accountPlan='free';}
      emit();
    }catch(_){}
  }
  let sig = expiry();
  const emit = () => { const s = expiry(); if (s !== sig) { sig = s; g.dispatchEvent(new Event('rp:change')); } };
  async function call(path, code) {                            // ağ/sunucu hatası ile kod hatasını ayır
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 12000);
    try {
      const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, app: 'retro', device: device(), v: 1 }), signal: ac.signal, cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (r.ok && j && j.ok === true && Number.isFinite(+j.expiresAt)) return { ok: true, plan: 'premium', exp: +j.expiresAt };
      if (r.status >= 500 || !j || typeof j.error !== 'string') return { ok: false, net: true, error: 'net' };
      return { ok: false, error: j.error };
    } catch (_) { return { ok: false, net: true, error: 'net' }; } finally { clearTimeout(t); }
  }
  async function redeem(raw) {
    const c = norm(raw); if (c.length !== 13) return { ok: false, error: 'invalid_code' };
    const r = await call('redeem', c); if (!r.ok) return r;
    resetClock();
    const e = { c, p: 'premium', e: r.exp, v: Date.now() }, i = list.findIndex(x => x.c === c);
    if (i < 0) list.push(e); else list[i] = e;
    prune(); store(); emit(); return r;
  }
  async function verify(force) {                               // günde bir; ağ yoksa son bilinen durum korunur
    let ok = false;
    for (const x of list.filter(x => x.e > now() && (force || Date.now() - x.v > DAY))) {
      const r = await call('verify', x.c);
      if (r.ok) { x.e = r.exp; x.v = Date.now(); ok = true; }
      else if (['expired', 'invalid_code', 'wrong_app'].includes(r.error)) x.e = 0;
    }
    if (ok) resetClock();
    prune(); store(); emit();
  }
  setInterval(() => { prune(); emit(); }, 3e4);
  g.RP = { on, expiry, redeem, verify, norm, MARKET, syncAccountSubscription };
  syncAccountSubscription();
})(window);
