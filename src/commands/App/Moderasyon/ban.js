const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Belirtilen kullanıcıyı sunucudan yasaklar.')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Yasaklanacak kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Yasaklanma sebebi').setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers),

  name: 'ban',
  subname: ["yasakla"],
  description: 'Bir kullanıcıyı sunucudan yasaklar.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.BanMembers)) {
        return ctx.reply({ content: '❌ Bu komutu kullanmak için **Üyeleri Yasakla** iznine sahip olmalısın.', ephemeral: true });
    }

    const targetUser = ctx.getUser('kullanici');
    const reason = ctx.getString('sebep') || 'Sebep belirtilmedi.';
    const targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);

    if (targetUser.id === ctx.user.id) {
        return ctx.reply({ content: '❌ Kendini yasaklayamazsın!', ephemeral: true });
    }

    if (targetMember && !targetMember.bannable) {
        return ctx.reply({ content: '❌ Bu kullanıcıyı yasaklayamıyorum. Rolü benimkinden yüksek olabilir.', ephemeral: true });
    }

    try {
        await ctx.guild.members.ban(targetUser.id, { reason: `${ctx.user.tag} tarafından: ${reason}` });
        
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔨 Üye Yasaklandı')
            .setDescription(`**${targetUser.tag}** sunucudan yasaklandı.`)
            .addFields({ name: 'Sebep', value: reason })
            .setFooter({ text: `Yasaklayan: ${ctx.user.tag}` })
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Ban hatası:', error);
        await ctx.reply({ content: '❌ Kullanıcı yasaklanırken bir hata oluştu.', ephemeral: true });
    }
  },
};
