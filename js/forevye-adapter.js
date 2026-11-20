/* FOREVYE entegrasyon adaptörü.
   Kristal bakiyesi ve premium yetkisi YEREL olarak üretilmez; yalnızca merkezi API ile doğrulanır.
   API_BASE doldurulana kadar premium satın alma devre dışıdır. FOREVYE şifresi bu uygulamaya hiç alınmaz (OAuth/redirect akışı). */
const FOREVYE={
 API_BASE:'', // örn: 'https://api.forevye.example'
 get configured(){return !!this.API_BASE},
 async _f(path,opt={}){
  if(!this.configured)throw new Error('FOREVYE bağlantısı yapılandırılmamış.');
  const r=await fetch(this.API_BASE+path,{credentials:'include',...opt,headers:{'Content-Type':'application/json',...(opt.headers||{})}});
  if(!r.ok)throw new Error('Sunucu hatası: '+r.status);return r.json()},
 catalog(){return this._f('/api/premium/catalog')},
 status(){return this._f('/api/premium/status')},
 purchase(code){return this._f('/api/premium/purchase',{method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({package_code:code})})},
 connect(){if(!this.configured)throw new Error('FOREVYE bağlantısı yapılandırılmamış.');location.href=this.API_BASE+'/auth/app-connect?return='+encodeURIComponent(location.href)}
};
