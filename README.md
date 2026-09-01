# Neo Bots - Discord v14 Bot Altyapısı

Discord.js v14 kullanılarak oluşturulmuş, tamamen özelleştirilebilir ve genişletilebilir bir Discord botu altyapısıdır.

## Özellikler

- **Discord.js v14 Desteği:** En yeni Discord API özelliklerini ve geliştirmelerini destekler.
- **Modüler Yapı:** Botun işlevselliğini kolayca genişletmek ve özelleştirmek için modüler bir kod yapısı.
- **Hızlı Kurulum:** Geliştirilmiş BAT dosyaları (`kur.bat` ve `baslat.bat`) ile hızlı kurulum ve çalıştırma.
- **Esneklik:** Bot komutları, event dinleyicileri ve diğer özellikler geliştiricinin ihtiyaçlarına göre rahatça düzenlenebilir.
- **MySQL Desteği:** Veritabanı bağlantısı ile kalıcı veri saklama.
- **Otomatik Yedekleme:** 30 dakikada bir MySQL veritabanı yedeği alır.

## Komutlar

- AFK Sistemi (Gelişmiş!)
- EmojiEkle Komutu  
- Sil Komutu
- Oto Mesaj yanıtlama (Configli)
- Backup komutu (Database)
- Yardım (Oto yenilenir yüklenen komuta göre)
- (Handler) (Button / Modal / Menu gibi)
- Basit üye komutları (Banner / Profil)

## Kurulum

### Gereksinimler

- **Node.js:** Proje için Node.js sürüm 18 veya üzeri gereklidir.
- **NPM:** Node.js paketlerini yönetmek için npm kurulmuş olmalıdır.
- **MySQL:** Veritabanı için MySQL/XAMPP gereklidir.

### Adımlar

1. **Depoyu İndirin**
   ```bash
   git clone https://github.com/neobots/discord-bot.git
   cd discord-bot
   ```

2. **Kurulumu başlatın**
   ```bash
   kur.bat
   ```

3. **Botu başlatın**
   ```bash
   baslat.bat
   ```

## Neo Bots

Bu proje **Neo Bots** tarafından geliştirilmektedir. Plugin sistemi **Neo Plugins** altyapısını kullanır.
