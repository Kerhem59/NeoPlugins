const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const path = require('path');

// Font kaydı
try {
  const fontsDir = path.join(__dirname, '../../../utils/canvas/fonts');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Bold.ttf'), 'Poppins Bold');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Regular.ttf'), 'Poppins');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-SemiBold.ttf'), 'Poppins SemiBold');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Inter-Variable.ttf'), 'Inter');
} catch (e) {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('magaza-bilgi')
    .setDescription('Mağazanın ödeme yöntemlerini, sosyal medya linklerini ve iletişim bilgilerini gösterir'),

  name: 'magaza-bilgi',
  description: 'Mağaza bilgilerini görüntüler',

  async execute(ctx) {
    await ctx.deferReply();

    try {
      const storeData = dbManager.get('store_info', { guild_id: ctx.guild.id });
      const info = storeData && storeData.length > 0 ? storeData[0] : {};

      // İstatistikler
      const totalOrders = (dbManager.get('customer_orders', { guild_id: ctx.guild.id }) || []).length;
      const totalProducts = (dbManager.get('store_products', { guild_id: ctx.guild.id }) || []).length;
      const totalReviews = (dbManager.get('reviews', { guild_id: ctx.guild.id }) || []).length;

      // Canvas Kartı
      const canvas = createCanvas(900, 520);
      const c = canvas.getContext('2d');

      // Arka plan gradient
      const bg = c.createLinearGradient(0, 0, canvas.width, canvas.height);
      bg.addColorStop(0, '#1a1a2e');
      bg.addColorStop(0.5, '#16213e');
      bg.addColorStop(1, '#0f3460');
      c.fillStyle = bg;
      c.fillRect(0, 0, canvas.width, canvas.height);

      // Üst dekoratif çizgi
      const topLine = c.createLinearGradient(0, 0, canvas.width, 0);
      topLine.addColorStop(0, '#e94560');
      topLine.addColorStop(0.5, '#FFD700');
      topLine.addColorStop(1, '#e94560');
      c.fillStyle = topLine;
      c.fillRect(0, 0, canvas.width, 4);

      // Sunucu Avatarı
      try {
        const guildIcon = ctx.guild.iconURL({ extension: 'png', size: 128 });
        if (guildIcon) {
          const icon = await loadImage(guildIcon);
          c.save();
          c.beginPath();
          c.arc(70, 55, 35, 0, Math.PI * 2);
          c.closePath();
          c.clip();
          c.drawImage(icon, 35, 20, 70, 70);
          c.restore();

          // Avatar halkası
          c.strokeStyle = '#FFD700';
          c.lineWidth = 3;
          c.beginPath();
          c.arc(70, 55, 37, 0, Math.PI * 2);
          c.stroke();
        }
      } catch (e) {}

      // Mağaza Adı
      c.fillStyle = '#ffffff';
      c.font = 'bold 30px "Poppins Bold", sans-serif';
      c.textAlign = 'left';
      c.fillText(ctx.guild.name, 125, 50);

      // Slogan
      c.fillStyle = '#FFD700';
      c.font = '16px "Poppins", sans-serif';
      c.fillText(info.slogan || 'Unturned Plugin Store', 125, 75);

      // İstatistik kutuları
      const statsY = 110;
      const statsData = [
        { label: 'Toplam Ürün', value: `${totalProducts}`, icon: '📦' },
        { label: 'Tamamlanan Sipariş', value: `${totalOrders}`, icon: '🛒' },
        { label: 'Müşteri Yorumu', value: `${totalReviews}`, icon: '⭐' },
        { label: 'Üye Sayısı', value: `${ctx.guild.memberCount}`, icon: '👥' }
      ];

      let sx = 25;
      statsData.forEach(stat => {
        // Kutu
        c.fillStyle = 'rgba(255,255,255,0.06)';
        c.beginPath();
        c.roundRect(sx, statsY, 200, 55, 12);
        c.fill();

        c.fillStyle = '#ffffff';
        c.font = '22px Arial';
        c.fillText(stat.icon, sx + 15, statsY + 37);

        c.fillStyle = '#FFD700';
        c.font = 'bold 22px "Poppins Bold", sans-serif';
        c.fillText(stat.value, sx + 50, statsY + 35);

        c.fillStyle = '#aaaaaa';
        c.font = '12px "Inter", sans-serif';
        c.fillText(stat.label, sx + 50, statsY + 50);

        sx += 215;
      });

      // === ÖDEME YÖNTEMLERİ BÖLÜMÜ ===
      const payY = 195;
      c.fillStyle = '#e94560';
      c.font = 'bold 18px "Poppins Bold", sans-serif';
      c.fillText('💳  ÖDEME YÖNTEMLERİ', 30, payY);

      // Ayırıcı çizgi
      c.strokeStyle = 'rgba(233,69,96,0.3)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(30, payY + 8);
      c.lineTo(870, payY + 8);
      c.stroke();

      const payments = [];
      if (info.papara) payments.push({ icon: '💜', label: 'Papara', value: info.papara });
      if (info.iban) payments.push({ icon: '🏦', label: 'IBAN', value: info.iban });
      if (info.paypal) payments.push({ icon: '💙', label: 'PayPal', value: info.paypal });
      if (info.kripto) payments.push({ icon: '🟡', label: 'Kripto', value: info.kripto });

      if (payments.length === 0) {
        payments.push({ icon: '⚠️', label: 'Ödeme bilgisi', value: 'Henüz ayarlanmamış' });
      }

      let py = payY + 30;
      payments.forEach(pay => {
        // Kutu
        c.fillStyle = 'rgba(255,255,255,0.04)';
        c.beginPath();
        c.roundRect(30, py, 840, 40, 8);
        c.fill();

        c.fillStyle = '#ffffff';
        c.font = '18px Arial';
        c.fillText(pay.icon, 45, py + 28);

        c.fillStyle = '#dddddd';
        c.font = 'bold 15px "Poppins SemiBold", sans-serif';
        c.fillText(pay.label, 75, py + 27);

        c.fillStyle = '#FFD700';
        c.font = '15px "Inter", sans-serif';
        c.fillText(pay.value, 200, py + 27);

        py += 48;
      });

      // === SOSYAL MEDYA & İLETİŞİM ===
      const socialY = py + 15;
      c.fillStyle = '#3498db';
      c.font = 'bold 18px "Poppins Bold", sans-serif';
      c.fillText('🌐  SOSYAL MEDYA & İLETİŞİM', 30, socialY);

      c.strokeStyle = 'rgba(52,152,219,0.3)';
      c.beginPath();
      c.moveTo(30, socialY + 8);
      c.lineTo(870, socialY + 8);
      c.stroke();

      const socials = [];
      if (info.instagram) socials.push({ icon: '📸', label: 'Instagram', value: `@${info.instagram}` });
      if (info.youtube) socials.push({ icon: '▶️', label: 'YouTube', value: info.youtube });
      if (info.tiktok) socials.push({ icon: '🎵', label: 'TikTok', value: `@${info.tiktok}` });
      if (info.website) socials.push({ icon: '🌍', label: 'Web Sitesi', value: info.website });
      if (info.calisma_saatleri) socials.push({ icon: '🕐', label: 'Çalışma Saatleri', value: info.calisma_saatleri });

      let sy2 = socialY + 28;
      if (socials.length > 0) {
        // Yatay düzende göster
        let colX = 30;
        socials.forEach((social, i) => {
          c.fillStyle = 'rgba(255,255,255,0.04)';
          c.beginPath();
          c.roundRect(colX, sy2, 260, 38, 8);
          c.fill();

          c.fillStyle = '#ffffff';
          c.font = '16px Arial';
          c.fillText(social.icon, colX + 12, sy2 + 26);

          c.fillStyle = '#3498db';
          c.font = '13px "Poppins SemiBold", sans-serif';
          c.fillText(`${social.label}: `, colX + 38, sy2 + 25);

          c.fillStyle = '#dddddd';
          c.font = '13px "Inter", sans-serif';
          const labelWidth = c.measureText(`${social.label}: `).width;
          c.fillText(social.value, colX + 38 + labelWidth, sy2 + 25);

          colX += 280;
          if ((i + 1) % 3 === 0) {
            colX = 30;
            sy2 += 46;
          }
        });
      }

      // Footer
      c.fillStyle = '#555555';
      c.font = '12px "Inter", sans-serif';
      c.textAlign = 'center';
      c.fillText(`${ctx.guild.name} ⬢ Plugin Store • Sipariş için ticket açınız`, canvas.width / 2, canvas.height - 15);

      const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'magaza-bilgi.png' });
      await ctx.editReply({ files: [attachment] });

    } catch (err) {
      console.error('Mağaza bilgi hatası:', err);

      // Fallback: Canvas yoksa embed ile göster
      await ctx.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`🏪 ${ctx.guild.name}`)
            .setDescription('Mağaza bilgi kartı oluşturulurken bir hata oluştu. Lütfen yöneticiye bildirin.')
            .setColor('#E74C3C')
        ]
      });
    }
  }
};
