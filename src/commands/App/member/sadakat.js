const { SlashCommandBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

const VIP_THRESHOLD = 30;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sadakat')
    .setDescription('Sadakat puanınızı, VIP durumunuzu ve kazandığınız avantajları görüntüleyin'),

  name: 'sadakat',
  description: 'Sadakat puanınızı görüntüler',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    try {
      const loyaltyData = dbManager.get('loyalty', { guild_id: ctx.guild.id, user_id: ctx.user.id });
      const userData = loyaltyData && loyaltyData.length > 0 ? loyaltyData[0] : null;

      const points = userData ? userData.points : 0;
      const totalPurchases = userData ? userData.total_purchases : 0;
      const isVip = points >= VIP_THRESHOLD;
      const remaining = isVip ? 0 : VIP_THRESHOLD - points;

      const progressPercent = Math.min(100, Math.round((points / VIP_THRESHOLD) * 100));
      const filledBlocks = Math.round(progressPercent / 5);
      const emptyBlocks = 20 - filledBlocks;
      const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

      const container = new ContainerBuilder();
      container.setAccentColor(isVip ? 0xFFD700 : 0x3498DB);

      // Thumbnail yerine MediaGallery kullanabiliriz veya TextDisplay'e link verebiliriz.
      // Ancak Discord API Container içinde sağ üst thumbnail henüz tam desteklemediği için başlık yanına URL verebiliriz.

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(isVip ? '### 👑 VIP Müşteri Paneli' : '### 🏆 Sadakat Programı')
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      const desc = isVip
        ? `Tebrikler **${ctx.user.username}**! Siz **👑 VIP Müşteri** statüsündesiniz.\n\n` +
          `**Avantajlarınız:**\n` +
          `✅ Tüm ürünlerde **%10 kalıcı indirim**\n` +
          `✅ **Öncelikli destek** hakkı\n` +
          `✅ Yeni ürünlere **erken erişim**\n` +
          `✅ Özel **VIP** rozeti`
        : `Merhaba **${ctx.user.username}**! Sadakat programımıza hoş geldiniz.\n\n` +
          `Her satın alımda **+10 puan** kazanırsınız.\n` +
          `**${VIP_THRESHOLD}** puana ulaştığınızda otomatik olarak **👑 VIP** olursunuz!`;

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(desc));
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**⭐ Sadakat Puanı:** ${points} puan\n**🛒 Toplam Alışveriş:** ${totalPurchases} ürün\n**🎯 VIP Durumu:** ${isVip ? '👑 VIP Müşteri' : remaining + ' puan kaldı'}`)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**📊 İlerleme [${progressPercent}%]**\n\`${progressBar}\` **${points}**/${VIP_THRESHOLD}`)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} Sadakat Programı`)
      );

      await ctx.editReply({ components: [container.toJSON()] });

    } catch (err) {
      console.error('Sadakat sorgulama hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
