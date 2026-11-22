/* FOREVYE entegrasyon adaptörü.
   Kristal bakiyesi ve premium yetkisi YEREL olarak üretilmez; yalnızca merkezi API ile doğrulanır.
   API_BASE doldurulana kadar premium satın alma devre dışıdır. FOREVYE şifresi bu uygulamaya hiç alınmaz (OAuth/redirect akışı).
   Beklenen uçlar: GET /api/premium/catalog → [{package_code,duration_hours,crystal_price}]
                   GET /api/premium/status  → {active:boolean, expires_at:ISO|null}
                   POST /api/premium/purchase {package_code} (Idempotency-Key başlığı ile) */
const FOREVYE={
 API_BASE:'', // örn: 'https://api.forevye.example'
 get configured(){return !!this.API_BASE},
 async _f(path,opt={}){
  if(!this.configured)throw new Error('FOREVYE bağlantısı yapılandırılmamış.');
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),10000);
  try{
   const r=await fetch(this.API_BASE+path,{credentials:'include',signal:ac.signal,...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});
   if(!r.ok){const e=new Error(r.status===401?'Oturum gerekli: önce FOREVYE hesabını bağla.':r.status===402?'Yetersiz kristal bakiyesi.':'Sunucu hatası: '+r.status);e.status=r.status;throw e}
   return await r.json()
  }catch(e){if(e.name==='AbortError')throw new Error('Sunucuya ulaşılamadı (zaman aşımı).');throw e}
  finally{clearTimeout(t)}},
 catalog(){return this._f('/api/premium/catalog')},
 status(){return this._f('/api/premium/status')},
 purchase(code){return this._f('/api/premium/purchase',{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({package_code:code})})},
 connect(){if(!this.configured)throw new Error('FOREVYE bağlantısı yapılandırılmamış.');location.href=this.API_BASE+'/auth/app-connect?return='+encodeURIComponent(location.href)}
};
