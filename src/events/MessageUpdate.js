const { Events, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../Database/SuperCore/JsonManager');

module.exports = {
  name: Events.MessageUpdate,
  once: false,
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const jsonManager = new JsonManager();
    const settings = jsonManager.get('server/settings', newMessage.guild.id) || {};
    if (!settings.messageLogChannel) return;

    const channel = newMessage.guild.channels.cache.get(settings.messageLogChannel);
    if (!channel) return;

    const oldContent = oldMessage.content || '*Boş*';
    const newContent = newMessage.content || '*Boş*';

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('✏️ Mesaj Düzenlendi')
      .addFields(
        { name: '👤 Yazan', value: `${newMessage.author} (\`${newMessage.author.tag}\`)`, inline: true },
        { name: '📌 Kanal', value: `${newMessage.channel}`, inline: true },
        { name: '📝 Eski İçerik', value: oldContent.length > 1024 ? oldContent.substring(0, 1021) + '...' : oldContent },
        { name: '📝 Yeni İçerik', value: newContent.length > 1024 ? newContent.substring(0, 1021) + '...' : newContent }
      )
      .setFooter({ text: `Mesaj ID: ${newMessage.id}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  }
};
