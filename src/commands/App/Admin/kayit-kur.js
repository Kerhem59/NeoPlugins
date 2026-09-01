const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kayit-kur')
        .setDescription('Kayıt olma mesajını kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('📝 Neo Bots - Kayıt Sistemi')
            .setDescription('Sunucumuza hoş geldiniz! Sunucuda oynamak ve ödülünüzü almak için kayıt olmanız gerekmektedir.\n\n' +
                '**Neden Kayıt Olmalıyım?**\n' +
                '⬢ Karakter isminizi ve SteamID\'nizi eşleştirirsiniz.\n' +
                '⬢ İlk kayıt ödülü olan **100.000 TL** kazanırsınız.\n' +
                '⬢ Sunucudaki diğer özelliklerden tam yararlanırsınız.')
            .setColor('#2ECC71')
            .setImage('https://i.imgur.com/x0XzS2b.png') // Örnek görsel
            .setFooter({ text: 'Aşağıdaki butona tıklayarak kaydınızı başlatın.' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('kayit_ol_baslat')
                    .setLabel('Kayıt Ol')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📝')
            );

        await interaction.reply({ content: 'Kayıt sistemi mesajı oluşturuldu.', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    },
};
