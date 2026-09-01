const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('odeme-ayarla')
    .setDescription('Plugin satışları için geçerli IBAN, Papara ve ödeme hesap bilgilerini ayarlar')
    .addStringOption(option =>
      option.setName('banka')
        .setDescription('Banka Adı (Örn: Ziraat Bankası, Garanti BBVA, Enpara)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('iban')
        .setDescription('TR ile başlayan 26 haneli IBAN numarası')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('alici_isim')
        .setDescription('Hesap Sahibinin Adı ve Soyadı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('papara')
        .setDescription('Papara Hesap Numarası (Opsiyonel)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('ininal')
        .setDescription('İninal / Tosla / Diğer Hesap (Opsiyonel)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('shopier')
        .setDescription('Shopier / Kredi Kartı Mağaza Linki (Opsiyonel)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('aciklama_notu')
        .setDescription('Ödeme yaparken açıklamaya yazılmasını istediğiniz not (Örn: Discord Kullanıcı Adı)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'odeme-ayarla',
  description: 'Mağaza ödeme ve hesap bilgilerini yapılandırır',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const banka = ctx.options.getString('banka');
    const iban = ctx.options.getString('iban');
    const alici = ctx.options.getString('alici_isim');
    const papara = ctx.options.getString('papara') || null;
    const ininal = ctx.options.getString('ininal') || null;
    const shopier = ctx.options.getString('shopier') || null;
    const aciklamaNotu = ctx.options.getString('aciklama_notu') || 'Discord Kullanıcı Adınız';

    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', guild.id) || {};

    settings.paymentInfo = {
      banka,
      iban,
      alici,
      papara,
      ininal,
      shopier,
      aciklamaNotu,
      updatedAt: Date.now()
    };

    await jsonManager.set('server/settings', guild.id, settings);

    const embed = new EmbedBuilder()
      .setTitle('💳 Ödeme Bilgileri Başarıyla Kaydedildi!')
      .setDescription('Kaydedilen bu bilgiler biletlerde ve `/odeme-yaz` komutunda otomatik kullanılacaktır.\n')
      .addFields(
        { name: '🏦 Banka / IBAN', value: `**Banka:** ${banka}\n**Alıcı:** \`${alici}\`\n**IBAN:** \`${iban}\``, inline: false },
        { name: '🟣 Papara', value: papara ? `\`${papara}\`` : 'Belirtilmedi', inline: true },
        { name: '💳 İninal / Diğer', value: ininal ? `\`${ininal}\`` : 'Belirtilmedi', inline: true },
        { name: '🌐 Kredi Kartı / Shopier', value: shopier ? `[Mağazaya Git](${shopier})` : 'Belirtilmedi', inline: true },
        { name: '📝 Açıklama Kuralı', value: `*${aciklamaNotu}*`, inline: false }
      )
      .setColor('#2ECC71')
      .setFooter({ text: `${guild.name} ⬢ Ödeme Yönetimi`, iconURL: ctx.client.user.displayAvatarURL() })
      .setTimestamp();

    await ctx.editReply({
      content: '✅ Ödeme bilgileriniz güncellendi! Bu bilgileri kanalda yayınlamak için **`/odeme-yaz`** komutunu kullanabilirsiniz.',
      embeds: [embed]
    });
  }
};
