const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guncelleme-duyur')
    .setDescription('Bir ürünü satın alan tüm müşterilere otomatik güncelleme mesajı (DM) atar')
    .addStringOption(option =>
      option.setName('urun')
        .setDescription('Güncelleme duyurusu yapılacak ürünün adı (Büyük/küçük harf duyarlıdır)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('versiyon')
        .setDescription('Yeni Sürüm (Örn: v2.1.0)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Güncelleme notları (Neler değişti?)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'guncelleme-duyur',
  description: 'Müşterilere toplu güncelleme duyurusu yapar',

  async execute(ctx) {
    // Toplu mesajlaşma uzun sürebilir, deferReply yapıyoruz
    await ctx.deferReply();

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.' });
    }

    const product = ctx.options.getString('urun');
    const version = ctx.options.getString('versiyon');
    const message = ctx.options.getString('mesaj');

    try {
      // Siparişleri bul (Sadece o ürünü alanlar)
      const allOrders = dbManager.get('customer_orders', { guild_id: ctx.guild.id });
      
      if (!allOrders || allOrders.length === 0) {
        return ctx.editReply({ content: '❌ Veritabanında hiçbir sipariş kaydı bulunamadı.' });
      }

      // Aynı ürünü alan benzersiz (unique) kullanıcı ID'lerini topla
      const targetUserIds = new Set();
      allOrders.forEach(order => {
        if (order.product_name && order.product_name.toLowerCase() === product.toLowerCase()) {
          targetUserIds.add(order.user_id);
        }
      });

      if (targetUserIds.size === 0) {
        return ctx.editReply({ 
          content: `❌ **${product}** ürününü satın alan herhangi bir müşteri kaydı bulunamadı.` 
        });
      }

      const updateEmbed = new EmbedBuilder()
        .setTitle(`🚀 ${product} Güncellendi! [${version}]`)
        .setDescription(
          `Merhaba!\nSatın almış olduğunuz **${product}** eklentisi için yeni bir güncelleme yayınlandı.\n\n` +
          `📝 **Güncelleme Notları:**\n${message}\n\n` +
          `Güncel dosyaları teslim almak için lütfen sunucumuz üzerinden sipariş ticket'ınızı tekrar açın veya yetkililerle iletişime geçin.`
        )
        .setColor('#3498db')
        .setThumbnail(ctx.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `${ctx.guild.name} ⬢ Müşteri Bilgilendirme Sistemi`, iconURL: ctx.client.user.displayAvatarURL() })
        .setTimestamp();

      let successCount = 0;
      let failCount = 0;

      // Tüm kullanıcılara DM at
      for (const userId of targetUserIds) {
        try {
          const user = await ctx.client.users.fetch(userId);
          await user.send({ embeds: [updateEmbed] });
          successCount++;
        } catch (e) {
          failCount++;
        }
      }

      const resultEmbed = new EmbedBuilder()
        .setTitle('✅ Toplu Güncelleme Duyurusu Tamamlandı!')
        .addFields(
          { name: '📦 Ürün', value: `\`${product}\``, inline: true },
          { name: '📌 Sürüm', value: `\`${version}\``, inline: true },
          { name: '📊 Sonuç', value: `✅ Başarılı: **${successCount}** kişi\n❌ Başarısız (DM Kapalı): **${failCount}** kişi`, inline: false }
        )
        .setColor('#2ECC71');

      await ctx.editReply({ embeds: [resultEmbed] });

    } catch (err) {
      console.error('Güncelleme duyurusu hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
