const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Kullanıcının bannerını gösterir')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Başka bir kullanıcının bannerını görmek için seçin')
        .setRequired(false)
    ),
  
  name: 'banner',
  subname: ['afis', 'afiş', 'kapak'],
  description: 'Kullanıcının bannerını gösterir',

  async execute(ctx) {
    const user = ctx.getUser('user', 0) || ctx.user;

    try {
      const response = await axios.get(`https://discord.com/api/v10/users/${user.id}`, {
        headers: {
          Authorization: `Bot ${ctx.client.token}`,
        },
      });

      const banner = response.data.banner;
      if (banner) {
        let bannerURL;
        if (banner.startsWith('a_')) {
          bannerURL = `https://cdn.discordapp.com/banners/${user.id}/${banner}.gif?size=512`;
        } else {
          bannerURL = `https://cdn.discordapp.com/banners/${user.id}/${banner}.png?size=512`;
        }

        const embed = new EmbedBuilder()
          .setTitle(`${user.username}'in Bannerı`)
          .setImage(bannerURL)
          .setColor('#0099ff')
          .setTimestamp();

        await ctx.reply({
          content: `${user.username}'in bannerı:`,
          embeds: [embed]
        });
      } else {
        await ctx.reply({
          content: `${user.username} kullanıcısının bir bannerı yok.`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error(error);
      await ctx.reply({
        content: 'Banner alınırken bir hata oluştu.',
        ephemeral: true
      });
    }
  },
};
