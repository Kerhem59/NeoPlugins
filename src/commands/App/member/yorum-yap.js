const { SlashCommandBuilder, AttachmentBuilder, ChannelType } = require('discord.js');
const { GlobalFonts, createCanvas, loadImage } = require('@napi-rs/canvas');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

// Basit bir font kaydı (Sistemde yoksa varsayılan kullanır)
try {
  GlobalFonts.registerFromPath('./node_modules/@napi-rs/canvas/fonts/Inter-Medium.ttf', 'Inter');
} catch (e) {}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yorum-yap')
    .setDescription('Satın aldığınız bir ürün için onaylı müşteri yorumu bırakın')
    .addStringOption(option =>
      option.setName('urun')
        .setDescription('Yorum yaptığınız ürünün adı')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('puan')
        .setDescription('Ürüne vereceğiniz puan (1-5)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Değerlendirmeniz ve yorumunuz')
        .setRequired(true)
    ),

  name: 'yorum-yap',
  description: 'Canvas tabanlı görsel müşteri yorumu oluşturur',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    const guild = ctx.guild;
    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', guild.id) || {};

    let customerRoleId = settings.customerRole;
    if (!customerRoleId) {
      const foundRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('müşteri') || r.name.toLowerCase().includes('musteri'));
      if (foundRole) customerRoleId = foundRole.id;
    }

    if (!customerRoleId || !ctx.member.roles.cache.has(customerRoleId)) {
      return ctx.editReply({
        content: '❌ Yalnızca **Onaylı Müşteriler** (ürün satın almış kişiler) yorum yapabilir.'
      });
    }

    const product = ctx.options.getString('urun');
    const rating = ctx.options.getInteger('puan');
    const message = ctx.options.getString('mesaj');

    // Yorum Kanalını Bul
    let reviewChannel = guild.channels.cache.find(c => c.name.includes('musteri-yorum') || c.name.includes('müşteri-yorum'));
    
    if (!reviewChannel) {
      return ctx.editReply({
        content: '❌ Yorum kanalı bulunamadı. (İsminde `musteri-yorum` geçen bir kanal olmalı).'
      });
    }

    try {
      // Veritabanına Kaydet
      dbManager.insert('reviews', {
        guild_id: guild.id,
        user_id: ctx.user.id,
        product: product,
        rating: rating,
        message: message,
        created_at: Date.now()
      });

      // CANVAS İLE KART OLUŞTURMA
      const canvas = createCanvas(800, 250);
      const c = canvas.getContext('2d');

      // Arka plan
      c.fillStyle = '#1e2124'; // Koyu Discord Teması
      c.roundRect(0, 0, canvas.width, canvas.height, 20);
      c.fill();

      // Kenarlık
      c.strokeStyle = '#2ECC71';
      c.lineWidth = 5;
      c.roundRect(2.5, 2.5, canvas.width - 5, canvas.height - 5, 20);
      c.stroke();

      // Avatar Çizimi
      c.save();
      c.beginPath();
      c.arc(90, 90, 50, 0, Math.PI * 2, true);
      c.closePath();
      c.clip();

      const avatarURL = ctx.user.displayAvatarURL({ extension: 'png', size: 128 });
      const avatar = await loadImage(avatarURL);
      c.drawImage(avatar, 40, 40, 100, 100);
      c.restore();

      // Onaylı Müşteri Badge
      c.fillStyle = '#2ECC71';
      c.roundRect(30, 160, 120, 30, 15);
      c.fill();
      c.fillStyle = '#ffffff';
      c.font = '16px "Inter", sans-serif';
      c.textAlign = 'center';
      c.fillText('Onaylı Müşteri', 90, 181);

      // Kullanıcı Adı
      c.textAlign = 'left';
      c.fillStyle = '#ffffff';
      c.font = 'bold 26px "Inter", sans-serif';
      c.fillText(ctx.user.username, 160, 70);

      // Ürün Adı
      c.fillStyle = '#aaaaaa';
      c.font = '20px "Inter", sans-serif';
      c.fillText(`Ürün: ${product}`, 160, 100);

      // Yıldızlar (Elle çizim - Unicode sorununu çözer)
      const drawStar = (cx, cy, outerR, innerR, points, ctx2) => {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / points;
        ctx2.beginPath();
        ctx2.moveTo(cx, cy - outerR);
        for (let i = 0; i < points; i++) {
          let xp = cx + Math.cos(rot) * outerR;
          let yp = cy + Math.sin(rot) * outerR;
          ctx2.lineTo(xp, yp);
          rot += step;
          xp = cx + Math.cos(rot) * innerR;
          yp = cy + Math.sin(rot) * innerR;
          ctx2.lineTo(xp, yp);
          rot += step;
        }
        ctx2.lineTo(cx, cy - outerR);
        ctx2.closePath();
      };

      for (let i = 0; i < 5; i++) {
        const sx = canvas.width - 180 + (i * 32);
        const sy = 62;
        drawStar(sx, sy, 14, 6, 5, c);
        if (i < rating) {
          c.fillStyle = '#F1C40F';
          c.fill();
        } else {
          c.strokeStyle = '#555555';
          c.lineWidth = 1.5;
          c.stroke();
        }
      }

      // Mesaj (Word Wrap Basit)
      c.fillStyle = '#dddddd';
      c.font = 'italic 18px "Inter", sans-serif';
      
      const maxWidth = 600;
      const words = message.split(' ');
      let line = '';
      let y = 140;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = c.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          c.fillText(line, 160, y);
          line = words[n] + ' ';
          y += 25;
        } else {
          line = testLine;
        }
      }
      c.fillText(line, 160, y);

      const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'review.png' });

      await reviewChannel.send({
        content: `🎉 **${ctx.user}**, \`${product}\` ürünü için yeni bir değerlendirme bıraktı!`,
        files: [attachment]
      });

      await ctx.editReply({
        content: `✅ Yorumunuz başarıyla <#${reviewChannel.id}> kanalına gönderildi. Teşekkür ederiz!`
      });

    } catch (err) {
      console.error('Yorum oluşturma hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
