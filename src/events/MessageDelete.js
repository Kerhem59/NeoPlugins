const { Events, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../Database/SuperCore/JsonManager');

module.exports = {
  name: Events.MessageDelete,
  once: false,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    const jsonManager = new JsonManager();
    const settings = jsonManager.get('server/settings', message.guild.id) || {};
    if (!settings.messageLogChannel) return;

    const channel = message.guild.channels.cache.get(settings.messageLogChannel);
    if (!channel) return;

    const content = message.content || '*İçerik yok (embed/dosya olabilir)*';

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🗑️ Mesaj Silindi')
      .addFields(
        { name: '👤 Yazan', value: `${message.author} (\`${message.author.tag}\`)`, inline: true },
        { name: '📌 Kanal', value: `${message.channel}`, inline: true },
        { name: '📝 İçerik', value: content.length > 1024 ? content.substring(0, 1021) + '...' : content }
      )
      .setFooter({ text: `Kullanıcı ID: ${message.author.id}` })
      .setTimestamp();

    if (message.attachments && message.attachments.size > 0) {
      const attachmentList = message.attachments.map(a => a.url).join('\n');
      embed.addFields({ name: '📎 Ekler', value: attachmentList.substring(0, 1024) });
    }

    await channel.send({ embeds: [embed] }).catch(() => {});
  }
};
