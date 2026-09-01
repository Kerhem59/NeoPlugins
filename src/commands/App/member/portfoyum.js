const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const path = require('path');

// Font kaydı
try {
  const fontsDir = path.join(__dirname, '../../../utils/canvas/fonts');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Bold.ttf'), 'Poppins Bold');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Regular.ttf'), 'Poppins');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Inter-Variable.ttf'), 'Inter');
} catch (e) {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('portfoyum')
    .setDescription('Tüm satın aldığınız ürünleri, lisansları ve sadakat puanınızı görüntüleyin'),

  name: 'portfoyum',
  description: 'Müşteri portföyünü görüntüler',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    try {
      const userId = ctx.user.id;
      const guildId = ctx.guild.id;

      // Verileri topla
      const orders = dbManager.get('customer_orders', { guild_id: guildId, user_id: userId }) || [];
      const licenses = dbManager.get('licenses', { user_id: userId }) || [];
      const loyaltyData = dbManager.get('loyalty', { guild_id: guildId, user_id: userId });
      const loyalty = loyaltyData && loyaltyData.length > 0 ? loyaltyData[0] : null;
      const reviews = dbManager.get('reviews', { guild_id: guildId, user_id: userId }) || [];

      if (orders.length === 0 && licenses.length === 0) {
        return ctx.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('📋 Portföyünüz')
              .setDescription('Henüz bir ürün satın almamışsınız. Mağazamıza göz atarak ilk alışverişinizi yapabilirsiniz!')
              .setColor('#E74C3C')
          ]
        });
      }

      // Canvas ile Portföy Kartı
      const rowHeight = 40;
      const headerHeight = 180;
      const itemCount = Math.max(orders.length, 1);
      const canvasHeight = headerHeight + (itemCount * rowHeight) + 80;
      const canvas = createCanvas(900, Math.min(canvasHeight, 600));
      const c = canvas.getContext('2d');

      // Arka plan gradient
      const bg = c.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, '#0f0c29');
      bg.addColorStop(0.5, '#302b63');
      bg.addColorStop(1, '#24243e');
      c.fillStyle = bg;
      c.fillRect(0, 0, canvas.width, canvas.height);

      // Kenarlık
      c.strokeStyle = '#FFD700';
      c.lineWidth = 3;
      c.roundRect(5, 5, canvas.width - 10, canvas.height - 10, 15);
      c.stroke();

      // Avatar
      c.save();
      c.beginPath();
      c.arc(70, 70, 40, 0, Math.PI * 2);
      c.closePath();
      c.clip();
      const avatar = await loadImage(ctx.user.displayAvatarURL({ extension: 'png', size: 128 }));
      c.drawImage(avatar, 30, 30, 80, 80);
      c.restore();

      // İsim
      c.fillStyle = '#ffffff';
      c.font = 'bold 28px "Poppins Bold", sans-serif';
      c.textAlign = 'left';
      c.fillText(ctx.user.username, 130, 60);

      // Başlık alt yazısı
      c.fillStyle = '#aaaaaa';
      c.font = '16px "Inter", sans-serif';
      c.fillText('Müşteri Portföyü', 130, 85);

      // İstatistik kutuları
      const points = loyalty ? loyalty.points : 0;
      const isVip = points >= 30;
      const stats = [
        { label: 'Alışveriş', value: `${orders.length}`, icon: '🛒' },
        { label: 'Lisans', value: `${licenses.length}`, icon: '🔑' },
        { label: 'Puan', value: `${points}`, icon: '⭐' },
        { label: 'Yorum', value: `${reviews.length}`, icon: '💬' }
      ];

      let statX = 30;
      stats.forEach(stat => {
        // Kutu
        c.fillStyle = 'rgba(255,255,255,0.08)';
        c.beginPath();
        c.roundRect(statX, 120, 200, 45, 10);
        c.fill();

        c.fillStyle = '#FFD700';
        c.font = '20px Arial';
        c.fillText(stat.icon, statX + 12, 150);

        c.fillStyle = '#ffffff';
        c.font = 'bold 18px "Poppins Bold", sans-serif';
        c.fillText(stat.value, statX + 42, 148);

        c.fillStyle = '#aaaaaa';
        c.font = '13px "Inter", sans-serif';
        c.fillText(stat.label, statX + 80, 148);

        statX += 215;
      });

      // VIP Badge
      if (isVip) {
        c.fillStyle = '#FFD700';
        c.beginPath();
        c.roundRect(canvas.width - 130, 40, 100, 30, 15);
        c.fill();
        c.fillStyle = '#000000';
        c.font = 'bold 14px "Poppins Bold", sans-serif';
        c.textAlign = 'center';
        c.fillText('👑 VIP', canvas.width - 80, 61);
        c.textAlign = 'left';
      }

      // Ürün Listesi
      let y = headerHeight + 10;
      c.fillStyle = '#FFD700';
      c.font = 'bold 16px "Poppins Bold", sans-serif';
      c.fillText('📦 Satın Alınan Ürünler', 30, y);
      y += 10;

      const displayOrders = orders.slice(0, 8); // Max 8 ürün göster
      displayOrders.forEach((order, i) => {
        y += rowHeight;
        
        // Satır arkaplanı (alternatif)
        if (i % 2 === 0) {
          c.fillStyle = 'rgba(255,255,255,0.03)';
          c.fillRect(20, y - 25, canvas.width - 40, rowHeight);
        }

        c.fillStyle = '#ffffff';
        c.font = '15px "Inter", sans-serif';
        c.fillText(`${i + 1}. ${order.product_name || 'Bilinmeyen Ürün'}`, 40, y);

        c.fillStyle = '#2ECC71';
        c.font = '15px "Inter", sans-serif';
        const priceText = order.price || '—';
        c.fillText(priceText, canvas.width - 200, y);

        const dateText = order.created_at ? new Date(order.created_at).toLocaleDateString('tr-TR') : '—';
        c.fillStyle = '#888888';
        c.font = '13px "Inter", sans-serif';
        c.fillText(dateText, canvas.width - 100, y);
      });

      if (orders.length > 8) {
        y += rowHeight;
        c.fillStyle = '#888888';
        c.font = 'italic 14px "Inter", sans-serif';
        c.fillText(`... ve ${orders.length - 8} ürün daha`, 40, y);
      }

      // Footer
      c.fillStyle = '#555555';
      c.font = '12px "Inter", sans-serif';
      c.textAlign = 'center';
      c.fillText(`${ctx.guild.name} ⬢ Müşteri Portföyü`, canvas.width / 2, canvas.height - 15);

      const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'portfoy.png' });
      await ctx.editReply({ files: [attachment] });

    } catch (err) {
      console.error('Portföy kartı hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
