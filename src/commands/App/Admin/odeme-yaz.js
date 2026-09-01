const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, ChannelType, Routes, ButtonStyle } = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder
} = require('@discordjs/builders');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

// Ağ kopması (ECONNRESET) durumunda otomatik tekrar deneme fonksiyonu
async function sendContainerWithRetry(client, channelId, payload, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.rest.post(Routes.channelMessages(channelId), {
        body: payload
      });
    } catch (err) {
      if ((err.code === 'ECONNRESET' || err.message?.includes('ECONNRESET') || err.code === 'ETIMEDOUT') && i < maxRetries - 1) {
        console.warn(`[Network] Geçici ağ hatası (${err.code}), 1 saniye sonra tekrar deneniyor (${i + 1}/${maxRetries})...`);
        await new Promise(res => setTimeout(res, 1000));
        continue;
      }
      throw err;
    }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('odeme-yaz')
    .setDescription('Ödeme Yöntemleri ve Hesap Bilgilerini Container formatında kanala gönderir')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Mesajın gönderileceği kanal (Belirtilmezse otomatik #odeme-yontemleri açılır veya bulunur)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'odeme-yaz',
  description: 'Ödeme Yöntemleri kanalına Container formatında rehberi yazar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', guild.id) || {};
    const payment = settings.paymentInfo || {};

    let targetChannel = ctx.options.getChannel('kanal');

    // Kanal seçilmediyse var olan kanalı bul veya otomatik oluştur
    if (!targetChannel) {
      targetChannel = guild.channels.cache.find(
        c => c.name.includes('odeme-yontem') || c.name.includes('odeme-bilgi') || c.name.includes('odeme')
      );

      if (!targetChannel) {
        let storeCategory = guild.channels.cache.find(
          c => c.type === ChannelType.GuildCategory && (c.name.includes('MAĞAZA') || c.name.includes('BİLGİ'))
        );

        targetChannel = await guild.channels.create({
          name: '💳│odeme-yontemleri',
          type: ChannelType.GuildText,
          parent: storeCategory ? storeCategory.id : undefined,
          topic: 'Unturned Plugin Mağazası Resmi Ödeme Yöntemleri ve Hesap Bilgileri',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
            }
          ]
        });
      }
    }

    // Ödeme Bilgileri Metin İçeriği
    const paymentContent = [
      `## 💳 ${guild.name} — Resmi Ödeme Yöntemleri`,
      'Unturned plugin ve eklenti siparişlerinizde güvenle kullanabileceğiniz resmi ödeme kanallarımız aşağıda listelenmiştir.\n',
      '**🏦 1. Banka Havale / EFT / FAST (7/24)**',
      `> • **Banka:** \`${payment.banka || 'Ziraat Bankası / FAST'}\``,
      `> • **Alıcı Adı:** \`${payment.alici || 'Yetkili Adı Soyadı'}\``,
      `> • **IBAN:** \`${payment.iban || 'TR00 0000 0000 0000 0000 0000 00'}\`\n`,
      '**🟣 2. Papara (7/24 Ücretsiz Anında Transfer)**',
      `> • **Papara No:** \`${payment.papara || 'Yetkiliye Danışınız'}\``,
      `> • **Hesap Sahibi:** \`${payment.alici || 'Yetkili Adı'}\`\n`,
      '**💳 3. İninal / Tosla / Hadi / Paycell**',
      `> • **Barkod / No:** \`${payment.ininal || 'Ödeme talebinde yetkiliden isteyiniz'}\`\n`,
      '**🌐 4. Kredi & Banka Kartı (Online 3D Secure / Shopier)**',
      `> • **Online Mağaza:** ${payment.shopier ? `[Ödeme Yapmak İçin Tıklayın](${payment.shopier})` : '`Sipariş biletinden link isteyiniz`'}\n`,
      '**⚠️ Ödeme Yaparken Dikkat Edilmesi Gerekenler:**',
      `> 1. **Açıklama:** Havale/EFT açıklamasına lütfen yalnızca **"${payment.aciklamaNotu || 'Discord Adınız'}"** yazınız.`,
      '> 2. **Dekont:** Ödemeniz bittikten sonra sipariş kanalına dekont görselini / işlem saatini gönderiniz.',
      '> 3. **Teslimat:** Ödeme yetkili tarafından onaylandığı an eklenti dosyalarınız ve **👑 Müşteri** rolünüz anında teslim edilir.'
    ].join('\n');

    // ContainerBuilder
    const container = new ContainerBuilder()
      .setAccentColor(0x2ECC71);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(paymentContent)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('faq_ticket_btn')
          .setLabel('Sipariş & Dekont Talebi Aç')
          .setEmoji({ name: '🧾' })
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('faq_store_btn')
          .setLabel('Plugin Vitrini')
          .setEmoji({ name: '🛒' })
          .setStyle(ButtonStyle.Secondary)
      )
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ⬢ ${guild.name} • 7/24 Güvenli & Hızlı Ödeme Altyapısı`)
    );

    try {
      await sendContainerWithRetry(ctx.client, targetChannel.id, {
        flags: 32768,
        components: [container.toJSON()]
      });

      await ctx.editReply({
        content: `✅ Ödeme yöntemleri rehberi **${targetChannel}** kanalına ContainerBuilder formatında başarıyla gönderildi!`
      });
    } catch (err) {
      console.error('odeme-yaz error:', err);
      await ctx.editReply({
        content: `❌ Ödeme yöntemleri gönderilirken hata oluştu: ${err.message}`
      });
    }
  }
};
