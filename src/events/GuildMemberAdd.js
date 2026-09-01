const { Events, AttachmentBuilder } = require('discord.js');
const JsonManager = require('../../Database/SuperCore/JsonManager');
const CanvasBuilder = require('../utils/canvas/CanvasBuilder');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, client) {
    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', member.guild.id) || {};

    const systemsManager = require('../utils/SystemsManager');

    // Oto-Rol Uygulama
    if (systemsManager.isEnabled('autorole') && settings.autoRole) {
      const role = member.guild.roles.cache.get(settings.autoRole);
      if (role && !role.name.includes('—')) {
        await member.roles.add(role).catch(err => console.error('Otorol verme hatası:', err));
      }
    }

    // Canvas Hoşgeldin Kartı
    if (!systemsManager.isEnabled('welcome')) return;

    console.log(`[Welcome] Giriş yapıldı: ${member.user.tag} (ID: ${member.id})`);
    console.log(`[Welcome] Kanal Ayarı: ${settings.welcomeChannel}`);

    if (settings.welcomeChannel) {
      const channel = member.guild.channels.cache.get(settings.welcomeChannel);
      if (channel) {
        console.log(`[Welcome] Kanal bulundu: ${channel.name}`);
        try {
          const buffer = await CanvasBuilder.createWelcomeCard(member);
          const attachment = new AttachmentBuilder(buffer, { name: 'hosgeldin.png' });

          const welcomeText = settings.welcomeMessage
            ? settings.welcomeMessage
                .replace('{member}', member.toString())
                .replace('{guild}', member.guild.name)
                .replace('{tag}', member.user.tag)
                .replace('{count}', member.guild.memberCount)
            : `${member.toString()} sunucumuza hoş geldin! 🎉`;

          await channel.send({
            content: welcomeText,
            files: [attachment]
          });
          console.log(`[Welcome] Mesaj başarıyla gönderildi.`);
        } catch (err) {
          console.error('[Welcome] Canvas hoşgeldin kartı oluşturma hatası:', err);
          // Fallback: Kart oluşturulamazsa düz mesaj gönder
          if (settings.welcomeMessage) {
            const fallbackText = settings.welcomeMessage
              .replace('{member}', member.toString())
              .replace('{guild}', member.guild.name)
              .replace('{tag}', member.user.tag)
              .replace('{count}', member.guild.memberCount);
            await channel.send({ content: fallbackText }).catch(() => {});
          }
        }
      } else {
        console.warn(`[Welcome] Ayarlı kanal ID (${settings.welcomeChannel}) sunucuda bulunamadı!`);
      }
    } else {
      console.log(`[Welcome] Giriş kanalı ayarlanmamış.`);
    }
  }
}