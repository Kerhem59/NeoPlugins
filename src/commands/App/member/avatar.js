const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Kullanıcının avatarını gösterir')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Başka bir kullanıcının avatarını görmek için seçin')
        .setRequired(false)
    ),
  
  name: 'avatar',
  subname: ['av', 'pp', 'pfp'],
  description: 'Kullanıcının avatarını gösterir',

  async execute(ctx) {
    const user = ctx.getUser('user', 0) || ctx.user;
    const avatarURL = user.displayAvatarURL({ format: 'png', size: 512 });
    
    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'in Avatarı`)
      .setImage(avatarURL)
      .setColor('#0099ff')
      .setTimestamp();

    await ctx.reply({
      content: `${user.username}'in avatarı:`,
      embeds: [embed]
    });
  },
};
