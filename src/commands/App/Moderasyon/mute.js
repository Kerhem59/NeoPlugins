const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Belirtilen kullanıcıyı zaman aşımına uğratır (susturur).')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true))
    .addStringOption(opt => opt.setName('sure').setDescription('Süre (örn: 10m, 1h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Susturma sebebi').setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),

  name: 'mute',
  subname: ["timeout", "sustur"],
  description: 'Bir kullanıcıyı zaman aşımına uğratır.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.ModerateMembers)) {
        return ctx.reply({ content: '❌ Bu komutu kullanmak için **Üyeleri Zaman Aşımına Uğrat** iznine sahip olmalısın.', ephemeral: true });
    }

    const targetUser = ctx.getUser('kullanici');
    const duration = ctx.getString('sure');
    const reason = ctx.getString('sebep') || 'Sebep belirtilmedi.';
    
    const timeMs = ms(duration);
    if (!timeMs || timeMs < 10000 || timeMs > 2419200000) {
        return ctx.reply({ content: '❌ Geçersiz bir süre girdiniz! Lütfen en az 10 saniye, en fazla 28 gün girin (Örn: 10m, 1h, 1d).', ephemeral: true });
    }

    const targetMember = await ctx.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
        return ctx.reply({ content: '❌ Kullanıcı sunucuda bulunamadı!', ephemeral: true });
    }

    if (targetUser.id === ctx.user.id) {
        return ctx.reply({ content: '❌ Kendini susturamazsın!', ephemeral: true });
    }

    if (!targetMember.moderatable) {
        return ctx.reply({ content: '❌ Bu kullanıcıyı susturamıyorum. Rolü benimkinden yüksek olabilir.', ephemeral: true });
    }

    try {
        await targetMember.timeout(timeMs, `${ctx.user.tag} tarafından: ${reason}`);
        
        const embed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle('🔇 Üye Susturuldu')
            .setDescription(`**${targetUser.tag}** kullanıcısı zaman aşımına uğratıldı.`)
            .addFields(
                { name: 'Süre', value: duration, inline: true },
                { name: 'Sebep', value: reason, inline: true }
            )
            .setFooter({ text: `Susturan: ${ctx.user.tag}` })
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Timeout hatası:', error);
        await ctx.reply({ content: '❌ Kullanıcı susturulurken bir hata oluştu.', ephemeral: true });
    }
  },
};
