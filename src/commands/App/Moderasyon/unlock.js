const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kilitli kanalı üyelerin mesaj yazmasına açar.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),

  name: 'unlock',
  subname: ["kilitac"],
  description: 'Kanalın kilidini açar.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.ManageChannels)) {
        return ctx.reply({ content: '❌ Bu komutu kullanmak için **Kanalları Yönet** iznine sahip olmalısın.', ephemeral: true });
    }

    try {
        await ctx.channel.permissionOverwrites.edit(ctx.guild.id, {
            SendMessages: null
        });
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔓 Kanal Kilidi Açıldı')
            .setDescription('Kanal artık mesaj gönderimine açıktır.')
            .setFooter({ text: `${ctx.user.tag} tarafından açıldı.` })
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Unlock hatası:', error);
        await ctx.reply({ content: '❌ Kanal kilidi açılırken bir hata oluştu.', ephemeral: true });
    }
  },
};
