const { SlashCommandBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promosyon-sorgula')
    .setDescription('Bir promosyon kodunun geçerliliğini ve indirim oranını kontrol eder')
    .addStringOption(option =>
      option.setName('kod')
        .setDescription('Kontrol edilecek promosyon kodu')
        .setRequired(true)
    ),

  name: 'promosyon-sorgula',
  description: 'Promosyon kodunu kontrol eder',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    const code = ctx.options.getString('kod').toUpperCase().replace(/\s/g, '');

    try {
      const results = dbManager.get('promo_codes', { guild_id: ctx.guild.id, code: code });
      const promo = results && results.length > 0 ? results[0] : null;

      const container = new ContainerBuilder();

      if (!promo) {
        container.setAccentColor(0xE74C3C);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('### ❌ Geçersiz Kod\n\n\`' + code + '\` adlı bir promosyon kodu bulunamadı.'));
        return ctx.editReply({ components: [container.toJSON()] });
      }

      let status = '✅ Aktif';
      let statusColor = 0x2ECC71;

      if (promo.status !== 'Active') {
        status = '🚫 Devre Dışı';
        statusColor = 0xE74C3C;
      } else if (promo.expires_at && promo.expires_at < Date.now()) {
        status = '⏰ Süresi Dolmuş';
        statusColor = 0xE67E22;
      } else if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) {
        status = '🔒 Limit Doldu';
        statusColor = 0xE67E22;
      }

      const remainingUses = promo.max_uses > 0 ? `${promo.max_uses - promo.used_count} / ${promo.max_uses} kalan` : 'Sınırsız';
      const expiresText = promo.expires_at ? `<t:${Math.floor(promo.expires_at / 1000)}:R>` : 'Süresiz';

      container.setAccentColor(statusColor);
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🎟️ Promosyon Kodu: ${code}`)
      );
      
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**📊 Durum:** ${status}\n**💰 İndirim:** %${promo.discount}\n**👥 Kalan Kullanım:** ${remainingUses}\n**📅 Son Kullanma:** ${expiresText}`)
      );

      if (status === '✅ Aktif') {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`> Bu kodu sipariş sırasında yetkiliye ileterek indiriminizi kullanabilirsiniz!`)
        );
      }

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} Promosyon Sistemi`)
      );

      await ctx.editReply({ components: [container.toJSON()] });

    } catch (err) {
      console.error('Promosyon sorgulama hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
