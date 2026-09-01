const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Kanaldaki belirtilen sayıda mesajı temizler.')
    .addIntegerOption(opt => opt.setName('miktar').setDescription('Silinecek mesaj sayısı (1-100)').setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

  name: 'clear',
  subname: ["temizle", "sil"],
  description: 'Kanaldaki mesajları temizler.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.ManageMessages)) {
        return ctx.reply({ content: '❌ Bu komutu kullanmak için **Mesajları Yönet** iznine sahip olmalısın.', ephemeral: true });
    }

    const amount = ctx.getInteger('miktar');

    if (amount < 1 || amount > 100) {
        return ctx.reply({ content: '❌ Lütfen 1 ile 100 arasında bir sayı girin.', ephemeral: true });
    }

    try {
        const deleted = await ctx.channel.bulkDelete(amount, true);
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`🧹 **${deleted.size}** adet mesaj başarıyla silindi. (14 günden eski mesajlar silinemez)`)
            .setFooter({ text: `${ctx.user.tag} tarafından temizlendi.` });

        const replyMsg = await ctx.reply({ embeds: [embed], fetchReply: true });
        
        setTimeout(() => {
            replyMsg.delete().catch(() => {});
        }, 5000);

    } catch (error) {
        console.error('Clear hatası:', error);
        await ctx.reply({ content: '❌ Mesajlar silinirken bir hata oluştu.', ephemeral: true });
    }
  },
};
