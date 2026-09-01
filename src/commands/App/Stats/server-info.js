const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-info')
    .setDescription('Sunucu hakkındaki detaylı bilgileri gösterir.'),

  name: 'server-info',
  subname: ["sunucubilgi", "sunucu"],
  description: 'Sunucu bilgilerini gösterir.',

  async execute(ctx) {
    const guild = ctx.guild;
    const owner = await guild.fetchOwner();
    
    const embed = new EmbedBuilder()
        .setColor('#2F3136')
        .setTitle(`${guild.name} - Sunucu Bilgileri`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
        .addFields(
            { name: '👑 Kurucu', value: `${owner.user.tag}`, inline: true },
            { name: '🆔 Sunucu ID', value: `${guild.id}`, inline: true },
            { name: '📅 Kuruluş Tarihi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '👥 Üye Sayısı', value: `Toplam: ${guild.memberCount}`, inline: true },
            { name: '💬 Kanallar', value: `${guild.channels.cache.size} Kanal`, inline: true },
            { name: '🎭 Roller', value: `${guild.roles.cache.size} Rol`, inline: true },
            { name: '🚀 Boost Seviyesi', value: `Seviye ${guild.premiumTier} (${guild.premiumSubscriptionCount} Boost)`, inline: true }
        )
        .setFooter({ text: `İsteyen: ${ctx.user.tag}`, iconURL: ctx.user.displayAvatarURL() })
        .setTimestamp();

    await ctx.reply({ embeds: [embed] });
  },
};
