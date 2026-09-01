const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('musteri-al')
    .setDescription('Belirtilen kullanıcıdan Müşteri Rolünü geri alır')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Müşteri rolü alınacak kullanıcı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Rolün alınma sebebi')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  name: 'musteri-al',
  description: 'Kullanıcıdan Müşteri Rolünü alır',

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
    const reason = ctx.options.getString('sebep') || 'Belirtilmedi';

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return ctx.editReply({ content: '❌ Belirtilen üye sunucuda bulunamadı.' });
    }

    let customerRoleId = settings.customerRole;
    if (!customerRoleId) {
      const foundRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('müşteri') || r.name.toLowerCase().includes('musteri'));
      if (foundRole) customerRoleId = foundRole.id;
    }

    if (!customerRoleId || !targetMember.roles.cache.has(customerRoleId)) {
      return ctx.editReply({ content: '❌ Bu kullanıcı zaten Müşteri rolüne sahip değil.' });
    }

    try {
      await targetMember.roles.remove(customerRoleId);

      const logChannelId = settings.customerLogChannel || settings.modLogChannel;
      if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('⚠️ Müşteri Rolü Alındı')
            .setColor('#E74C3C')
            .addFields(
              { name: '👤 Üye', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
              { name: '🛡️ Yetkili', value: `${ctx.user} (\`${ctx.user.id}\`)`, inline: true },
              { name: '📝 Sebep', value: `\`${reason}\``, inline: false },
              { name: '📅 Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: 'Unturned Plugin Store Müşteri Yönetimi', iconURL: ctx.client.user.displayAvatarURL() });

          logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }

      await ctx.editReply({
        content: `✅ **${targetUser.username}** kullanıcısından Müşteri rolü başarıyla alındı. (Sebep: ${reason})`
      });

    } catch (err) {
      console.error('musteri-al error:', err);
      await ctx.editReply({ content: `❌ Rol alınırken hata oluştu: ${err.message}` });
    }
  }
};
