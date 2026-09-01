const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('magaza-ayarla')
    .setDescription('Mağaza bilgilerini, ödeme yöntemlerini ve sosyal medya linklerini ayarlar')
    .addStringOption(option =>
      option.setName('papara')
        .setDescription('Papara numarası')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('iban')
        .setDescription('IBAN numarası')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('paypal')
        .setDescription('PayPal e-posta adresi')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('kripto')
        .setDescription('Kripto cüzdan adresi (BTC/USDT)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('instagram')
        .setDescription('Instagram kullanıcı adı')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('youtube')
        .setDescription('YouTube kanal linki')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('tiktok')
        .setDescription('TikTok kullanıcı adı')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('website')
        .setDescription('Web sitesi linki')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('calisma_saatleri')
        .setDescription('Çalışma saatleri (Örn: 10:00 - 22:00)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('slogan')
        .setDescription('Mağaza sloganı')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'magaza-ayarla',
  description: 'Mağaza bilgilerini ayarlar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.' });
    }

    const fields = ['papara', 'iban', 'paypal', 'kripto', 'instagram', 'youtube', 'tiktok', 'website', 'calisma_saatleri', 'slogan'];
    const updates = {};
    let updatedCount = 0;

    for (const field of fields) {
      const value = ctx.options.getString(field);
      if (value !== null) {
        updates[field] = value;
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      return ctx.editReply({ content: '❌ En az bir alan belirtmelisiniz!' });
    }

    try {
      // Mevcut verileri al ve üstüne yaz
      const existing = dbManager.get('store_info', { guild_id: ctx.guild.id });
      if (existing && existing.length > 0) {
        dbManager.upsert('store_info', { guild_id: ctx.guild.id }, updates);
      } else {
        dbManager.insert('store_info', { guild_id: ctx.guild.id, ...updates, created_at: Date.now() });
      }

      const updatedFields = Object.keys(updates).map(k => `✅ **${k}**`).join('\n');

      await ctx.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('✅ Mağaza Bilgileri Güncellendi!')
            .setDescription(`Şu alanlar başarıyla kaydedildi:\n\n${updatedFields}\n\nMüşteriler artık \`/magaza-bilgi\` komutuyla bu bilgileri görebilir.`)
            .setColor('#2ECC71')
        ]
      });

    } catch (err) {
      console.error('Mağaza ayarlama hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
