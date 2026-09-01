const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı üyelerin mesaj yazmasına kapatır.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),

  name: 'lock',
  subname: ["kilitle"],
  description: 'Kanalı kilitler.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.ManageChannels)) {
        return ctx.reply({ content: '❌ Bu komutu kullanmak için **Kanalları Yönet** iznine sahip olmalısın.', ephemeral: true });
    }

    try {
        await ctx.channel.permissionOverwrites.edit(ctx.guild.id, {
            SendMessages: false
        });
        
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔒 Kanal Kilitlendi')
            .setDescription('Bu kanal yöneticiler tarafından geçici olarak mesaj gönderimine kapatılmıştır.')
            .setFooter({ text: `${ctx.user.tag} tarafından kilitlendi.` })
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Lock hatası:', error);
        await ctx.reply({ content: '❌ Kanal kilitlenirken bir hata oluştu.', ephemeral: true });
    }
  },
};
