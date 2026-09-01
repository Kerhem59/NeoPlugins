const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('musteri-ver')
    .setDescription('Belirtilen kullanıcıya Müşteri Rolü tanımlar ve sipariş kaydı oluşturur')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Müşteri rolü verilecek kullanıcı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('urun')
        .setDescription('Satın alınan Unturned plugini veya paket adı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('fiyat')
        .setDescription('Ödenen tutar (Örn: 250 TL, $15)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('not')
        .setDescription('Sipariş notu veya lisans / IP bilgisi')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  name: 'musteri-ver',
  description: 'Kullanıcıya Müşteri Rolü tanımlar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    const guild = ctx.guild;
    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', guild.id) || {};

    const isStaff = ctx.hasPermission(PermissionsBitField.Flags.Administrator) ||
      ctx.hasPermission(PermissionsBitField.Flags.ManageRoles) ||
      (settings.ticketStaff && ctx.member.roles.cache.has(settings.ticketStaff));

    if (!isStaff) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yetkili** veya **Yönetici** olmalısın.' });
    }

    const targetUser = ctx.options.getUser('kullanici');
    const productName = ctx.options.getString('urun');
    const price = ctx.options.getString('fiyat') || 'Belirtilmedi';
    const orderNote = ctx.options.getString('not') || 'Yok';

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return ctx.editReply({ content: '❌ Belirtilen üye sunucuda bulunamadı.' });
    }

    // Müşteri rolünü bul
    let customerRoleId = settings.customerRole;
    if (!customerRoleId) {
      const foundRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('müşteri') || r.name.toLowerCase().includes('musteri'));
      if (foundRole) customerRoleId = foundRole.id;
    }

    if (!customerRoleId) {
      return ctx.editReply({ content: '❌ Müşteri rolü bulunamadı! Lütfen önce `/rolleri-kur` komutunu çalıştırın.' });
    }

    try {
      // Rolü ver
      await targetMember.roles.add(customerRoleId);

      // JSON'a sipariş kaydı ekle
      try {
        dbManager.insert('customer_orders', {
           guild_id: guild.id,
           user_id: targetUser.id,
           staff_id: ctx.user.id,
           product_name: productName,
           price: price,
           note: orderNote,
           created_at: Date.now()
        });
      } catch (dbErr) {
        console.error('Sipariş JSON kaydı hatası:', dbErr.message);
      }

      // Sadakat puanı ekle (+10 her satın alımda)
      const VIP_THRESHOLD = 30;
      try {
        const existing = dbManager.get('loyalty', { guild_id: guild.id, user_id: targetUser.id });
        if (existing && existing.length > 0) {
          const current = existing[0];
          const newPoints = (current.points || 0) + 10;
          const newPurchases = (current.total_purchases || 0) + 1;
          dbManager.upsert('loyalty', { guild_id: guild.id, user_id: targetUser.id }, { points: newPoints, total_purchases: newPurchases });

          // VIP eşiğini geçtiyse VIP rolü ver
          if (newPoints >= VIP_THRESHOLD && (current.points || 0) < VIP_THRESHOLD) {
            const vipRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('vip'));
            if (vipRole) {
              await targetMember.roles.add(vipRole).catch(() => {});
              try {
                await targetUser.send({
                  embeds: [new EmbedBuilder()
                    .setTitle('👑 Tebrikler! VIP Müşteri Oldunuz!')
                    .setDescription(`**${guild.name}** mağazasında **${VIP_THRESHOLD}** sadakat puanına ulaştınız!\n\nArtık **VIP Müşteri** ayrıcalıklarından yararlanabilirsiniz:\n✅ Tüm ürünlerde **%10 kalıcı indirim**\n✅ **Öncelikli destek** hakkı\n✅ Yeni ürünlere **erken erişim**`)
                    .setColor('#FFD700')
                    .setThumbnail(guild.iconURL({ dynamic: true }))
                    .setTimestamp()
                  ]
                });
              } catch (e) {}
            }
          }
        } else {
          dbManager.insert('loyalty', { guild_id: guild.id, user_id: targetUser.id, points: 10, total_purchases: 1, created_at: Date.now() });
        }
      } catch (loyaltyErr) {
        console.error('Sadakat puanı hatası:', loyaltyErr.message);
      }

      // Müşteriye özel DM Mesajı
      const dmEmbed = new EmbedBuilder()
        .setTitle(`🎉 Satın Alımınız İçin Teşekkür Ederiz!`)
        .setDescription(
          `Merhaba **${targetUser.username}**,\n\n` +
          `**${guild.name}** üzerinden gerçekleştirmiş olduğunuz satın alım başarıyla tamamlandı ve **👑 Müşteri** rolünüz tanımlandı!\n\n` +
          `📦 **Satın Alınan Ürün:** \`${productName}\`\n` +
          `💰 **Tutar:** \`${price}\`\n` +
          `📝 **Not / Açıklama:** \`${orderNote}\`\n\n` +
          `🛠️ **Destek & Kurulum:** Eklenti kurulumunda veya kullanımında herhangi bir yardıma ihtiyacınız olursa sunucumuzdaki destek kanalından dilediğiniz zaman talep açabilirsiniz.`
        )
        .setColor('#2ECC71')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: `${guild.name} ⬢ Müşteri Memnuniyeti`, iconURL: ctx.client.user.displayAvatarURL() })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});

      // Log Kanalına Bildir
      const logChannelId = settings.customerLogChannel || settings.modLogChannel;
      if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🛒 Yeni Müşteri & Satış Kaydı')
            .setColor('#2ECC71')
            .addFields(
              { name: '👤 Müşteri', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
              { name: '🛡️ Yetkili', value: `${ctx.user} (\`${ctx.user.id}\`)`, inline: true },
              { name: '📦 Satın Alınan Ürün', value: `\`${productName}\``, inline: true },
              { name: '💰 Fiyat', value: `\`${price}\``, inline: true },
              { name: '📝 Not', value: `\`${orderNote}\``, inline: true },
              { name: '📅 Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'Unturned Plugin Store Satış Kaydı', iconURL: ctx.client.user.displayAvatarURL() });

          logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }

      await ctx.editReply({
        content: `✅ **${targetUser.username}** kullanıcısına **👑 Müşteri** rolü başarıyla verildi ve \`${productName}\` siparişi kaydedildi!`
      });

    } catch (err) {
      console.error('musteri-ver error:', err);
      await ctx.editReply({ content: `❌ Rol verilirken bir hata oluştu: ${err.message}` });
    }
  }
};
