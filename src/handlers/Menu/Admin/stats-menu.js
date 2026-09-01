const { EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
    value: 'stats_week_select',
    async execute(interaction) {
        const weekKey = interaction.values[0];
        const jsonManager = new JsonManager();
        const guildId = interaction.guild.id;
        const stats = await jsonManager.get('ticket/stats', guildId) || {};
        
        const weekStats = stats[weekKey];
        if (!weekStats || Object.keys(weekStats).length === 0) {
            return interaction.update({ 
                content: `❌ **${weekKey}** haftasına ait herhangi bir istatistik verisi bulunamadı.`, 
                embeds: [], 
                components: [] 
            });
        }

        const leaderboard = Object.entries(weekStats)
            .map(([userId, data]) => {
                const avgRating = data.ratings.length > 0 
                    ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)
                    : 'Puan Yok';
                return { userId, count: data.solved || 0, avgRating };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const embed = new EmbedBuilder()
            .setTitle(`📊 Destek İstatistikleri | ${weekKey}`)
            .setColor('#2ECC71') // Yeşil (Arşivden çekildi)
            .setDescription(leaderboard.map((u, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                return `${medal} <@${u.userId}>: **${u.count}** Talep | ⭐ **${u.avgRating}**`;
            }).join('\n'))
            .setTimestamp()
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

        await interaction.update({ embeds: [embed], components: [] });
    }
};
