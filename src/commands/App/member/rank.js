const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const CanvasBuilder = require('../../../utils/canvas/CanvasBuilder');
const LevelSystem = require('../../../utils/LevelSystem');
const EconomySystem = require('../../../utils/EconomySystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Seviye ve XP durumunuzu görüntüleyin')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Rankını görmek istediğiniz kullanıcı')
                .setRequired(false)
        ),

    name: 'rank',
    subname: ['seviye', 'level', 'xp'],
    description: 'Seviye ve XP bilginizi görüntüleyin',
    usage: '[@kullanıcı]',

    async execute(ctx) {
        await ctx.deferReply();

        try {
            const targetUser = ctx.getUser('kullanıcı', 0) || ctx.user;
            const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);

            if (!member) {
                return ctx.editReply('❌ Kullanıcı bulunamadı.');
            }

            // Ekonomi ve Seviye verilerini çekiyoruz
            const userEconomy = await EconomySystem.getData(ctx.guild.id, targetUser.id);
            const levelData = await LevelSystem.getData(ctx.guild.id, targetUser.id);
            const xpNeeded = await LevelSystem.getXpNeeded(ctx.guild.id, targetUser.id);
            const rank = await LevelSystem.getRank(ctx.guild.id, targetUser.id);

            const rankData = {
                level: levelData.level || 0,
                xp: levelData.xp || 0,
                xpNeeded: xpNeeded || 100,
                rank: rank || 1,
                totalMessages: userEconomy.totalMessages || 0
            };

            const buffer = await CanvasBuilder.createRankCard(member, rankData);
            const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });

            await ctx.editReply({ files: [attachment] });
        } catch (error) {
            console.error('Rank komutu hatası:', error);
            await ctx.editReply('❌ Rank kartı oluşturulurken bir hata oluştu.').catch(() => {});
        }
    },
};
