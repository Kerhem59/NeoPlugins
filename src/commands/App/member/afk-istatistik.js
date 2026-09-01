const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { getAfkStats } = require('../../../utils/afk/AfkSystem');
const CanvasBuilder = require('../../../utils/canvas/CanvasBuilder');

module.exports = {
  // Slash Command Data
  data: new SlashCommandBuilder()
    .setName('afk-istatistik')
    .setDescription('AFK istatistiklerinizi görüntüleyin')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('İstatistiklerini görmek istediğiniz kullanıcı')
        .setRequired(false)
    ),

  // Prefix Command Data
  name: 'afk-istatistik',
  subname: ['afkstat', 'afkstats', 'afk-stat'],
  description: 'AFK istatistiklerinizi görüntüleyin',
  usage: '[@kullanıcı]',

  async execute(ctx) {
    await ctx.deferReply();

    try {
      const targetUser = ctx.getUser('kullanıcı', 0) || ctx.user;
      const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return ctx.editReply('❌ Kullanıcı bulunamadı.');
      }

      const stats = await getAfkStats(targetUser.id);
      const buffer = await CanvasBuilder.createAfkStatsCard(member, stats);
      const attachment = new AttachmentBuilder(buffer, { name: 'afk-istatistik.png' });

      await ctx.editReply({ files: [attachment] });
    } catch (error) {
      console.error('AFK İstatistik komutu hatası:', error);
      await ctx.editReply('❌ AFK istatistik kartı oluşturulurken bir hata oluştu.').catch(() => {});
    }
  },
};
