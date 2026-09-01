const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const EconomySystem = require('../../../utils/EconomySystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coin-ekle')
        .setDescription('Bir kullanıcıya coin ekler (Yönetici)')
        .addUserOption(option => 
            option.setName('kullanıcı')
                .setDescription('Coin eklenecek kullanıcı')
                .setRequired(true)
        )
        .addIntegerOption(option => 
            option.setName('miktar')
                .setDescription('Eklenecek miktar')
                .setRequired(true)
                .setMinValue(1)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    name: 'coin-ekle',
    description: 'Bir kullanıcıya coin ekler (Yönetici)',
    usage: '[@kullanıcı] [miktar]',

    async execute(ctx) {
        // Yetki kontrolü (Prefix komutlar için)
        if (!ctx.hasPermission(PermissionFlagsBits.Administrator)) {
            return ctx.reply({ content: '❌ Bu komutu sadece yöneticiler kullanabilir.', ephemeral: true });
        }

        const targetUser = ctx.getUser('kullanıcı', 0);
        const amount = ctx.getInteger('miktar', 1);

        if (!targetUser) {
            return ctx.reply({ content: '❌ Lütfen geçerli bir kullanıcı belirtin!', ephemeral: true });
        }

        const newBalance = EconomySystem.addCoins(ctx.guild.id, targetUser.id, amount);

        const embed = new EmbedBuilder()
            .setTitle('✅ Coin Eklendi')
            .setDescription(`${targetUser} kullanıcısına **${amount} Coin** eklendi.\nGüncel bakiye: **${newBalance} Coin**`)
            .setColor('#2ECC71')
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    },
};
