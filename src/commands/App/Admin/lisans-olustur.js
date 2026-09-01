const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const crypto = require('crypto');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lisans-olustur')
    .setDescription('Bir kullanıcı için özel plugin lisansı oluşturur (HWID uyumlu)')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Lisansın verileceği müşteri')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('urun')
        .setDescription('Lisanslanan ürünün adı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sure')
        .setDescription('Lisans süresi (Örn: Sınırsız, 30 Gün)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'lisans-olustur',
  description: 'Plugin lisansı oluşturur',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.' });
    }

    const targetUser = ctx.options.getUser('kullanici');
    const productName = ctx.options.getString('urun');
    const duration = ctx.options.getString('sure') || 'Sınırsız';

    // Rastgele lisans anahtarı üret (NEO-XXXX-YYYY-ZZZZ)
    const keyPart1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const keyPart2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const keyPart3 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const licenseKey = `NEO-${keyPart1}-${keyPart2}-${keyPart3}`;

    try {
      dbManager.insert('licenses', {
        guild_id: ctx.guild.id,
        user_id: targetUser.id,
        product_name: productName,
        license_key: licenseKey,
        hwid: null,
        duration: duration,
        status: 'Active',
        created_at: Date.now()
      });

      // Müşteriye özel mesaj ile gönder
      const dmEmbed = new EmbedBuilder()
        .setTitle('🔑 Yeni Lisansınız Oluşturuldu!')
        .setDescription(
          `Merhaba **${targetUser.username}**,\n\n` +
          `**${productName}** adlı ürününüz için lisans anahtarınız başarıyla oluşturulmuştur. Lütfen bu anahtarı kimseyle paylaşmayınız!\n\n` +
          `📦 **Ürün:** \`${productName}\`\n` +
          `⏳ **Süre:** \`${duration}\`\n` +
          `🔑 **Lisans Anahtarınız:**\n\`\`\`${licenseKey}\`\`\`\n\n` +
          `*Not: Eklenti ilk kurulduğunda IP adresiniz bu lisansa kilitlenecektir (HWID System).*`
        )
        .setColor('#F1C40F')
        .setThumbnail(ctx.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `${ctx.guild.name} ⬢ License Security`, iconURL: ctx.client.user.displayAvatarURL() })
        .setTimestamp();

      let dmStatus = "✅ DM üzerinden kullanıcıya iletildi.";
      try {
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (e) {
        dmStatus = "⚠️ DM gönderilemedi (Kullanıcının DM'leri kapalı olabilir). Lisans anahtarını manuel iletin.";
      }

      // Yetkiliye bilgi ver
      const replyEmbed = new EmbedBuilder()
        .setTitle('✅ Lisans Başarıyla Oluşturuldu!')
        .addFields(
          { name: '👤 Kullanıcı', value: `${targetUser}`, inline: true },
          { name: '📦 Ürün', value: `\`${productName}\``, inline: true },
          { name: '🔑 Lisans Anahtarı', value: `\`${licenseKey}\``, inline: false },
          { name: '✉️ Bildirim Durumu', value: dmStatus, inline: false }
        )
        .setColor('#2ECC71');

      await ctx.editReply({ embeds: [replyEmbed] });

    } catch (err) {
      console.error('Lisans oluşturma hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
