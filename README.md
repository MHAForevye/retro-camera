# RETRO CAMERA
*A moment from another time.* - Tarayıcı tabanlı retro kamera uygulaması. Statik HTML/CSS/JS, derleme gerekmez, harici kütüphane yok. PWA: ana ekrana eklenir, çevrimdışı çalışır.

## Yayınlama
GitHub Pages / Netlify / Cloudflare Pages: tüm dosyaları yükle. Kamera için HTTPS gerekir (hepsi HTTPS sunar).

## Ücretsiz
- 5 kamera (sabit profiller, `js/cameras.js`), ön/arka kamera (ön kamera aynalı), fener, zamanlayıcı (3/10 sn), deklanşör sesi
- Baskı düzenleri: tam kare / beyaz çerçeve / photo booth şeridi
- My Album: favoriler, albümler (3 adet), fotoğraf görüntüleyici (ok tuşları), indir, **paylaş** (cihazın paylaşım menüsü), sil
- My Archive: 200 MB cihaz arşivi, **ZIP yedek**; veri yalnızca cihazda kalır

## Premium (kristal ile, süreli, otomatik yenilenmez)
- **Extended Archive:** 2 GB
- **Premium Albums:** sınırsız albüm + albüm kapağı + kapaklı albüm kartları
- **Premium Collections:** Film şeridi, Siyah pasparto, Tarih damgası çerçeveleri
- **Photo Book:** albüm/fotoğraflardan A4 PDF fotokitap (en fazla 60 foto)
- Premium bitince fotoğraflar silinmez; yalnızca yeni kayıt sınırları ücretsiz seviyeye döner.

## FOREVYE bağlantısı
`js/forevye-adapter.js` içinde `API_BASE` doldur. Beklenen uçlar:
`GET /api/premium/catalog`, `GET /api/premium/status` → `{active, expires_at}`, `POST /api/premium/purchase` (Idempotency-Key ile).
`API_BASE` boşken satın alma kapalıdır; yerelde bakiye/premium üretilmez.

**Satış önizlemesi:** `API_BASE` boşken `#/settings?demo` adresinde gizli bir "Premium önizleme" anahtarı çıkar (yalnızca müşteriye özellikleri göstermek için). API bağlanınca otomatik devre dışı kalır.

## Teknik notlar
- Veri: IndexedDB v2 (blob'lar ayrı depoda). v1 verisi ilk açılışta otomatik taşınır.
- Limitler `js/app.js` başında `LIM`, çerçeveler `FRAMES`; kamera profilleri `js/cameras.js`.
- Sürüm önbelleği: `sw.js` içindeki `V` değerini her yayında artır.

## Sonraki adımlar (arka uç gerektirir)
Token tabanlı paylaşım bağlantıları, bulut arşivi, FOREVYE Auth/Wallet/Ledger/Entitlement (Cloudflare Workers + D1 + R2).
