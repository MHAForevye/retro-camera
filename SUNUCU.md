# Retro Camera · sunucu tarafı (Kristal Worker'ında yapılacaklar)

Bu dosya, uygulama tarafının sunucudan beklediklerini anlatır. Worker kodu (`worker/index.js`, hava reposu) bu pakette olmadığı için o tarafı sen ekleyeceksin; Zamanlayıcı'nın nasıl eklendiyse aynısı.

## 1. Ürün tanımı (`CFG`)
Zamanlayıcı'nın yanına, aynı biçimde:

```js
retro: {
  tiers: [{ id: 'premium', name: 'Retro Camera Premium', short: 'Premium' }],
  plans: [
    { tier: 'premium', days: 3, cost: 100 },   // fiyatlar örnek, sen belirle
    { tier: 'premium', days: 7, cost: 200 }
  ],
  save7: { premium: 14 }                       // isteğe bağlı; yoksa Nexus Pass kendisi hesaplar
}
```
`/init` ve `/sync` cevabındaki `cfg` içinde `retro` da dönmeli (Nexus Pass fiyatı buradan okur; boşsa "Paket yok" yazar).

## 2. Kod üretimi
- Kod biçimi Zamanlayıcı ile aynı: 13 karakter, ekranda `XXXX-XXXX-XXXXX`.
- Kod `app = 'retro'` ile saklanır (başka uygulamanın kodu burada geçmesin).
- İlk kullanımda süre başlar, kod en fazla 2 cihaza bağlanır.

## 3. Uç noktalar
| Uç | Kim çağırır | Ne yapar |
|---|---|---|
| `POST /api/rpass/buy` `{tier:'premium', days:3\|7}` | Nexus Pass (Bearer kristal hesabı) | Kristali düşer, kodu üretir. Cevap: `/api/zpass/buy` gibi `{s, cfg, rpass:{c,tier,days,used,exp}}`. Hata olursa `{err, s}`. |
| `POST /api/admin/rpass` `{tier, days}` | Nexus Pass yönetici bölümü | Ücretsiz kod üretir → `{code, name, days}` |
| `POST /api/admin/rpasses` | Nexus Pass yönetici bölümü | Üretilen kodlar → `{passes:[{c,tier,days,used,exp}]}` |
| `POST /api/retro/redeem` `{code, app:'retro', device, v:1}` | Retro Camera | Doğru kod → `200 {ok:true, app:'retro', plan:'premium', expiresAt}` (ms cinsinden). Aynı kod + aynı `device` = aynı sonuç. |
| `POST /api/retro/verify` (aynı gövde) | Retro Camera, günde bir | Süre/durum teyidi, aynı cevap biçimi. |

Hata cevabı: `4xx {ok:false, error:"invalid_code|used|expired|wrong_app|rate_limited"}`. Uygulama `5xx` ve gövdesiz cevabı "ağ hatası" sayar ve son bilinen süreyi korur.

`S.rpasses` (kullanıcının satın aldığı kodlar) `S` içinde `passes` ve `zpasses` ile aynı biçimde dönmeli; Nexus Pass "Üyeliklerim"de bunu listeler.

## 4. CORS ve adresler
- `/api/retro/*` için izinli kaynaklara Retro Camera'nın alan adı eklenmeli (yalnızca alan adı, Zamanlayıcı'daki gibi).
- Kristal uçları (`/api/rpass/buy`, `/api/admin/rpass*`) için Nexus Pass alan adı zaten izinli (`MARKET_ORIGIN`).
- Uygulamada `js/pass.js` başındaki `API` ve `MARKET` adreslerini kontrol et.
- Nexus Pass `assets/config.js` içindeki `RETRO_URL` ve `ZAMAN_URL` değerlerini gerçek yayın adresleriyle doldur.
