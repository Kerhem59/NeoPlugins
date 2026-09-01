const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const ServerQuery = require('../../../utils/ServerQuery');
const CanvasBuilder = require('../../../utils/canvas/CanvasBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucum')
    .setDescription('Unturned sunucunuzun anlık durumunu şık bir afiş ile görüntüler'),

  name: 'sunucum',
  description: 'Kayıtlı sunucunuzun durumunu gösterir',

  async execute(ctx) {
    await ctx.deferReply();

    try {
      const records = dbManager.get('customer_servers', { guild_id: ctx.guild.id, user_id: ctx.user.id });
      const record = records && records.length > 0 ? records[0] : null;

      if (!record) {
        const container = new ContainerBuilder();
        container.setAccentColor(0xE74C3C);
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('### ❌ Kayıtlı Sunucu Bulunamadı\n\nHenüz bir sunucu eklememişsiniz.\nKullanım: `/sunucumu-ekle [ip] [port]`')
        );
        return ctx.editReply({ components: [container.toJSON()] });
      }

      // Sunucuyu sorgula
      let serverData;
      try {
        serverData = await ServerQuery.query(record.ip, record.query_port || record.port + 1, 3000);
        serverData.ip = record.ip;
        serverData.port = record.port;
      } catch (e) {
        // Sunucu kapalı olabilir
        serverData = {
          name: record.last_name || 'Bilinmeyen Sunucu',
          ip: record.ip,
          port: record.port,
          players: 0,
          maxPlayers: 0,
          map: '-',
          ping: 0,
          isOnline: false
        };
      }

      // Canvas kartı çiz
      const avatarUrl = ctx.user.displayAvatarURL({ extension: 'png', size: 128 });
      const buffer = await CanvasBuilder.createServerStatusCard(serverData, ctx.user.username, avatarUrl);
      const attachment = new AttachmentBuilder(buffer, { name: 'server-status.png' });

      await ctx.editReply({ files: [attachment] });

    } catch (err) {
      console.error('Sunucu durumu hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
