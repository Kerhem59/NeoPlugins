const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  customId: 'store_modal_buy_',
  async execute(interaction) {
    const productId = interaction.customId.replace('store_modal_buy_', '');
    const steamInfo = interaction.fields.getTextInputValue('store_steam');
    const payment = interaction.fields.getTextInputValue('store_payment');
    const note = interaction.fields.getTextInputValue('store_note') || 'Belirtilmedi';

    await interaction.deferReply({ ephemeral: true });

    let product = { name: 'Unturned Plugin', price: 'Belirtilmedi', framework: 'RocketMod', version: 'v1.0.0' };
    try {
      const p = dbManager.getOne('store_products', { id: Number(productId) });
      if (p) {
        product = p;
      }
    } catch (err) {
      console.error('store_modal_buy product fetch error:', err);
    }

    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};

    if (!settings.ticketCategory && !settings.ticketChannel) {
      try {
        const newCategory = await interaction.guild.channels.create({
          name: '🎫 ─── DESTEK & SİPARİŞ ───',
          type: ChannelType.GuildCategory
        });
        settings.ticketCategory = newCategory.id;
        await jsonManager.set('server/settings', interaction.guild.id, settings);
      } catch (catErr) {
        return interaction.editReply({ content: '❌ Sipariş kanalı oluşturulamadı. Lütfen sunucu yöneticisine başvurun.' });
      }
    }

    const safeUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingChannel = interaction.guild.channels.cache.find(
      c => c.name === `siparis-${safeUsername}`
    );

    if (existingChannel) {
      return interaction.editReply({ content: `❌ Zaten açık bir sipariş kanalınız bulunmaktadır: ${existingChannel}` });
    }

    try {
      const staffRole = settings.ticketStaff;
      let finalChannel;

      if (settings.ticketChannel) {
        const ticketCh = interaction.guild.channels.cache.get(settings.ticketChannel);
        if (ticketCh) {
          finalChannel = await ticketCh.threads.create({
            name: `siparis-${interaction.user.username}`,
            autoArchiveDuration: 1440,
            type: ChannelType.PrivateThread,
            reason: `${interaction.user.tag} → ${product.name} siparişi.`
          });
          await finalChannel.members.add(interaction.user.id);
        }
      }

      if (!finalChannel && settings.ticketCategory) {
        finalChannel = await interaction.guild.channels.create({
          name: `siparis-${safeUsername || interaction.user.id}`,
          type: ChannelType.GuildText,
          parent: settings.ticketCategory,
          topic: `${interaction.user.tag} → ${product.name} Satın Alım | ID: ${interaction.user.id}`,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
              ],
            },
            ...(staffRole ? [{
              id: staffRole,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AttachFiles,
              ],
            }] : []),
          ],
        });
      }

      if (!finalChannel) {
        return interaction.editReply({ content: '❌ Sipariş kanalı açılamadı.' });
      }

      const staffMention = staffRole ? `<@&${staffRole}>` : '@here';
      const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 256 });

      const paymentInfo = settings.paymentInfo;
      let paymentSnippet = '';
      if (paymentInfo && paymentInfo.iban) {
        paymentSnippet =
          `\n💳 **Hızlı Ödeme Bilgileri:**\n` +
          `> 🏦 **${paymentInfo.banka}:** \`${paymentInfo.iban}\` (${paymentInfo.alici})\n` +
          (paymentInfo.papara ? `> 🟣 **Papara:** \`${paymentInfo.papara}\`\n` : '') +
          `> ⚠️ *Açıklamaya lütfen yalnızca "${paymentInfo.aciklamaNotu || interaction.user.username}" yazınız.*\n`;
      }

      const orderEmbed = new EmbedBuilder()
        .setTitle(`🛒 Yeni Plugin Siparişi: ${product.name}`)
        .setDescription(
          `Merhaba ${interaction.user}! **${product.name}** sipariş talebiniz alındı.\n` +
          `Yetkili ekibimiz ödeme ve teslimat bilgileri için kısa süre içerisinde sizinle iletişime geçecektir.\n\n` +
          `> 📦 **Ürün:** \`${product.name}\` (${product.framework || 'RocketMod'})\n` +
          `> 💰 **Fiyat:** \`${product.price}\`\n` +
          `> 👤 **Discord / Steam:** \`${steamInfo}\`\n` +
          `> 💳 **Tercih Edilen Ödeme:** \`${payment}\`\n` +
          `> 📝 **Not / IP:** \`${note}\`\n` +
          paymentSnippet +
          `\n*Ödemeyi yaptıktan sonra lütfen dekontu bu kanala gönderiniz. Yetkili \`/musteri-ver\` komutu ile teslimatınızı yapacaktır.*`
        )
        .setColor('#2ECC71')
        .setThumbnail(guildIcon)
        .setFooter({ text: `${interaction.guild.name} ⬢ Satış & Teslimat`, iconURL: guildIcon || undefined })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Siparişi Üstlen')
          .setEmoji('🙋')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Siparişi Kapat')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Secondary)
      );

      await finalChannel.send({
        content: `${interaction.user} | ${staffMention}`,
        embeds: [orderEmbed],
        components: [row]
      });

      await interaction.editReply({
        content: `✅ Sipariş talebiniz oluşturuldu! Lütfen işlemler için sipariş kanalına geçiniz: ${finalChannel}`
      });

    } catch (err) {
      console.error('store_modal_buy submit error:', err);
      await interaction.editReply({ content: `❌ Sipariş kanalı açılırken hata oluştu: ${err.message}` });
    }
  }
};
