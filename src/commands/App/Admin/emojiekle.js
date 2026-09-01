const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emojiekle')
    .setDescription('Belirtilen özel Discord emojilerini sunucuya ekler.')
    .addStringOption(opt => opt.setName('emojiler').setDescription('Eklenecek emojiler (boşlukla ayırın)').setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageEmojisAndStickers),

  name: 'emojiekle',
  subname: ["emoji","ekle"],
  description: 'Belirtilen özel Discord emojilerini sunucuya ekler.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
        return ctx.reply('❌ Bu komutu kullanmak için **Emojileri Yönet** iznine sahip olmalısın.');
    }

    const emojiInputString = ctx.getString('emojiler') || '';
    const emojiMatches = emojiInputString.match(/<a?:[^:]+:\d+>/g);

    if (!emojiMatches || emojiMatches.length === 0) {
        return ctx.reply('❌ Geçerli bir emoji bulunamadı. Lütfen özel Discord emojileri girin (örnek: `<:emojiAdı:1234567890>`).');
    }

    const guild = ctx.guild;
    let addedEmojis = [];
    let failedEmojis = [];

    const progressEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Emoji Ekleme İşlemi Başlatıldı')
        .setDescription(`Toplam ${emojiMatches.length} emoji işlenecek...`)
        .addFields(
            { name: 'Eklenen Emojiler', value: 'Henüz yok', inline: true },
            { name: 'Başarısız Olanlar', value: 'Henüz yok', inline: true }
        )
        .setFooter({ text: `${ctx.user.tag} tarafından başlatıldı`, iconURL: ctx.user.displayAvatarURL() });

    const progressMessage = await ctx.reply({ embeds: [progressEmbed], fetchReply: true });

    for (const [index, emojiInput] of emojiMatches.entries()) {
        try {
            const emojiMatch = emojiInput.match(/<a?:([^:]+):(\d+)>/);
            if (!emojiMatch) continue;
            const [, emojiName, emojiId] = emojiMatch;
            const isAnimated = emojiInput.startsWith('<a:');
            const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
            const createdEmoji = await guild.emojis.create({
                attachment: emojiUrl,
                name: emojiName,
                reason: `${ctx.user.tag} tarafından eklendi`
            });
            addedEmojis.push({
                name: emojiName,
                id: createdEmoji.id,
                animated: isAnimated
            });
            await updateProgress(progressMessage, {
                current: index + 1,
                total: emojiMatches.length,
                added: addedEmojis.length,
                failed: failedEmojis.length,
                lastEmoji: `${isAnimated ? '<a:' : '<:'}${emojiName}:${createdEmoji.id}>`,
                user: ctx.user
            });
        } catch (error) {
            console.error('Emoji eklenirken hata:', error);
            const emojiName = emojiInput.match(/<a?:([^:]+):/)?.[1] || 'Bilinmeyen';
            failedEmojis.push({
                name: emojiName,
                reason: getErrorMessage(error)
            });
            await updateProgress(progressMessage, {
                current: index + 1,
                total: emojiMatches.length,
                added: addedEmojis.length,
                failed: failedEmojis.length,
                lastEmoji: `${emojiInput} (Başarısız)`,
                user: ctx.user
            });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const resultEmbed = new EmbedBuilder()
        .setColor(addedEmojis.length > 0 ? '#00FF00' : '#FF0000')
        .setTitle('Emoji Ekleme Sonuçları')
        .setDescription(`İşlem tamamlandı! ${addedEmojis.length} emoji başarıyla eklendi.`)
        .addFields(
            {
                name: `✅ Başarılı (${addedEmojis.length})`,
                value: addedEmojis.length > 0 
                    ? addedEmojis.map(e => `${e.animated ? '<a:' : '<:'}${e.name}:${e.id}>`).join(' ') 
                    : 'Yok',
                inline: false
            },
            {
                name: `❌ Başarısız (${failedEmojis.length})`,
                value: failedEmojis.length > 0 
                    ? failedEmojis.map(f => `\`${f.name}\`: ${f.reason}`).join('\n') 
                    : 'Yok',
                inline: false
            }
        )
        .setFooter({ text: `${ctx.user.tag} tarafından tamamlandı`, iconURL: ctx.user.displayAvatarURL() })
        .setTimestamp();

    if (ctx.interaction) {
        await ctx.interaction.editReply({ embeds: [resultEmbed] });
    } else {
        await progressMessage.edit({ embeds: [resultEmbed] });
    }
  },
};

function getErrorMessage(error) {
    if (error.message.includes('Maximum number of emojis reached')) {
        return 'Sunucu emoji sınırı dolu';
    }
    if (error.message.includes('Invalid image data') || error.message.includes('Invalid Asset')) {
        return 'Geçersiz emoji verisi';
    }
    if (error.message.includes('size') || error.message.includes('too large')) {
        return 'Dosya boyutu çok büyük';
    }
    if (error.message.includes('ENOENT') || error.message.includes('404')) {
        return 'Emoji bulunamadı';
    }
    return 'Bilinmeyen hata';
}

async function updateProgress(message, { current, total, added, failed, lastEmoji, user }) {
    const progressEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Emoji Ekleme İşlemi Devam Ediyor')
        .setDescription(`**Son işlenen emoji:** ${lastEmoji}\n\nİlerleme: **${current}/${total}** (${Math.round((current/total)*100)}%)`)
        .addFields(
            { name: 'Eklenen Emojiler', value: added > 0 ? added.toString() : 'Henüz yok', inline: true },
            { name: 'Başarısız Olanlar', value: failed > 0 ? failed.toString() : 'Henüz yok', inline: true }
        )
        .setFooter({ text: `${user.tag} tarafından başlatıldı`, iconURL: user.displayAvatarURL() });
    
    // Check if message is editable (for interaction context, we use the message object returned by fetchReply)
    await message.edit({ embeds: [progressEmbed] }).catch(console.error);
}
