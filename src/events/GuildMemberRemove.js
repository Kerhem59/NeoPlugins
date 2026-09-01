const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../Database/SuperCore/JsonManager');
const CanvasBuilder = require('../utils/canvas/CanvasBuilder');

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(member) {
    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', member.guild.id) || {};
    const systemsManager = require('../utils/SystemsManager');

    // --- AUTO BAN ---
    if (systemsManager.isEnabled('autoban')) {
      try {
        // Bot'un kendisini ya da başka botları banlama
        if (member.user.bot) {
          console.log(`[AutoBan] Bot çıkışı, ban uygulanmadı: ${member.user.tag}`);
        } else {
          // Daha önce ban atılmış mı kontrol et
          const bans = await member.guild.bans.fetch().catch(() => null);
          const alreadyBanned = bans?.has(member.id);

          if (!alreadyBanned) {
            await member.guild.members.ban(member.id, {
              reason: `[AutoBan] Sunucudan ayrıldı — ${member.user.tag}`,
            });
            console.log(`[AutoBan] ✅ ${member.user.tag} (${member.id}) banlandı.`);

            // Log kanalına bildir
            if (settings.modLog || settings.logChannel) {
              const logCh = member.guild.channels.cache.get(settings.modLog || settings.logChannel);
              if (logCh) {
                const guildIcon = member.guild.iconURL({ dynamic: true, size: 256 });
                const embed = new EmbedBuilder()
                  .setTitle('🔨 AutoBan — Sunucudan Ayrıldı')
                  .setDescription(`**${member.user.tag}** sunucudan ayrıldığı için otomatik olarak banlandı.`)
                  .addFields(
                    { name: '👤 Kullanıcı', value: `<@${member.id}> (\`${member.id}\`)`, inline: true },
                    { name: '📅 Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '📋 Sebep', value: '`Sunucudan ayrıldı (AutoBan aktif)`', inline: false },
                  )
                  .setColor('#FF3333')
                  .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                  .setFooter({ text: `${member.guild.name} ⬢ AutoBan Sistemi`, iconURL: guildIcon || undefined })
                  .setTimestamp();
                await logCh.send({ embeds: [embed] }).catch(() => {});
              }
            }
          } else {
            console.log(`[AutoBan] ${member.user.tag} zaten banlı, tekrar atlanıyor.`);
          }
        }
      } catch (err) {
        console.error('[AutoBan] Ban hatası:', err.message);
      }
    }

    // --- VEDA MESAJI (Welcome sistemi açıksa) ---
    if (!systemsManager.isEnabled('welcome')) return;

    console.log(`[Leave] Çıkış yapıldı: ${member.user.tag} (ID: ${member.id})`);

    if (settings.leaveChannel) {
      const channel = member.guild.channels.cache.get(settings.leaveChannel);
      if (channel) {
        try {
          const buffer = await CanvasBuilder.createLeaveCard(member);
          const attachment = new AttachmentBuilder(buffer, { name: 'gulegule.png' });

          const leaveText = settings.leaveMessage
            ? settings.leaveMessage
                .replace('{member}', member.user.username)
                .replace('{guild}', member.guild.name)
                .replace('{tag}', member.user.tag)
                .replace('{count}', member.guild.memberCount)
            : `**${member.user.username}** sunucudan ayrıldı. 👋`;

          await channel.send({ content: leaveText, files: [attachment] });
        } catch (err) {
          console.error('[Leave] Canvas ayrılma kartı hatası:', err);
          if (settings.leaveMessage) {
            const fallbackText = settings.leaveMessage
              .replace('{member}', member.user.username)
              .replace('{guild}', member.guild.name)
              .replace('{tag}', member.user.tag)
              .replace('{count}', member.guild.memberCount);
            await channel.send({ content: fallbackText }).catch(() => {});
          }
        }
      }
    }
  }
};