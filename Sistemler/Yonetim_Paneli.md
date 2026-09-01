# 👋 Hoşgeldin ve Yönetim Paneli Sistemi

Bu sistem, sunucunun temel ayarlarını ve giriş-çıkış döngüsünü yönetir.

## ⚙️ Yapılandırma (`/ayarla`)
Yönetici yetkisine sahipseniz `/ayarla` komutunu kullanarak aşağıdaki özellikleri panel üzerinden değiştirebilirsiniz:

*   **Giriş-Çıkış Kanalı:** Kullanıcılar katıldığında veya ayrıldığında gönderilecek **Hoşgeldin/Güle Güle** kartlarının kanalını belirler.
*   **Otorol:** Yeni katılan kullanıcılara otomatik olarak atanacak rol.
*   **Log Kanalları:** Ticket logları ve oyun içi sohbet kayıtlarının tutulacağı kanallar.

## 🖼️ Hoşgeldin Kartları
Bir kullanıcı sunucuya katıldığında, bot otomatik olarak **Premium Avatar** efektli bir hoşgeldin kartı oluşturur. Bu kart şunları içerir:
*   Kullanıcının avatarı (Özel parlama ve çerçeve efektli).
*   Kullanıcı adı ve sunucu bilgisi.
*   Sunucudaki kaçıncı üye olduğu bilgisi.

## 📝 Mesaj Özelleştirme
Paneldeki butonlar aracılığıyla giriş ve çıkış metinlerini özelleştirebilirsiniz. Metinlerde şu etiketleri kullanabilirsiniz:
*   `{member}`: Kullanıcıyı etiketler.
*   `{guild}`: Sunucu adını yazar.
*   `{count}`: Toplam üye sayısını yazar.
*   `{tag}`: Kullanıcının etiketini (Örn: User#0001) yazar.
