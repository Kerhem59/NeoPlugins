const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kanallari-kur')
    .setDescription('Unturned Plugin Mağazası için kategorileri ve kanalları eksiksiz otomatik kurar')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'kanallari-kur',
  description: 'Unturned Plugin Mağazası kanallarını ve kategorilerini kurar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const botMember = guild.members.me;

    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels) && !botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return ctx.editReply({
        content: '❌ **Botun Kanal Oluşturma Yetkisi Yok!**\n\nLütfen Discord Sunucu Ayarları > Roller kısmından botun rolüne **Kanalları Yönet** veya **Yönetici** yetkisi verin.'
      });
    }

    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', guild.id) || {};

    const everyoneRole = guild.roles.everyone;
    const staffRoleId = settings.ticketStaff || settings.ownerRole || null;

    // Kanal & Kategori Şablonu
    const structure = [
      {
        category: '📢 ─── BİLGİLENDİRME ───',
        channels: [
          { name: '📜│kurallar', type: ChannelType.GuildText, readOnly: true },
          { name: '📢│duyurular', type: ChannelType.GuildAnnouncement || ChannelType.GuildText, readOnly: true },
          { name: '🎁│kampanya-cekilis', type: ChannelType.GuildText, readOnly: true },
          { name: '👋│giris-cikis', type: ChannelType.GuildText, readOnly: true, settingKey: 'welcomeChannel' }
        ]
      },
      {
        category: '🛒 ─── PLUGIN MAĞAZASI ───',
        channels: [
          { name: '📦│plugin-vitrini', type: ChannelType.GuildText, readOnly: true, desc: 'Satıştaki Unturned eklentileri (/urunler buraya gönderilir)' },
          { name: '💎│vip-paketler', type: ChannelType.GuildText, readOnly: true },
          { name: '⭐│musteri-yorumlari', type: ChannelType.GuildText, readOnly: false, desc: 'Müşterilerin geri bildirim ve yorumları' },
          { name: '💳│odeme-bilgileri', type: ChannelType.GuildText, readOnly: true }
        ]
      },
      {
        category: '🎫 ─── DESTEK & SİPARİŞ ───',
        settingKey: 'ticketCategory',
        channels: [
          { name: '🎫│destek-talep', type: ChannelType.GuildText, readOnly: true, settingKey: 'ticketChannel', desc: '/ticket-kur paneli buraya kurulur' },
          { name: '❓│sikca-sorulanlar', type: ChannelType.GuildText, readOnly: true }
        ]
      },
      {
        category: '💬 ─── TOPLULUK SOHBET ───',
        channels: [
          { name: '💬│genel-sohbet', type: ChannelType.GuildText, readOnly: false },
          { name: '🤖│bot-komut', type: ChannelType.GuildText, readOnly: false },
          { name: '📷│ekran-goruntuleri', type: ChannelType.GuildText, readOnly: false }
        ]
      },
      {
        category: '🛡️ ─── YÖNETİM & LOGLAR ───',
        isStaffOnly: true,
        channels: [
          { name: '👑│yetkili-sohbet', type: ChannelType.GuildText, isStaffOnly: true },
          { name: '🛒│satis-log', type: ChannelType.GuildText, isStaffOnly: true, settingKey: 'customerLogChannel' },
          { name: '🎫│ticket-log', type: ChannelType.GuildText, isStaffOnly: true, settingKey: 'ticketLog' },
          { name: '📊│mod-log', type: ChannelType.GuildText, isStaffOnly: true, settingKey: 'modLogChannel' },
          { name: '💬│mesaj-log', type: ChannelType.GuildText, isStaffOnly: true, settingKey: 'messageLogChannel' }
        ]
      },
      {
        category: '🔊 ─── SES KANALLARI ───',
        channels: [
          { name: '🔊│Sohbet #1', type: ChannelType.GuildVoice },
          { name: '🔊│Sohbet #2', type: ChannelType.GuildVoice },
          { name: '🎮│Unturned Odası', type: ChannelType.GuildVoice },
          { name: '🛠️│Teknik Destek (Ses)', type: ChannelType.GuildVoice },
          { name: '👑│Yetkili Toplantı', type: ChannelType.GuildVoice, isStaffOnly: true }
        ]
      }
    ];

    const createdSummary = [];

    for (const group of structure) {
      try {
        // Kategori var mı kontrol et
        let categoryChannel = guild.channels.cache.find(
          c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === group.category.toLowerCase()
        );

        const categoryPermissionOverwrites = [];
        if (group.isStaffOnly) {
          categoryPermissionOverwrites.push({
            id: everyoneRole.id,
            deny: [PermissionFlagsBits.ViewChannel]
          });
          if (staffRoleId) {
            categoryPermissionOverwrites.push({
              id: staffRoleId,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            });
          }
        }

        if (!categoryChannel) {
          categoryChannel = await guild.channels.create({
            name: group.category,
            type: ChannelType.GuildCategory,
            permissionOverwrites: categoryPermissionOverwrites.length > 0 ? categoryPermissionOverwrites : undefined
          });
          createdSummary.push(`📁 **${group.category}** (Kategori Oluşturuldu)`);
        }

        if (group.settingKey) {
          settings[group.settingKey] = categoryChannel.id;
        }

        // Kanalları oluştur
        for (const ch of group.channels) {
          let existingCh = guild.channels.cache.find(
            c => c.name.toLowerCase() === ch.name.toLowerCase() && c.parentId === categoryChannel.id
          );

          if (!existingCh) {
            const channelOverwrites = [];

            if (ch.readOnly) {
              channelOverwrites.push({
                id: everyoneRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
              });
            }

            if (ch.isStaffOnly && !group.isStaffOnly) {
              channelOverwrites.push({
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.ViewChannel]
              });
              if (staffRoleId) {
                channelOverwrites.push({
                  id: staffRoleId,
                  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                });
              }
            }

            existingCh = await guild.channels.create({
              name: ch.name,
              type: ch.type,
              parent: categoryChannel.id,
              topic: ch.desc || undefined,
              permissionOverwrites: channelOverwrites.length > 0 ? channelOverwrites : undefined
            });

            createdSummary.push(`　├ #${ch.name}`);
          }

          if (ch.settingKey) {
            settings[ch.settingKey] = existingCh.id;
          }
        }
      } catch (catErr) {
        console.error(`Kanal kurulum hatası (${group.category}):`, catErr);
        createdSummary.push(`❌ ${group.category} (Hata: ${catErr.message})`);
      }
    }

    // Ayarları güncelle ve kaydet
    await jsonManager.set('server/settings', guild.id, settings);

    const embed = new EmbedBuilder()
      .setTitle('🏗️ Sunucu Kanalları Başarıyla Kuruldu!')
      .setDescription(
        'Unturned Plugin Satış ve Topluluk sunucunuz için tüm kategoriler, kanallar ve loglar izinleriyle birlikte otomatik oluşturuldu ve bota bağlandı!\n\n' +
        createdSummary.join('\n')
      )
      .addFields(
        {
          name: '⚙️ Otomatik Eşleşen Bot Ayarları',
          value:
            `• **Giriş-Çıkış Kanalı:** ${settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : '❌'}\n` +
            `• **Ticket Paneli Kanalı:** ${settings.ticketChannel ? `<#${settings.ticketChannel}>` : '❌'}\n` +
            `• **Satış / Sipariş Log:** ${settings.customerLogChannel ? `<#${settings.customerLogChannel}>` : '❌'}\n` +
            `• **Ticket Arşiv / Log:** ${settings.ticketLog ? `<#${settings.ticketLog}>` : '❌'}\n` +
            `• **Moderatör Log:** ${settings.modLogChannel ? `<#${settings.modLogChannel}>` : '❌'}\n` +
            `• **Mesaj Log:** ${settings.messageLogChannel ? `<#${settings.messageLogChannel}>` : '❌'}`
        }
      )
      .setColor('#2ECC71')
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setFooter({ text: `${guild.name} ⬢ Unturned Channel Setup`, iconURL: ctx.client.user.displayAvatarURL() })
      .setTimestamp();

    await ctx.editReply({ embeds: [embed] });
  }
};
