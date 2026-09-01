const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { loadAfkData, setAfk, removeAfk } = require('../../../utils/afk/AfkSystem');
const CanvasBuilder = require('../../../utils/canvas/CanvasBuilder');

module.exports = {
  // Slash Command Data
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('AFK durumunuzu ayarlayın')
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('AFK olma sebebinizi belirtin')
        .setRequired(false)

    ),

  // Prefix Command Data
  name: 'afk',
  subname: ["uzakta"],
  description: 'AFK durumunuzu ayarlayın',
  usage: '[sebep]',

  async execute(ctx) {
    await ctx.deferReply();

    try {
      const afkData = await loadAfkData();
      const user = ctx.user;
      const reason = ctx.getString('sebep') || 'Sebep belirtilmedi';
      const guild = ctx.guild;
      const member = await guild.members.fetch(user.id).catch(() => null);

      if (!member) {
        return ctx.editReply('❌ Kullanıcı bulunamadı.');
      }

      if (afkData[user.id]) {
        const afkResult = await removeAfk(user, guild);

        const buffer = await CanvasBuilder.createAfkRemoveCard(member, afkResult);
        const attachment = new AttachmentBuilder(buffer, { name: 'afk-cikis.png' });

        await ctx.editReply({ files: [attachment] });
        return;
      }

      await setAfk(user, reason, guild);

      const buffer = await CanvasBuilder.createAfkSetCard(member, reason);
      const attachment = new AttachmentBuilder(buffer, { name: 'afk-giris.png' });

      await ctx.editReply({ files: [attachment] });
    } catch (error) {
      console.error('AFK komutu hatası:', error);
      await ctx.editReply('❌ AFK işlemi sırasında bir hata oluştu.').catch(() => { });
    }
  },
};
