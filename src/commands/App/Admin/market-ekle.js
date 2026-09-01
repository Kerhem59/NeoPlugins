const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market-ekle')
    .setDescription('Quiz Markete coin ile kazanılabilir bir ürün/ödül ekler')
    .addStringOption(option =>
      option.setName('urun')
        .setDescription('Ödül olarak verilecek ürünün adı')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('fiyat')
        .setDescription('Coin fiyatı (Kaç coin\'e kazanılabilir?)')
        .setRequired(true)
        .setMinValue(10)
    )
    .addIntegerOption(option =>
      option.setName('stok')
        .setDescription('Kaç adet kazanılabilir? (0 = Sınırsız)')
        .setRequired(false)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option.setName('aciklama')
        .setDescription('Ödül hakkında kısa açıklama')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'market-ekle',
  description: 'Markete ödül ekler',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.' });
    }

    const product = ctx.options.getString('urun');
    const price = ctx.options.getInteger('fiyat');
    const stock = ctx.options.getInteger('stok') || 0;
    const description = ctx.options.getString('aciklama') || '';

    try {
      dbManager.insert('quiz_market', {
        guild_id: ctx.guild.id,
        product: product,
        price: price,
        stock: stock,
        claimed: 0,
        description: description,
        status: 'Active',
        created_by: ctx.user.id,
        created_at: Date.now()
      });

      const container = new ContainerBuilder();
      container.setAccentColor(0x2ECC71);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### ✅ Market Ödülü Eklendi!')
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      const stockText = stock > 0 ? `${stock} adet` : 'Sınırsız';
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**🎁 Ödül:** \`${product}\`\n**💰 Coin Fiyatı:** ${price.toLocaleString()} coin\n**📦 Stok:** ${stockText}`)
      );

      if (description) {
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`📝 **Açıklama:** ${description}`)
        );
      }

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ Kullanıcılar /market komutuyla bu ödülü görebilir`)
      );

      await ctx.editReply({ components: [container.toJSON()] });

    } catch (err) {
      console.error('Market ekleme hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
