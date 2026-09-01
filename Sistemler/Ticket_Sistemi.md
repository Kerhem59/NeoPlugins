# 🎫 Ticket (Destek) Sistemi

Sunucu üyelerinin yetkililerle özel iletişim kurmasını sağlayan sistemdir.

## 🛠️ Kurulum
1.  `/ticket-kur` komutunu kullanarak destek mesajını istediğiniz kanala gönderin.
2.  `/ayarla` panelinden **Ticket Yetkili Rolü** ve **Ticket Kategorisini** seçin.

## ⚙️ İşleyiş
*   Kullanıcı butona bastığında sistem ona özel bir kanal oluşturur.
*   Ticket kanalı açıldığında yetkililere anında bildirim gider.
*   Destek talebi kapatıldığında, tüm konuşma geçmişi (`transcript`) belirtilen log kanalına gönderilir.

## 📝 Komutlar
*   `/ticket-kur`: Panel mesajını gönderir.
*   `/ticket-stats`: Bugüne kadar açılan ve kapanan ticketların istatistiklerini gösterir.
