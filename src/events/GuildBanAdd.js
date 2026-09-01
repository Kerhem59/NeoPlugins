const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const JsonManager = require('../../Database/SuperCore/JsonManager');

module.exports = {
  name: Events.GuildBanAdd,
  once: false,
  async execute(ban) {
    const jsonManager = new JsonManager();
    const settings = jsonManager.get('server/settings', ban.guild.id) || {};
    if (!settings.modLogChannel) return;

    const channel = ban.guild.channels.cache.get(settings.modLogChannel);
    if (!channel) return;

    let executor = null;
    let reason = ban.reason || 'Belirtilmedi';
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
      const entry = auditLogs.entries.first();
      if (entry && entry.target.id === ban.user.id && (Date.now() - entry.createdTimestamp) < 5000) {
        executor = entry.executor;
        if (entry.reason) reason = entry.reason;
      }
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔨 Üye Yasaklandı (Ban)')
      .addFields(
        { name: '👤 Yasaklanan', value: `${ban.user} (\`${ban.user.tag}\`)`, inline: true },
        { name: '🛡️ Yetkili', value: executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor', inline: true },
        { name: '📋 Sebep', value: reason }
      )
      .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Kullanıcı ID: ${ban.user.id}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
  }
};
