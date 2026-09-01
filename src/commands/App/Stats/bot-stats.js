const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot-stats')
    .setDescription('Botun çalışma istatistiklerini gösterir.'),

  name: 'bot-stats',
  subname: ["botistatistik", "botbilgi"],
  description: 'Bot istatistiklerini gösterir.',

  async execute(ctx) {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    const uptime = process.uptime();
    
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime % 60);
    
    const uptimeString = `${days}g ${hours}s ${minutes}d ${seconds}sn`;

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({ name: ctx.client.user.username, iconURL: ctx.client.user.displayAvatarURL() })
        .addFields(
            { name: '🏓 Gecikme (Ping)', value: `**${ctx.client.ws.ping}ms**`, inline: true },
            { name: '⏱️ Uptime', value: `**${uptimeString}**`, inline: true },
            { name: '💾 RAM Kullanımı', value: `**${memoryUsage.toFixed(2)} MB**`, inline: true },
            { name: '🤖 Bot Sürümü', value: `v${require('../../../../package.json').version}`, inline: true },
            { name: '📚 Kütüphane', value: `Discord.js v${djsVersion}`, inline: true },
            { name: '💻 Node.js', value: process.version, inline: true }
        )
        .setFooter({ text: `İsteyen: ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
        .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
