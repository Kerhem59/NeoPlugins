const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Zaman aşımına uğratılmış bir kullanıcının cezasını kaldırır.')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Cezası kaldırılacak kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Cezayı kaldırma sebebi').setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),

  name: 'unmute',
  subname: ["untimeout"],
  description: 'Bir kullanıcının zaman aşımı cezasını kaldırır.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.ModerateMembers)) {
        return ctx.reply({ content: '❌ Bu komutu kullanmak için **Üyeleri Zaman Aşımına Uğrat** iznine sahip olmalısın.', ephemeral: true });
    }

    const targetUser = ctx.getUser('kullanici');
    const reason = ctx.getString('sebep') || 'Sebep belirtilmedi.';
    
    const targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
        return ctx.reply({ content: '❌ Kullanıcı sunucuda bulunamadı!', ephemeral: true });
    }

    if (!targetMember.isCommunicationDisabled()) {
        return ctx.reply({ content: '❌ Bu kullanıcının zaten bir zaman aşımı cezası yok.', ephemeral: true });
    }

    if (!targetMember.moderatable) {
        return ctx.reply({ content: '❌ Bu kullanıcının cezasını kaldıramıyorum. Rolü benimkinden yüksek olabilir.', ephemeral: true });
    }

    try {
        await targetMember.timeout(null, `${ctx.user.tag} tarafından kaldırıldı: ${reason}`);
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔊 Üye Susturması Kaldırıldı')
            .setDescription(`**${targetUser.tag}** kullanıcısının cezası kaldırıldı.`)
            .addFields({ name: 'Sebep', value: reason })
            .setFooter({ text: `Kaldıran: ${ctx.user.tag}` })
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Untimeout hatası:', error);
        await ctx.reply({ content: '❌ Kullanıcının cezası kaldırılırken bir hata oluştu.', ephemeral: true });
    }
  },
};
