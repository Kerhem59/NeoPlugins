const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
    customId: 'rating_select',
    async execute(interaction) {
        const rating = parseInt(interaction.values[0]);
        const jsonManager = new JsonManager();
        const guildId = interaction.guild.id;
        
        // Sadece talebi açan kişi puan verebilir
        const topic = interaction.channel.name;
        if (topic.startsWith('talep-')) {
            const openerName = topic.replace('talep-', '').toLowerCase();
            if (interaction.user.username.toLowerCase() !== openerName) {
                return interaction.reply({ 
                    content: '❌ Bu talebi siz açmadığınız için puan veremezsiniz. Sadece talep sahibi puan verebilir.', 
                    ephemeral: true 
                });
            }
        }

        // Talebi üstlenen yetkiliyi bul
        const messages = await interaction.channel.messages.fetch({ limit: 50 });
        const claimMsg = messages.find(m => m.content.includes('üstlendi!') && m.mentions.users.size > 0);
        
        if (claimMsg) {
            const userId = claimMsg.mentions.users.first().id;
            if (userId) {
                const now = new Date();
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                const weekNum = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
                const weekKey = `${now.getFullYear()}-W${weekNum}`;

                const stats = await jsonManager.get('ticket/stats', guildId) || {};
                if (!stats[weekKey]) stats[weekKey] = {};
                if (!stats[weekKey][userId]) {
                    stats[weekKey][userId] = {
                        solved: 1, // Bu aşamaya gelindiyse en az 1 bilet çözülmüştür
                        ratings: [rating]
                    };
                } else {
                    if (!stats[weekKey][userId].ratings) stats[weekKey][userId].ratings = [];
                    stats[weekKey][userId].ratings.push(rating);
                    stats[weekKey][userId].solved = (stats[weekKey][userId].solved || 0) + 1;
                }
                await jsonManager.set('ticket/stats', guildId, stats);
            }
        }

        // Yanıt ver ve menüyü kaldır (V2 Container — content kullanılamaz)
        const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
        const { Routes } = require('discord.js');

        const ratingDoneContainer = new ContainerBuilder().setAccentColor(0x2ECC71);
        ratingDoneContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `✅ Geri bildiriminiz için teşekkürler! Puanınız kaydedildi: **${rating} Yıldız** ⭐`
            )
        );

        await interaction.update({ 
            components: [ratingDoneContainer.toJSON()],
            flags: 32768
        });
        
        // Silme butonunu Container olarak gönder
        const deleteContainer = new ContainerBuilder().setAccentColor(0xFF0000);
        deleteContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                'ℹ️ Talep kapatıldı ve puanlama tamamlandı. Kanalı silebilirsiniz.'
            )
        );
        deleteContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
        deleteContainer.addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Kanalı Sil').setStyle(ButtonStyle.Danger)
                )
        );

        await interaction.client.rest.post(Routes.channelMessages(interaction.channel.id), {
            body: { flags: 32768, components: [deleteContainer.toJSON()] }
        });

        // Puanlamadan sonra kullanıcıyı kanaldan çıkar
        if (topic.startsWith('talep-')) {
            const userName = topic.replace('talep-', '').toLowerCase();
            const member = interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === userName);
            if (member) {
                await interaction.channel.members.remove(member.id).catch(() => {});
            }
        }
    }
};
