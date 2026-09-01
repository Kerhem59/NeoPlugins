const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('flash-sale')
    .setDescription('Sınırlı süreli indirim kampanyası oluşturur ve duyuru kanalına atar')
    .addStringOption(option =>
      option.setName('urun')
        .setDescription('Kampanya yapılacak ürün adı')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('indirim')
        .setDescription('İndirim yüzdesi (1-90)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(90)
    )
    .addIntegerOption(option =>
      option.setName('sure')
        .setDescription('Kampanya süresi (dakika)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1440)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'flash-sale',
  description: 'Zamanlı kampanya oluşturur',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.' });
    }

    const product = ctx.options.getString('urun');
    const discount = ctx.options.getInteger('indirim');
    const durationMinutes = ctx.options.getInteger('sure');
    const endsAt = Date.now() + (durationMinutes * 60 * 1000);
    const endsAtUnix = Math.floor(endsAt / 1000);

    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', ctx.guild.id) || {};
    
    let announceChannel = null;
    if (settings.announcementChannel) {
      announceChannel = ctx.guild.channels.cache.get(settings.announcementChannel);
    }
    if (!announceChannel) {
      announceChannel = ctx.guild.channels.cache.find(c => 
        c.name.includes('duyuru') || c.name.includes('kampanya') || c.name.includes('announcement')
      );
    }
    if (!announceChannel) {
      announceChannel = ctx.channel;
    }

    try {
      dbManager.insert('flash_sales', {
        guild_id: ctx.guild.id,
        product: product,
        discount: discount,
        ends_at: endsAt,
        status: 'Active',
        created_by: ctx.user.id,
        created_at: Date.now()
      });

      const saleContainer = new ContainerBuilder();
      saleContainer.setAccentColor(0xFF4500);

      saleContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### ⚡ FLASH SALE ─ ANLIK KAMPANYA! ⚡')
      );

      saleContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      saleContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**🔥 ${product}**\n\n` +
          `🎯 **%${discount} İNDİRİM!**\n\n` +
          `⏰ **Bitiş:** <t:${endsAtUnix}:R> (<t:${endsAtUnix}:t>)\n\n` +
          `Bu kampanya sınırlı sürelidir! Fırsatı kaçırmamak için hemen sipariş ticket'ınızı açın.\n\n` +
          `> 💡 *Sipariş açarken yetkililere bu kampanyadan geldiğinizi belirtin.*`
        )
      );

      saleContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      saleContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} Flash Sale Sistemi`)
      );

      const saleMessage = await announceChannel.send({
        content: '@everyone 🚨 **SINIRLI SÜRELİ KAMPANYA!**',
        components: [saleContainer.toJSON()]
      });

      setTimeout(async () => {
        try {
          const expiredContainer = new ContainerBuilder();
          expiredContainer.setAccentColor(0x95A5A6);
          
          expiredContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### ⏰ KAMPANYA SONA ERDİ')
          );
          expiredContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
          expiredContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `**${product}** için **%${discount}** indirimli kampanya sona ermiştir.\n\n` +
              `Bir sonraki kampanyayı kaçırmamak için sunucumuzdaki bildirimleri açık tutun!`
            )
          );
          expiredContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} Kampanya Bitti`)
          );

          await saleMessage.edit({
            content: '~~@everyone~~ ⏰ **Kampanya Sona Erdi**',
            components: [expiredContainer.toJSON()]
          }).catch(() => {});

          dbManager.upsert('flash_sales', 
            { guild_id: ctx.guild.id, product: product, ends_at: endsAt }, 
            { status: 'Expired' }
          );
        } catch (e) {}
      }, durationMinutes * 60 * 1000);

      const replyContainer = new ContainerBuilder();
      replyContainer.setAccentColor(0x2ECC71);
      replyContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ✅ Flash Sale Oluşturuldu!\n\n**${product}** için **%${discount}** indirimli kampanya ${announceChannel} kanalına gönderildi!\n\n⏰ Kampanya **${durationMinutes} dakika** sonra otomatik olarak sona erecektir.`)
      );

      await ctx.editReply({ components: [replyContainer.toJSON()] });

    } catch (err) {
      console.error('Flash sale oluşturma hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
