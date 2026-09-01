const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const giveawayManager = require('../../../utils/GiveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cekilis-yeniden')
    .setDescription('Bitmiş bir çekiliş için yeni bir kazanan belirler (Reroll)')
    .addStringOption(option =>
      option.setName('mesaj_id')
        .setDescription('Yeniden çekilecek çekiliş mesajının ID numarası')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'cekilis-yeniden',
  description: 'Çekilişi yeniden çeker (Reroll)',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const messageId = ctx.options.getString('mesaj_id');
    const res = await giveawayManager.reroll(messageId);

    if (!res.success) {
      return ctx.editReply({ content: `❌ Yeniden çekim başarısız: ${res.message}` });
    }

    const winnerText = res.winners.map(id => `<@${id}>`).join(', ');
    await ctx.editReply({
      content: `🔄 Çekiliş başarıyla yeniden çekildi!\n**Yeni Kazanan(lar):** ${winnerText}`
    });
  }
};
