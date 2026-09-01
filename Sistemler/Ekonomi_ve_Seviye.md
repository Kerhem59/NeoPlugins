# 💰 Ekonomi ve 📈 Seviye Sistemleri

Sohbet aktifliğini ve sesli kanal katılımını ödüllendiren entegre bir sistemdir.

## 💵 Ekonomi (`/coin`)
Sistem iki ana cüzdan üzerinden çalışır: Nakit ve Banka.

*   **Kazanma Yolları:**
    *   **Mesaj Ödülü:** Her mesaj attığınızda belirli bir miktar para kazanırsınız.
    *   **Ses Ödülü:** Sesli kanallarda bulunduğunuz her dakika için otomatik coin kazanırsınız.
*   **Komutlar:**
    *   `/coin [@kullanıcı]`: Bakiyenizi gösteren kredi kartı temalı görseli açar.
    *   `/top coin`: Sunucunun en zenginlerini sıralar.

## 🆙 Seviye Sistemi (`/rank`)
Kullanıcıların aktifliğini gösteren XP sistemidir.

*   **XP Kazanımı:** Atılan her mesaj seviye atlamak için gereken XP'yi artırır.
*   **Komutlar:**
    *   `/rank [@kullanıcı]`: Seviyenizi, XP miktarınızı ve sunucu sıralamanızı gösteren görsel kartı açar.
    *   `/top level`: En yüksek seviyeli üyeleri listeler.

---

> [!NOTE]
> Ekonomi ve Seviye verileri MySQL veritabanında güvenli bir şekilde saklanır ve sunucu değişimlerinden etkilenmez.
