# RETRO CAMERA
Vintage Analog, tarayıcı tabanlı retro kamera uygulaması (statik HTML/CSS/JS, derleme gerekmez).

## GitHub Pages
1. Repoya tüm dosyaları yükle → Settings → Pages → Branch: `main` / root.
2. Kamera için HTTPS gerekir (GitHub Pages HTTPS sunar).

## Bu sürümde (Faz 1–2 + FOREVYE iskeleti)
- 5 ücretsiz kamera, sabit profiller (`js/cameras.js`), kullanıcı efekt ayarı yok; her fotoğraf profil sürümünü saklar
- İzinli kamera, ön/arka, fener, deklanşör, baskı (tam kare / beyaz çerçeve / photo booth şeridi)
- My Album / My Archive (IndexedDB, özel, cihazda), albüm oluştur/yeniden adlandır, indir, sil
- Premium ekranı + `js/forevye-adapter.js`: kristal/premium yalnızca merkezi API ile; `API_BASE` boşken satın alma kapalı, sahte bakiye yok

## Sonraki adımlar (arka uç gerektirir)
Token tabanlı paylaşım, bulut arşivi, FOREVYE Auth/Wallet/Ledger/Entitlement, Cloudflare Workers + D1 + R2 (şartname §11–12).
