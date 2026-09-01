const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const LevelSystem = require('../../../utils/LevelSystem');
const CanvasBuilder = require('../../../utils/canvas/CanvasBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top')
        .setDescription('Sunucu seviye sıralamasını görüntüleyin'),

    name: 'top',
    subname: ['sıralama', 'leaderboard', 'lb'],
    description: 'Sunucu seviye sıralamasını görüntüleyin',
    usage: '',

    async execute(ctx) {
        await ctx.deferReply();

        try {
            const leaderboard = await LevelSystem.getLeaderboard(ctx.guild.id);
            const top5Raw = leaderboard.slice(0, 5);

            if (top5Raw.length === 0) {
                return await ctx.editReply('Henüz sıralama verisi yok. Sohbet ederek XP kazanın!');
            }

            // Kullanıcı verilerini hazırla
            const topUsers = [];
            for (const entry of top5Raw) {
                const user = await ctx.client.users.fetch(entry.user_id).catch(() => null);
                topUsers.push({
                    tag: user ? user.username : 'Bilinmeyen',
                    avatarURL: user ? user.displayAvatarURL({ extension: 'png', size: 128 }) : null,
                    level: entry.level,
                    xp: entry.totalXp
                });
            }

            const buffer = await CanvasBuilder.createLeaderboardCard(topUsers, ctx.guild.name);
            const attachment = new AttachmentBuilder(buffer, { name: 'sıralama.png' });

            await ctx.editReply({ files: [attachment] });
        } catch (error) {
            console.error('Top komutu hatası:', error);
            await ctx.editReply('❌ Sıralama kartı oluşturulurken bir hata oluştu.').catch(() => {});
        }
    },
};
