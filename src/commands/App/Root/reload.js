const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Emote = require('../../../config/genaral/main.json').emotes_custom;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Botu yeniden başlatır')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    name: 'reload',
    description: 'Botu yeniden başlatır',

    async execute(ctx) {
        if (!ctx.hasPermission(PermissionFlagsBits.Administrator)) {
            return ctx.reply({ content: 'Bu komutu kullanmak için yönetici olma gerekli!', ephemeral: true });
        }
        await ctx.reply(`${Emote.LoadingEmote || '🔄'} Bot yeniden başlatılıyor...`);
        process.exit(1);
    },
};
