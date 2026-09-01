const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promosyon-olustur')
    .setDescription('Yeni bir indirim/promosyon kodu oluşturur')
    .addStringOption(option =>
      option.setName('kod')
        .setDescription('Promosyon kodu (Örn: YAZ2026, BAYRAM50)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('indirim')
        .setDescription('İndirim yüzdesi (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maksimum kullanım sayısı (Varsayılan: Sınırsız)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option.setName('bitis')
        .setDescription('Son kullanma tarihi (Örn: 2026-12-31)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'promosyon-olustur',
  description: 'İndirim kodu oluşturur',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.' });
    }

    const code = ctx.options.getString('kod').toUpperCase().replace(/\s/g, '');
    const discount = ctx.options.getInteger('indirim');
    const limit = ctx.options.getInteger('limit') || 0; // 0 = sınırsız
    const expiresAt = ctx.options.getString('bitis') || null;

    const existing = dbManager.get('promo_codes', { guild_id: ctx.guild.id, code: code });
    if (existing && existing.length > 0) {
      return ctx.editReply({ content: `❌ **${code}** kodu zaten mevcut! Lütfen farklı bir kod deneyin.` });
    }

    let expiresTimestamp = null;
    if (expiresAt) {
      const parsedDate = new Date(expiresAt);
      if (isNaN(parsedDate.getTime())) {
        return ctx.editReply({ content: '❌ Geçersiz tarih formatı! Lütfen `YYYY-MM-DD` formatında girin.' });
      }
      if (parsedDate.getTime() < Date.now()) {
        return ctx.editReply({ content: '❌ Son kullanma tarihi geçmişte olamaz!' });
      }
      expiresTimestamp = parsedDate.getTime();
    }

    try {
      dbManager.insert('promo_codes', {
        guild_id: ctx.guild.id,
        code: code,
        discount: discount,
        max_uses: limit,
        used_count: 0,
        used_by: JSON.stringify([]),
        expires_at: expiresTimestamp,
        status: 'Active',
        created_by: ctx.user.id,
        created_at: Date.now()
      });

      const container = new ContainerBuilder();
      container.setAccentColor(0x9B59B6);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### 🎟️ Promosyon Kodu Oluşturuldu!')
      );
      
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      const limitText = limit > 0 ? `${limit} kişi` : 'Sınırsız';
      const expireText = expiresAt ? `\`${expiresAt}\`` : 'Süresiz';

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**🏷️ Kod:** \`${code}\`\n**💰 İndirim:** %${discount}\n**👥 Kullanım Limiti:** ${limitText}\n**📅 Son Kullanma:** ${expireText}`)
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**📢 Paylaşım Önerisi:**\nDuyuru kanallarına veya sosyal medyada bu kodu paylaşabilirsiniz:\n\`\`\`🎉 %${discount} İNDİRİM! Kod: ${code}\`\`\``)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} Promosyon Sistemi`)
      );

      await ctx.editReply({ components: [container.toJSON()] });

    } catch (err) {
      console.error('Promosyon oluşturma hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
