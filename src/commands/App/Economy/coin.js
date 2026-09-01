const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const EconomySystem = require('../../../utils/EconomySystem');
const CanvasBuilder = require('../../../utils/canvas/CanvasBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coin')
        .setDescription('Mevcut coin miktarınızı gösterir')
        .addUserOption(option => 
            option.setName('kullanıcı')
                .setDescription('Bakiyesine bakılacak kullanıcı')
                .setRequired(false)
        ),

    name: 'coin',
    subname: ["para", "c", "bakiye"],
    description: 'Mevcut coin miktarınızı gösterir',
    usage: '[@kullanıcı]',

    async execute(ctx) {
        await ctx.deferReply();
        const targetUser = ctx.getUser('kullanıcı', 0) || ctx.user;
        const member = await ctx.guild.members.fetch(targetUser.id);
        const balance = await EconomySystem.getBalance(ctx.guild.id, targetUser.id);

        // Kart verisi
        const economyData = {
            coins: balance,
            bank: 0 // Şu anlık banka sistemi yok ama kartta yer ayırdık
        };

        const buffer = await CanvasBuilder.createEconomyCard(member, economyData);
        const attachment = new AttachmentBuilder(buffer, { name: 'banka-kartı.png' });

        await ctx.editReply({ files: [attachment] });
    },
};
