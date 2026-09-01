const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Belirtilen kullanıcıyı sunucudan atar.')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Atılacak kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Atılma sebebi').setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers),

  name: 'kick',
  subname: ["at"],
  description: 'Bir kullanıcıyı sunucudan atar.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.KickMembers)) {
        return ctx.reply({ content: '❌ Bu komutu kullanmak için **Üyeleri At** iznine sahip olmalısın.', ephemeral: true });
    }

    const targetUser = ctx.getUser('kullanici');
    const reason = ctx.getString('sebep') || 'Sebep belirtilmedi.';
    const targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
        return ctx.reply({ content: '❌ Kullanıcı sunucuda bulunamadı!', ephemeral: true });
    }

    if (targetUser.id === ctx.user.id) {
        return ctx.reply({ content: '❌ Kendini sunucudan atamazsın!', ephemeral: true });
    }

    if (!targetMember.kickable) {
        return ctx.reply({ content: '❌ Bu kullanıcıyı sunucudan atamıyorum. Rolü benimkinden yüksek olabilir.', ephemeral: true });
    }

    try {
        await targetMember.kick(`${ctx.user.tag} tarafından: ${reason}`);
        
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('👢 Üye Atıldı')
            .setDescription(`**${targetUser.tag}** sunucudan atıldı.`)
            .addFields({ name: 'Sebep', value: reason })
            .setFooter({ text: `Atan: ${ctx.user.tag}` })
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Kick hatası:', error);
        await ctx.reply({ content: '❌ Kullanıcı atılırken bir hata oluştu.', ephemeral: true });
    }
  },
};
