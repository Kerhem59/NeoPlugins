const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market-onayla')
    .setDescription('Bekleyen market siparişlerini listeler veya onaylar/teslim eder')
    .addSubcommand(sub =>
      sub.setName('liste')
        .setDescription('Bekleyen market taleplerini listeler')
    )
    .addSubcommand(sub =>
      sub.setName('teslim-et')
        .setDescription('Bir market talebini onaylar ve kullanıcıya teslim edildi bilgisini atar')
        .addUserOption(option =>
          option.setName('kullanici')
            .setDescription('Talebi onaylanacak kullanıcı')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'market-onayla',
  description: 'Market taleplerini onaylar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.' });
    }

    const sub = ctx.options.getSubcommand();

    if (sub === 'liste') {
      const allRedeems = dbManager.get('quiz_redeems', { guild_id: ctx.guild.id, status: 'Pending' }) || [];

      if (allRedeems.length === 0) {
        return ctx.editReply({ content: '✅ Şu anda bekleyen market talebi bulunmuyor.' });
      }

      const container = new ContainerBuilder();
      container.setAccentColor(0xE67E22);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### 📋 Bekleyen Market Talepleri')
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      let desc = '';
      allRedeems.forEach((redeem, index) => {
        desc += `**${index + 1}.** <@${redeem.user_id}> ─ **${redeem.product}** (${redeem.price} Coin)\n`;
      });

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(desc)
      );

      await ctx.editReply({ components: [container.toJSON()] });

    } else if (sub === 'teslim-et') {
      const targetUser = ctx.options.getUser('kullanici');
      
      const userRedeems = dbManager.get('quiz_redeems', { guild_id: ctx.guild.id, user_id: targetUser.id, status: 'Pending' }) || [];

      if (userRedeems.length === 0) {
        return ctx.editReply({ content: `❌ <@${targetUser.id}> adlı kullanıcının bekleyen bir talebi bulunmuyor.` });
      }

      const oldestRedeem = userRedeems.sort((a, b) => a.created_at - b.created_at)[0];

      try {
        dbManager.upsert('quiz_redeems', 
          { guild_id: ctx.guild.id, user_id: targetUser.id, product: oldestRedeem.product, created_at: oldestRedeem.created_at },
          { status: 'Delivered', delivered_by: ctx.user.id, delivered_at: Date.now() }
        );

        try {
          const dmContainer = new ContainerBuilder();
          dmContainer.setAccentColor(0x2ECC71);
          dmContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### 🎁 Ödülünüz Teslim Edildi!\n\nTebrikler! **${ctx.guild.name}** sunucusundan aldığınız \`${oldestRedeem.product}\` ödülü onaylandı ve size teslim edildi.\n\nYetkililerimiz ilgili dosyaları/kodları size bu DM üzerinden veya ticket üzerinden iletecektir.`)
          );

          await targetUser.send({ components: [dmContainer.toJSON()] });
        } catch (e) {
          console.warn('Market teslim DM atılamadı:', e);
        }

        await ctx.editReply({ content: `✅ <@${targetUser.id}> adlı kullanıcının **${oldestRedeem.product}** talebi onaylandı!` });

      } catch (err) {
        console.error('Market onaylama hatası:', err);
        await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
      }
    }
  }
};
