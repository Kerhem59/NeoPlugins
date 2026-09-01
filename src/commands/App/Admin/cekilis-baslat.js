const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, ChannelType } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const giveawayManager = require('../../../utils/GiveawayManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cekilis-baslat')
    .setDescription('Sunucuda yeni bir ödül / plugin çekilişi başlatır')
    .addStringOption(option =>
      option.setName('odul')
        .setDescription('Çekiliş ödülü (Örn: Advanced Kits Plugini, 250 TL Bakiye, VIP Müşteri Rolü)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sure')
        .setDescription('Çekiliş süresi (Örn: 10m, 1h, 24h, 3d, 1w)')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('kazanan_sayisi')
        .setDescription('Kaç kişi kazanacak? (Varsayılan: 1)')
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Çekilişin yapılacağı kanal (Varsayılan: #kampanya-cekilis veya mevcut kanal)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addRoleOption(option =>
      option.setName('zorunlu_rol')
        .setDescription('Yalnızca bu role sahip olanlar katılabilsin (Opsiyonel, Örn: Müşteri Özel Çekilişi)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('aciklama')
        .setDescription('Çekiliş hakkında ek şartlar veya detaylar')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'cekilis-baslat',
  description: 'Ödüllü çekiliş başlatır',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const prize = ctx.options.getString('odul');
    const timeStr = ctx.options.getString('sure');
    const winnerCount = ctx.options.getInteger('kazanan_sayisi') || 1;
    const requiredRole = ctx.options.getRole('zorunlu_rol');
    const description = ctx.options.getString('aciklama');

    const durationMs = giveawayManager.parseDuration(timeStr);
    if (!durationMs || durationMs < 10000) {
      return ctx.editReply({
        content: '❌ Geçersiz süre formatı! Lütfen geçerli bir süre girin. (Örn: `10m`, `1h`, `24h`, `3d`, `1w`)'
      });
    }

    const targetChannel = ctx.options.getChannel('kanal') ||
      guild.channels.cache.find(c => c.name.includes('cekilis') || c.name.includes('kampanya')) ||
      ctx.channel;

    const endTime = Date.now() + durationMs;

    const giveawayData = {
      guild_id: guild.id,
      channel_id: targetChannel.id,
      prize,
      winner_count: winnerCount,
      end_time: endTime,
      required_role: requiredRole ? requiredRole.id : null,
      host_id: ctx.user.id,
      description: description || null,
      participants: '[]',
      ended: false
    };

    try {
      const embed = giveawayManager.createEmbed(giveawayData, false, []);
      // Başlangıçta geçici buton
      const tempRow = giveawayManager.createActionRow('temp', 0, false);

      const msg = await targetChannel.send({
        content: '🎉 **YENİ ÇEKİLİŞ BAŞLADI!** @everyone',
        embeds: [embed],
        components: [tempRow]
      });

      // Gerçek buton mesaj ID'siyle güncellenir
      const finalRow = giveawayManager.createActionRow(msg.id, 0, false);
      await msg.edit({ components: [finalRow] });

      // Veritabanına kaydet
      dbManager.upsert('giveaways', { message_id: msg.id }, {
          message_id: msg.id,
          channel_id: targetChannel.id,
          guild_id: guild.id,
          prize: prize,
          winner_count: winnerCount,
          end_time: endTime,
          required_role: requiredRole ? requiredRole.id : null,
          host_id: ctx.user.id,
          description: description || null,
          participants: '[]',
          ended: false
      });

      await ctx.editReply({
        content: `✅ **${prize}** çekilişi başarıyla ${targetChannel} kanalında başlatıldı!\nMesaj ID: \`${msg.id}\``
      });

    } catch (err) {
      console.error('cekilis-baslat error:', err);
      await ctx.editReply({ content: `❌ Çekiliş başlatılırken hata oluştu: ${err.message}` });
    }
  }
};
