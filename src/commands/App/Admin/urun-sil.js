const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('urun-sil')
    .setDescription('Mağazadan belirtilen Unturned pluginini kaldırır')
    .addStringOption(option =>
      option.setName('isim')
        .setDescription('Silinecek plugin veya ürünün tam adı')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'urun-sil',
  description: 'Mağazadan ürün siler',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const name = ctx.options.getString('isim');

    try {
      const allProducts = dbManager.get('store_products', { guild_id: guild.id });
      const targetProduct = allProducts.find(p => p.name.toLowerCase() === name.toLowerCase());

      if (!targetProduct) {
        return ctx.editReply({ content: `❌ **${name}** isimli bir ürün mağazada bulunamadı.` });
      }

      dbManager.delete('store_products', { id: targetProduct.id });

      await ctx.editReply({
        content: `✅ **${targetProduct.name}** ürünü mağazadan başarıyla silindi.`
      });

    } catch (err) {
      console.error('urun-sil error:', err);
      await ctx.editReply({ content: `❌ Ürün silinirken hata oluştu: ${err.message}` });
    }
  }
};
