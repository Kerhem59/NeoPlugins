const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolleri-kur')
    .setDescription('Unturned Plugin Mağazası için gerekli tüm rolleri otomatik olarak oluşturur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'rolleri-kur',
  description: 'Unturned Plugin Mağazası için gerekli tüm rolleri kurar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const botMember = guild.members.me;

    // Botun 'Rolleri Yönet' veya 'Yönetici' yetkisi var mı kontrol et
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles) && !botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return ctx.editReply({
        content: '❌ **Botun Rol Oluşturma Yetkisi Yok!**\n\nLütfen Discord üzerinden:\n1. **Sunucu Ayarları ➔ Roller** kısmına gidin.\n2. **Neo Plugins** (Bot) rolüne **Yönetici (Administrator)** veya **Rolleri Yönet (Manage Roles)** izni verin.\n3. Botun rolünü listenin **en üstüne** taşıyın ve komutu tekrar çalıştırın.'
      });
    }

    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', guild.id) || {};

    const hasAdmin = botMember.permissions.has(PermissionFlagsBits.Administrator);

    const rolesToCreate = [
      {
        key: 'ownerRole',
        name: '👑 Kurucu',
        color: '#E74C3C',
        hoist: true,
        permissions: hasAdmin ? [PermissionFlagsBits.Administrator] : [],
        description: 'Sunucu ve Proje Sahibi'
      },
      {
        key: 'devRole',
        name: '🛠️ Plugin Developer',
        color: '#E67E22',
        hoist: true,
        permissions: hasAdmin ? [
          PermissionFlagsBits.ManageGuild,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles
        ] : [],
        description: 'Unturned Eklenti Geliştiricisi'
      },
      {
        key: 'ticketStaff',
        name: '🛡️ Destek Ekibi',
        color: '#3498DB',
        hoist: true,
        permissions: [
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory
        ],
        description: 'Ticket & Teknik Destek Yetkilisi'
      },
      {
        key: 'vipCustomerRole',
        name: '💎 VIP Müşteri',
        color: '#9B59B6',
        hoist: true,
        permissions: [],
        description: 'Özel / Çoklu Plugin Satın Alan Müşteriler'
      },
      {
        key: 'customerRole',
        name: '👑 Müşteri',
        color: '#2ECC71',
        hoist: true,
        permissions: [],
        description: 'Plugin Satın Alan Müşteriler'
      },
      {
        key: 'announcementRole',
        name: '📢 Duyuru & Güncelleme',
        color: '#F1C40F',
        hoist: false,
        mentionable: true,
        permissions: [],
        description: 'Plugin güncellemeleri ve duyuruları bildirim rolü'
      },
      {
        key: 'discountRole',
        name: '🎁 İndirim & Kampanya',
        color: '#E91E63',
        hoist: false,
        mentionable: true,
        permissions: [],
        description: 'İndirim ve çekiliş bildirim rolü'
      },
      {
        key: 'autoRole',
        name: '👤 Üye',
        color: '#95A5A6',
        hoist: false,
        permissions: [],
        description: 'Sunucuya katılan yeni üyeler (Otorol)'
      },
      {
        key: 'botRole',
        name: '🤖 Botlar',
        color: '#607D8B',
        hoist: false,
        permissions: [],
        description: 'Sunucu Botları'
      }
    ];

    const results = [];

    for (const item of rolesToCreate) {
      try {
        let existingRole = null;
        if (settings[item.key]) {
          existingRole = guild.roles.cache.get(settings[item.key]);
        }
        if (!existingRole) {
          existingRole = guild.roles.cache.find(r => r.name.toLowerCase() === item.name.toLowerCase());
        }

        if (existingRole) {
          settings[item.key] = existingRole.id;
          results.push(`🔹 **${item.name}**: Zaten mevcut (<@&${existingRole.id}>)`);
        } else {
          // Güvenli rol oluşturma (yetki hatası verirse yetkisiz oluşturmayı dener)
          let createdRole;
          try {
            createdRole = await guild.roles.create({
              name: item.name,
              color: item.color,
              hoist: item.hoist,
              mentionable: item.mentionable || false,
              permissions: item.permissions,
              reason: 'Unturned Plugin Mağazası Otomatik Rol Kurulumu'
            });
          } catch (createErr) {
            // Eğer özel yetki yüzünden hata aldıysa yetkisiz oluşturmayı dene
            createdRole = await guild.roles.create({
              name: item.name,
              color: item.color,
              hoist: item.hoist,
              mentionable: item.mentionable || false,
              permissions: [],
              reason: 'Unturned Plugin Mağazası Otomatik Rol Kurulumu (Fallback)'
            });
          }

          settings[item.key] = createdRole.id;
          results.push(`✨ **${item.name}**: Başarıyla oluşturuldu (<@&${createdRole.id}>)`);
        }
      } catch (err) {
        console.error(`Rol oluşturma hatası (${item.name}):`, err.message);
        results.push(`❌ **${item.name}**: Hata (${err.message})`);
      }
    }

    // Ayarları kaydet
    await jsonManager.set('server/settings', guild.id, settings);

    const embed = new EmbedBuilder()
      .setTitle('🎭 Rol Kurulumu Tamamlandı!')
      .setDescription(
        'Unturned Plugin Satış & Destek sunucunuz için gerekli tüm roller oluşturuldu ve bot ayarlarına otomatik bağlandı!\n\n' +
        results.join('\n')
      )
      .addFields(
        { name: '⚙️ Otomatik Bağlanan Ayarlar', value: `• **Otorol:** ${settings.autoRole ? `<@&${settings.autoRole}>` : 'Ayarlanmadı'}\n• **Müşteri Rolü:** ${settings.customerRole ? `<@&${settings.customerRole}>` : 'Ayarlanmadı'}\n• **Destek Yetkilisi:** ${settings.ticketStaff ? `<@&${settings.ticketStaff}>` : 'Ayarlanmadı'}\n• **VIP Müşteri:** ${settings.vipCustomerRole ? `<@&${settings.vipCustomerRole}>` : 'Ayarlanmadı'}` }
      )
      .setColor('#2ECC71')
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setFooter({ text: `${guild.name} ⬢ Plugin Store Setup`, iconURL: ctx.client.user.displayAvatarURL() })
      .setTimestamp();

    await ctx.editReply({ embeds: [embed] });
  }
};
