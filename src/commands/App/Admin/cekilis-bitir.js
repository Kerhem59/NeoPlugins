const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const giveawayManager = require('../../../utils/GiveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cekilis-bitir')
    .setDescription('Devam eden bir çekilişi anında sonlandırır ve kazananları açıklar')
    .addStringOption(option =>
      option.setName('mesaj_id')
        .setDescription('Sonlandırılacak çekiliş mesajının ID numarası')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'cekilis-bitir',
  description: 'Çekilişi erken sonlandırır',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const messageId = ctx.options.getString('mesaj_id');
    const winners = await giveawayManager.endGiveaway(messageId);

    if (!winners) {
      return ctx.editReply({
        content: `❌ Çekiliş sonlandırılamadı. Mesaj ID'sini kontrol edin veya çekiliş zaten bitmiş olabilir.`
      });
    }

    const winnerText = winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'Yeterli katılım olmadı';
    await ctx.editReply({
      content: `🎉 Çekiliş başarıyla sonlandırıldı!\n**Kazanan(lar):** ${winnerText}`
    });
  }
};
