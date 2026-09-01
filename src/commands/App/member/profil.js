const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const CanvasBuilder = require('../../../utils/canvas/CanvasBuilder');
const EconomySystem = require('../../../utils/EconomySystem');
const LevelSystem = require('../../../utils/LevelSystem');
const { getAfkReason } = require('../../../utils/afk/AfkSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profil')
        .setDescription('Profilinizi veya başka birinin profilini görüntüleyin')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Profilini görmek istediğiniz kullanıcı')
                .setRequired(false)
        ),

    name: 'profil',
    subname: ['profile', 'p'],
    description: 'Profilinizi görüntüleyin',
    usage: '[@kullanıcı]',

    async execute(ctx) {
        await ctx.deferReply();

        try {
            const targetUser = ctx.getUser('kullanıcı', 0) || ctx.user;
            const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);

            if (!member) {
                return ctx.editReply('❌ Kullanıcı bulunamadı.');
            }

            // Verileri çekiyoruz
            const userEconomy = await EconomySystem.getData(ctx.guild.id, targetUser.id);
            const levelData = await LevelSystem.getData(ctx.guild.id, targetUser.id);
            const xpNeeded = await LevelSystem.getXpNeeded(ctx.guild.id, targetUser.id);
            const rank = await LevelSystem.getRank(ctx.guild.id, targetUser.id);
            const afkInfo = await getAfkReason(targetUser);

            const profileData = {
                coins: userEconomy.coins || 0,
                totalMessages: userEconomy.totalMessages || 0,
                totalTickets: userEconomy.totalTickets || 0,
                level: levelData.level || 0,
                xp: levelData.xp || 0,
                xpNeeded: xpNeeded || 100,
                rank: rank || 1,
                isAfk: !!afkInfo,
                afkReason: afkInfo?.reason || null
            };

            const buffer = await CanvasBuilder.createProfileCard(member, profileData);
            const attachment = new AttachmentBuilder(buffer, { name: 'profil.png' });

            await ctx.editReply({ files: [attachment] });
        } catch (error) {
            console.error('Profil komutu hatası:', error);
            await ctx.editReply('❌ Profil kartı oluşturulurken bir hata oluştu.').catch(() => {});
        }
    },
};
