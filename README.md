# RETRO CAMERA
*A moment from another time.*. Tarayıcı tabanlı retro kamera uygulaması. Statik HTML/CSS/JS, derleme gerekmez, harici kütüphane yok. PWA: ana ekrana eklenir, çevrimdışı çalışır.

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

## Premium üyelik (kod ile)
Premium, Nexus Pass'ten kristalle alınan koda bağlıdır; hesap gerekmez.
1. Kullanıcı Nexus Pass → Keşfet → Retro Camera bölümünden 3 ya da 7 günlük kodu kristalle alır.
2. Satın alma sonrası **"Retro Camera'da aç"** düğmesi `<uygulama>/#kod=XXXX-XXXX-XXXXX` bağlantısını açar; uygulama kodu adresten siler ve kendiliğinden etkinleştirir. Elle girmek için Premium sayfasındaki kod alanı da var.
3. `js/pass.js` kodu sunucuya gönderir (`POST /api/retro/redeem`, `{code, app:'retro', device, v:1}`), dönen bitiş tarihini cihazda saklar, günde bir `verify` ile teyit eder. İnternet yokken son bilinen süre bitene kadar geçerli kalır; saat geri alınarak süre uzatılamaz.
4. Süre bitince fotoğraflar silinmez; yalnızca premium özellikler kapanır ve yeni kayıt sınırları ücretsiz seviyeye döner.

Sunucu tarafı (ürün tanımı, `redeem`/`verify` uçları, CORS) için `SUNUCU.md` dosyasına bak. Kod tarafı doğrulaması esastır; uygulamadaki kontrol yalnızca görünüm içindir.

## Teknik notlar
- Veri: IndexedDB v2 (blob'lar ayrı depoda). v1 verisi ilk açılışta otomatik taşınır.
- Limitler `js/app.js` başında `LIM`, çerçeveler `FRAMES`; kamera profilleri `js/cameras.js`.
- Sürüm önbelleği: `sw.js` içindeki `V` değerini her yayında artır.
- Üyelik adresleri (`API`, `MARKET`) `js/pass.js` başındadır.

## Sonraki adımlar (arka uç gerektirir)
Token tabanlı paylaşım bağlantıları, bulut arşivi, hesaplı üyelik (Nexus entitlement) (Cloudflare Workers + D1 + R2).
