const { Events, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const { loadAfkData, removeAfk, getAfkReason } = require('../utils/afk/AfkSystem');
const calculateSimilarity = require('../utils/message/core');
const { createEmbed } = require('../utils/message/embed');
const settings = require('../config/genaral/main.json').otomesaj;
const main = require('../config/genaral/main.json');
const EconomySystem = require('../utils/EconomySystem');
const LevelSystem = require('../utils/LevelSystem');
const CanvasBuilder = require('../utils/canvas/CanvasBuilder');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot || message.system || !message.guild) return;
    if (main.ServerID && message.guild.id !== main.ServerID) return;

    const systemsManager = require('../utils/SystemsManager');

    // --- AFK SİSTEMİ ---
    if (systemsManager.isEnabled('afk')) {
      if (message.mentions.users.size > 0) {
        const mentionedUser = message.mentions.users.first();
        const afkReason = await getAfkReason(mentionedUser);

        if (afkReason) {
          message.reply(`🌙 **${mentionedUser.username}** şu anda **${afkReason.reason}** sebebiyle AFK. (${afkReason.duration})`).catch(() => {});
        }
      }
      
      const afkResult = await removeAfk(message.author, message.guild);
      if (afkResult) {
        try {
          const member = await message.guild.members.fetch(message.author.id).catch(() => null);
          if (member) {
            const buffer = await CanvasBuilder.createAfkRemoveCard(member, afkResult);
            const attachment = new AttachmentBuilder(buffer, { name: 'afk-cikis.png' });
            message.reply({ files: [attachment] }).catch(() => {});
          }
        } catch (err) {
          message.reply(`AFK modundan çıktınız. ${afkResult.text}`).catch(() => {});
        }
      }
    }

    // --- EKONOMİ VE SEVİYE SİSTEMİ ---
    if (systemsManager.isEnabled('economy')) {
      await EconomySystem.rewardMessage(message.guild.id, message.author.id);
    }

    if (systemsManager.isEnabled('level')) {
      const xpResult = await LevelSystem.addXp(message.guild.id, message.author.id);

      if (xpResult.leveledUp) {
        const levelEmbed = createEmbed({
          title: '🎉 Seviye Atladın!',
          description: `Tebrikler ${message.author}! Yeni seviyen: **${xpResult.level}**`,
          color: '#f093fb'
        });
        
        message.channel.send({ embeds: [levelEmbed] }).then(msg => {
          setTimeout(() => msg.delete().catch(() => {}), 10000);
        }).catch(() => {});
      }
    }

    // --- OTO CEVAP SİSTEMİ ---
    if (systemsManager.isEnabled('automessage')) {
      try {
        if (!settings.responses || !Array.isArray(settings.responses)) {
          return;
        }   
        const messageContent = message.content.toLowerCase();
        const similarityThreshold = settings.similarityThreshold || 80; 
        
        for (const response of settings.responses) {
          if (!response.trigger || !response.reply) continue;
          
          const triggerLower = response.trigger.toLowerCase();

          // local-mods kanalında (1534858778498039838) local/local mod yönlendirme mesajını tetikleme
          if (message.channel.id === '1534858778498039838' && (triggerLower === 'local' || triggerLower === 'local mod')) {
            continue;
          }

          const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordRegex = new RegExp(`(?:^|[\\s.,!?:;()'"])${escapeRegExp(triggerLower)}(?:$|[\\s.,!?:;()'"])`, 'i');
          const isWordMatch = wordRegex.test(messageContent);
          const isSaMatch = (triggerLower === 'sa' || triggerLower === 's.a') && /(?:^|[\s.,!?:;()'"])s\.?a\.?(?:$|[\s.,!?:;()'"])/i.test(messageContent);

          const similarity = calculateSimilarity(messageContent, triggerLower);
          // Tam kelime eşleşmesi, s.a variantları VEYA yüksek benzerlik (örn: selamm)
          const isMatch = isWordMatch || isSaMatch || (similarity >= similarityThreshold);

            if (isMatch) {
            const guildIcon = message.guild.iconURL({ dynamic: true, size: 256 });
            const mentionRoles = Array.isArray(response.mentionRoles) ? response.mentionRoles : [];
            const isWarning = mentionRoles.length > 0; // rol varsa uyarı rengi

            const container = new ContainerBuilder();
            container.setAccentColor(isWarning ? 0xFF3333 : 0x0088FF);
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`### ${message.guild.name}`)
            );
            container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(response.reply)
            );
            container.addTextDisplayComponents(
              new TextDisplayBuilder().setContent(`-# ⬢ ${message.guild.name} • Destek & Mağaza`)
            );

            await message.reply({
              components: [container.toJSON()],
              allowedMentions: {
                repliedUser: true,
                roles: mentionRoles,
              },
            });
            break;
          }
        }
      } catch (error) {
        console.error('Error in MessageCreate event (AutoResponse):', error);
      }
    }

    // --- AKILLI TİCKET YANITLAYICI (SSS) ---
    const channelName = message.channel.name?.toLowerCase() || '';
    const isTicketChannel = channelName.includes('ticket-') || channelName.includes('destek-') || channelName.includes('sipariş-') || channelName.includes('siparis-');

    if (isTicketChannel) {
      const content = message.content.toLowerCase();

      const TICKET_SOLUTIONS = [
        {
          keywords: ['permission', 'yetki', 'izin', 'permissions.config', 'access denied'],
          title: '🔐 Yetki / Permission Hatası Çözümü',
          solution:
            '**1.** `Rocket.Permissions.config.xml` dosyanızı açın.\n' +
            '**2.** İlgili komutu veya eklentiyi `<Permission>` etiketleri arasına ekleyin.\n' +
            '**3.** Grubunuzun (Admin, Mod, VIP) doğru `<Id>` ile eşleştiğinden emin olun.\n' +
            '**4.** Sunucuyu yeniden başlatın veya `/p reload` komutunu kullanın.\n\n' +
            '```xml\n<Permission>pluginismi:komut</Permission>\n```'
        },
        {
          keywords: ['mysql', 'database', 'veritabanı', 'connection refused', 'bağlanmıyor', 'sql'],
          title: '🗄️ MySQL / Veritabanı Bağlantı Hatası',
          solution:
            '**1.** MySQL servisinizin çalıştığından emin olun: `systemctl status mysql`\n' +
            '**2.** Plugin config dosyasında **host**, **port**, **username**, **password** ve **database** bilgilerini kontrol edin.\n' +
            '**3.** Uzak sunucu kullanıyorsanız MySQL kullanıcınızın `%` (tüm IP\'ler) veya sunucu IP\'niz için yetkilendirildiğinden emin olun.\n' +
            '**4.** Firewall kurallarında **3306** portunun açık olduğunu doğrulayın.'
        },
        {
          keywords: ['xml', 'parse', 'deserialize', 'invalid xml', 'bozuk', 'xml hatası', 'xmlexception'],
          title: '📄 XML Parse / Yapılandırma Hatası',
          solution:
            '**1.** Config dosyanızda **eksik kapanış etiketleri** (`</Tag>`) olup olmadığını kontrol edin.\n' +
            '**2.** Özel karakterler (`&`, `<`, `>`) XML\'de sorun yaratır. Bunları `&amp;`, `&lt;`, `&gt;` ile değiştirin.\n' +
            '**3.** Dosyayı bir [XML Validator](https://www.xmlvalidation.com/) sitesine yapıştırarak hatanın nerede olduğunu bulabilirsiniz.\n' +
            '**4.** Hâlâ çözülmüyorsa config dosyasını silerek eklentiyi yeniden başlatın, temiz dosya oluşturulsun.'
        },
        {
          keywords: ['kurulum', 'nasıl kurarım', 'nasıl kurulur', 'yükleme', 'install', 'setup', 'nereye atılır'],
          title: '📥 Plugin Kurulum Rehberi',
          solution:
            '**RocketMod Eklentisi:**\n' +
            '**1.** İndirdiğiniz `.dll` dosyasını `Servers/SUNUCU_ADI/Rocket/Plugins/` klasörüne atın.\n' +
            '**2.** Sunucuyu yeniden başlatın. İlk açılışta config dosyası otomatik oluşacaktır.\n' +
            '**3.** Config dosyasını `Rocket/Plugins/PluginIsmi/` klasöründe bulabilirsiniz.\n\n' +
            '**OpenMod Eklentisi:**\n' +
            '`/openmod install PluginIsmi` komutunu oyun içinden veya konsoldan çalıştırın.'
        },
        {
          keywords: ['çalışmıyor', 'çalışmıyo', 'çalışmyor', 'calismıyor', 'calismiyor', 'bozuk', 'bug', 'sorun'],
          title: '🛠️ Genel Sorun Giderme Adımları',
          solution:
            '**1.** Sunucu konsolundaki hata mesajını (`Exception` veya `Error` yazısını) kopyalayıp bu kanala yapıştırın.\n' +
            '**2.** Eklentinin son sürümünü kullandığınızdan emin olun.\n' +
            '**3.** Çakışan başka bir eklenti olup olmadığını kontrol edin (eklentiyi tek başına test edin).\n' +
            '**4.** Config dosyasını silip eklentiyi yeniden başlatmayı deneyin.\n\n' +
            '*Yukarıdaki adımları denediyseniz ve sorun devam ediyorsa, lütfen konsoldan gelen **tam hata mesajını** buraya yapıştırın. Yetkili arkadaşlarımız en kısa sürede yardımcı olacaktır.*'
        },
        {
          keywords: ['workshop', 'mod yüklenmiyor', 'mod inmiyor', 'workshop hatası', 'content'],
          title: '🔧 Workshop / Mod Yükleme Sorunu',
          solution:
            '**1.** `WorkshopDownloadConfig.json` dosyasında mod ID\'lerinin doğru yazıldığını kontrol edin.\n' +
            '**2.** Sunucunuzdaki `steamcmd` güncel mi? `steamcmd +quit` ile güncellemeyi deneyin.\n' +
            '**3.** Disk alanınızın yeterli olduğundan emin olun.\n' +
            '**4.** Bazı modlar **sunucu tarafında** değil, sadece **istemci tarafında** çalışır. Mod açıklamasını kontrol edin.'
        }
      ];

      for (const entry of TICKET_SOLUTIONS) {
        const matched = entry.keywords.some(kw => content.includes(kw));
        if (matched) {
          const container = new ContainerBuilder();
          container.setAccentColor(0x3498DB);
          
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### ${entry.title}`)
          );
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `💡 **Otomatik Destek Asistanı** sorununuzu tespit etti!\n\n` +
              `Yetkili ekibimiz gelene kadar aşağıdaki çözüm adımlarını deneyebilirsiniz:\n\n` +
              entry.solution
            )
          );
          container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ⬢ ${message.guild.name} Akıllı Destek Sistemi • Sorun devam ediyorsa yetkili beklemeye devam edin`)
          );

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_solved_' + message.author.id)
              .setLabel('✅ Sorunum Çözüldü')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('ticket_needhelp_' + message.author.id)
              .setLabel('❌ Hâlâ Yardım Gerekiyor')
              .setStyle(ButtonStyle.Secondary)
          );

          container.addActionRowComponents(row);

          await message.reply({ components: [container.toJSON()] }).catch(() => {});
          break;
        }
      }
    }
  },
};