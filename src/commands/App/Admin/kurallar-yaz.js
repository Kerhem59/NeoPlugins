const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, ChannelType, Routes, ButtonStyle } = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kurallar-yaz')
    .setDescription('Kurallar kanalına ContainerBuilder ile Discord Container formatında kuralları gönderir')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Kuralların gönderileceği kanal (Belirtilmezse #kurallar veya mevcut kanala atılır)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'kurallar-yaz',
  description: 'Kurallar kanalına ContainerBuilder ile kuralları yazar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const targetChannel = ctx.options.getChannel('kanal') ||
      guild.channels.cache.find(c => c.name.includes('kural')) ||
      ctx.channel;

    const rulesContent = [
      `## 📜 ${guild.name} — Sunucu Kuralları`,
      'Sunucumuza katılan tüm üyeler, müşteriler ve ziyaretçiler aşağıdaki kuralları **okumuş ve kabul etmiş** sayılır.\n',
      '**💬 1. Genel Topluluk & Davranış**',
      '> • **Saygı ve Nezaket:** Küfür, hakaret, aşağılama, ırkçılık ve nefret söylemleri kesinlikle yasaktır.',
      '> • **Spam & Flood:** Kanalları gereksiz mesaj, görsel veya emojiyle kirletmek yasaktır.',
      '> • **Reklam Yasağı:** Sunucu içi kanallardan veya üyelere DM yoluyla izinsiz sunucu/ürün reklamı yapmak kalıcı ban sebebidir.',
      '> • **Yetkili Etiketleme:** Yetkili ekibini acil durumlar dışında sebepsiz yere etiketlemeyiniz.\n',
      '**🛒 2. Satın Alım & Ticaret**',
      '> • **Resmi Kanallar:** Tüm satın alımlar yalnızca sunucumuzdaki `#destek-talep` veya vitrin butonları üzerinden yürütülür.',
      '> • **Ödeme & Dekont:** Ödemeler tamamlandıktan sonra dekont yetkiliye iletilmeli ve `/musteri-ver` ile siparişiniz sisteme işlenmelidir.',
      '> • **İade Politikası:** Dijital teslim edilen plugin dosyalarında kaynak kod / derleme teslim edildikten sonra keyfi iade yapılmaz. Teknik destek ve güncelleme garantisi verilir.\n',
      '**🔑 3. Lisans, Telif & Leak (Dosya Sızdırma)**',
      '> • **Tekil Kullanım:** Satın aldığınız eklentiler yalnızca sizin adınıza kayıtlı sunucularda kullanılabilir.',
      '> • **Leak & Dağıtım Yasağı:** Eklenti dosyalarını 3. şahıslarla paylaşmak veya leak sitelerine yüklemek tespit edildiğinde **lisans iptal edilir ve sunucudan kalıcı olarak uzaklaştırılırsınız.**\n',
      '**🛠️ 4. Destek & Ticket Talepleri**',
      '> • **Ayrıntılı Bilgi:** Destek talebi açarken RocketMod/OpenMod konsol hata logunu (logs.log) ve sorununuzu net şekilde belirtiniz.',
      '> • **Müşteri Rolü:** Satın alım yapan üyelerimiz destek taleplerinde öncelikli hizmet alır.'
    ].join('\n');

    // ContainerBuilder
    const container = new ContainerBuilder()
      .setAccentColor(0xE91E63);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(rulesContent)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('rules_accept_btn')
          .setLabel('Kuralları Okudum & Kabul Ediyorum')
          .setEmoji({ name: '✅' })
          .setStyle(ButtonStyle.Success)
      )
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ⬢ ${guild.name} • Kaliteli & Güvenilir Unturned Hizmetleri`)
    );

    try {
      await ctx.client.rest.post(Routes.channelMessages(targetChannel.id), {
        body: {
          flags: 32768,
          components: [container.toJSON()]
        }
      });

      await ctx.editReply({
        content: `✅ Kurallar ContainerBuilder formatında ${targetChannel} kanalına başarıyla gönderildi!`
      });
    } catch (err) {
      console.error('ContainerBuilder API Hatası:', err);
      await ctx.editReply({
        content: `❌ ContainerBuilder gönderilirken hata oluştu: ${err.message}`
      });
    }
  }
};
