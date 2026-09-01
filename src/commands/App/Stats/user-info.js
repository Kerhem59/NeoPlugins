const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user-info')
    .setDescription('Bir kullanıcının istatistiklerini ve detaylı bilgilerini gösterir.')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Bilgisi alınacak kullanıcı').setRequired(false)),

  name: 'user-info',
  subname: ["kullanicibilgi", "profilbilgi"],
  description: 'Kullanıcı bilgilerini gösterir.',

  async execute(ctx) {
    const targetUser = ctx.getUser('kullanici') || ctx.user;
    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);

    const embed = new EmbedBuilder()
        .setColor(member ? member.displayHexColor : '#2F3136')
        .setAuthor({ name: targetUser.tag, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
            { name: '🆔 Kullanıcı ID', value: targetUser.id, inline: true },
            { name: '📅 Hesap Kuruluş', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
        );

    if (member) {
        const roles = member.roles.cache.filter(r => r.id !== ctx.guild.id).map(r => r).join(', ') || 'Rolü yok';
        embed.addFields(
            { name: '📥 Sunucuya Katılım', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: `🎭 Roller [${member.roles.cache.size - 1}]`, value: roles.length > 1024 ? 'Çok fazla rol var.' : roles, inline: false }
        );
    }

    embed.setFooter({ text: `İsteyen: ${ctx.user.tag}` }).setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
