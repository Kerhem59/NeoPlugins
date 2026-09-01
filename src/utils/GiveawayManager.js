const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const dbManager = require('../../Database/SuperCore/JsonDatabaseManager');

class GiveawayManager {
  constructor() {
    this.interval = null;
  }

  init(client) {
    this.client = client;
    if (this.interval) clearInterval(this.interval);

    // Her 10 saniyede bir biten çekilişleri kontrol et
    this.interval = setInterval(() => this.checkGiveaways(), 10000);
    this.checkGiveaways();
    console.log('🎁 [SİSTEM] Çekiliş Yöneticisi (GiveawayManager) aktif.');
  }

  parseDuration(str) {
    if (!str) return null;
    const regex = /^(\d+)\s*(s|m|h|d|w|sn|dk|sa|gun|hafta)?$/i;
    const match = str.trim().match(regex);
    if (!match) return null;

    const val = parseInt(match[1], 10);
    const unit = (match[2] || 'm').toLowerCase();

    switch (unit) {
      case 's':
      case 'sn':
        return val * 1000;
      case 'm':
      case 'dk':
        return val * 60 * 1000;
      case 'h':
      case 'sa':
        return val * 60 * 60 * 1000;
      case 'd':
      case 'gun':
        return val * 24 * 60 * 60 * 1000;
      case 'w':
      case 'hafta':
        return val * 7 * 24 * 60 * 60 * 1000;
      default:
        return val * 60 * 1000;
    }
  }

  createEmbed(data, isEnded = false, winners = []) {
    const endTimestamp = Math.floor(data.end_time / 1000);
    const count = data.participants ? (typeof data.participants === 'string' ? JSON.parse(data.participants) : data.participants).length : 0;

    let desc = '';
    if (isEnded) {
      const winnerText = winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'Yeterli katılım olmadı.';
      desc =
        `### 🎉 Çekiliş Sona Erdi!\n\n` +
        `🏆 **Kazanan(lar):** ${winnerText}\n` +
        `🎁 **Ödül:** \`${data.prize}\`\n` +
        `👤 **Düzenleyen:** <@${data.host_id}>\n` +
        `👥 **Toplam Katılımcı:** \`${count} kişi\`\n` +
        (data.description ? `\n📝 **Açıklama:** ${data.description}\n` : '');
    } else {
      desc =
        `### 🎁 ${data.prize}\n\n` +
        `Çekilişe katılmak için aşağıdaki **"🎉 Çekilişe Katıl"** butonuna basmanız yeterlidir!\n\n` +
        `⏱️ **Bitiş Zamanı:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n` +
        `🏆 **Kazanan Sayısı:** \`${data.winner_count} Kişi\`\n` +
        `👤 **Düzenleyen:** <@${data.host_id}>\n` +
        (data.required_role ? `🔒 **Zorunlu Rol:** <@&${data.required_role}>\n` : '') +
        (data.description ? `📝 **Açıklama / Şartlar:** ${data.description}\n` : '') +
        `\n👥 **Mevcut Katılımcı:** \`${count} kişi\``;
    }

    return new EmbedBuilder()
      .setTitle(`🎉 ÇEKİLİŞ: ${data.prize}`)
      .setDescription(desc)
      .setColor(isEnded ? '#7F8C8D' : '#E91E63')
      .setFooter({ text: isEnded ? 'Çekiliş tamamlandı' : 'Bol şanslar! ⬢ Unturned Store', iconURL: this.client?.user?.displayAvatarURL() })
      .setTimestamp(data.end_time);
  }

  createActionRow(messageId, count = 0, isEnded = false) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${messageId}`)
        .setLabel(isEnded ? 'Çekiliş Bitti' : `Katıl (${count})`)
        .setEmoji(isEnded ? '🔒' : '🎉')
        .setStyle(isEnded ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setDisabled(isEnded)
    );
  }

  async checkGiveaways() {
    try {
      const now = Date.now();
      const allGiveaways = dbManager.get('giveaways');
      const rows = allGiveaways.filter(gw => !gw.ended && gw.end_time <= now);

      if (Array.isArray(rows)) {
        for (const gw of rows) {
          await this.endGiveaway(gw.message_id);
        }
      }
    } catch (err) {
      console.error('checkGiveaways error:', err.message);
    }
  }

  async endGiveaway(messageId) {
    try {
      const gw = dbManager.getOne('giveaways', { message_id: messageId });
      if (!gw || gw.ended) return null;

      const participants = typeof gw.participants === 'string' ? JSON.parse(gw.participants || '[]') : (gw.participants || []);
      const winnerCount = Math.min(gw.winner_count || 1, participants.length);

      // Rastgele kazananları seç
      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, winnerCount);

      // Veritabanını güncelle
      dbManager.update('giveaways', { message_id: messageId }, { ended: true, winners: JSON.stringify(winners) });

      // Discord mesajını güncelle
      const guild = this.client.guilds.cache.get(gw.guild_id);
      if (guild) {
        const channel = guild.channels.cache.get(gw.channel_id);
        if (channel) {
          try {
            const message = await channel.messages.fetch(messageId);
            if (message) {
              const updatedEmbed = this.createEmbed(gw, true, winners);
              const updatedRow = this.createActionRow(messageId, participants.length, true);

              await message.edit({
                embeds: [updatedEmbed],
                components: [updatedRow]
              });

              if (winners.length > 0) {
                const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
                await channel.send({
                  content: `🎉 **TEBRİKLER!** ${winnerMentions}, **${gw.prize}** çekilişini kazandınız! 🎁\nLütfen teslimat için \`#destek-talep\` kanalından talep açınız.`
                });
              } else {
                await channel.send({
                  content: `⚠️ **${gw.prize}** çekilişine yeterli katılım olmadığı için kazanan belirlenemedi.`
                });
              }
            }
          } catch (msgErr) {
            console.error('Giveaway message edit error:', msgErr.message);
          }
        }
      }

      return winners;
    } catch (err) {
      console.error('endGiveaway error:', err);
      return null;
    }
  }

  async reroll(messageId) {
    try {
      const gw = dbManager.getOne('giveaways', { message_id: messageId });
      if (!gw) return { success: false, message: 'Çekiliş bulunamadı.' };

      const participants = typeof gw.participants === 'string' ? JSON.parse(gw.participants || '[]') : (gw.participants || []);

      if (participants.length === 0) {
        return { success: false, message: 'Katılımcı bulunmadığı için yeniden çekilemez.' };
      }

      const winnerCount = Math.min(gw.winner_count || 1, participants.length);
      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const newWinners = shuffled.slice(0, winnerCount);

      dbManager.update('giveaways', { message_id: messageId }, { winners: JSON.stringify(newWinners) });

      const guild = this.client.guilds.cache.get(gw.guild_id);
      if (guild) {
        const channel = guild.channels.cache.get(gw.channel_id);
        if (channel) {
          const winnerMentions = newWinners.map(id => `<@${id}>`).join(', ');
          await channel.send({
            content: `🔄 **ÇEKİLİŞ YENİLENDİ!** Yeni kazanan(lar): ${winnerMentions}! 🎉\n**Ödül:** \`${gw.prize}\``
          });
        }
      }

      return { success: true, winners: newWinners };
    } catch (err) {
      console.error('reroll error:', err);
      return { success: false, message: err.message };
    }
  }
}

module.exports = new GiveawayManager();
