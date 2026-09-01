const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, ChannelType, Routes, ButtonStyle } = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder
} = require('@discordjs/builders');

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
    .setName('sss-yaz')
    .setDescription('Sıkça Sorulan Sorular (SSS) kanalına Container formatında bilgi rehberini gönderir')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('SSS mesajının gönderileceği kanal (Varsayılan: #sikca-sorulanlar veya mevcut kanal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'sss-yaz',
  description: 'Sıkça Sorulan Sorular kanalına Container formatında rehber gönderir',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const targetChannel = ctx.options.getChannel('kanal') ||
      guild.channels.cache.find(c => c.name.includes('soru') || c.name.includes('sss') || c.name.includes('faq')) ||
      ctx.channel;

    const faqContent = [
      `## ❓ ${guild.name} — Sıkça Sorulan Sorular & Rehber`,
      'Unturned pluginlerimiz, satın alım süreçleri, kurulum ve destek hakkında merak edilen en temel sorular ve cevapları aşağıdadır.\n',
      '**📦 1. Satın aldığım pluginleri nasıl teslim alırım?**',
      '> Ödemeniz onaylandıktan sonra açılan sipariş kanalınızdan derlenmiş `.dll` ve hazır yapılandırma dosyaları anında teslim edilir ve **👑 Müşteri** rolünüz tanımlanır.\n',
      '**🛠️ 2. Pluginleri sunucuma nasıl kurarım?**',
      '> Sunucunuzun ana dizinindeki `Servers/<SunucuAdı>/Rocket/Plugins/` klasörüne teslim edilen `.dll` dosyasını atıp sunucunuzu yeniden başlatmanız (veya konsoldan `rocket reload`) yeterlidir.\n',
      '**💡 3. Özel (Custom) plugin yaptırabilir miyim?**',
      '> Evet! `#destek-talep` kanalımızdan **Özel Plugin Siparişi** talebi açarak aklınızdaki sistemi anlatabilir ve size özel fiyat/teslimat teklifi alabilirsiniz.\n',
      '**🔄 4. Eklenti güncellemeleri ücretli mi?**',
      '> Hayır! Satın aldığınız eklentinin hata düzeltmeleri, performans iyileştirmeleri ve alt sürüm güncellemeleri tüm müşterilerimize ömür boyu **ücretsiz** sağlanır.\n',
      '**💳 5. Hangi ödeme yöntemleri geçerlidir?**',
      '> IBAN / Havale - EFT, Papara, İninal ve Kredi/Banka Kartı ile güvenli ödeme yapabilirsiniz.\n',
      '**📑 6. İade politikanız nedir?**',
      '> Dijital teslim edilen dosyalarda (kaynak kod/derleme) keyfi iade yapılmamaktadır. Ancak yaşanabilecek tüm teknik hatalarda düzeltme ve teknik destek garantimiz bulunmaktadır.'
    ].join('\n');

    // ContainerBuilder
    const container = new ContainerBuilder()
      .setAccentColor(0x3498DB);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(faqContent)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('faq_ticket_btn')
          .setLabel('Destek / Sipariş Talebi Aç')
          .setEmoji({ name: '🎫' })
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('faq_store_btn')
          .setLabel('Plugin Vitrini')
          .setEmoji({ name: '🛒' })
          .setStyle(ButtonStyle.Secondary)
      )
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ⬢ ${guild.name} • Kaliteli, Güvenilir & Hızlı Unturned Hizmetleri`)
    );

    try {
      await sendContainerWithRetry(ctx.client, targetChannel.id, {
        flags: 32768,
        components: [container.toJSON()]
      });

      await ctx.editReply({
        content: `✅ Sıkça Sorulan Sorular rehberi ContainerBuilder formatında ${targetChannel} kanalına başarıyla gönderildi!`
      });
    } catch (err) {
      console.error('sss-yaz error:', err);
      await ctx.editReply({
        content: `❌ SSS gönderilirken hata oluştu: ${err.message}`
      });
    }
  }
};
