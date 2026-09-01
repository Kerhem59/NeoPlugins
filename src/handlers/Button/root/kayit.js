const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = [
    {
        customId: 'kayit_ol_baslat',
        async execute(interaction) {
            const modal = new ModalBuilder()
                .setCustomId('kayit_modal')
                .setTitle('Sunucu Kayıt Formu');

            const steamIdInput = new TextInputBuilder()
                .setCustomId('steam_id')
                .setLabel('SteamID64 numaranız')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('7656119xxxxxxxxxx')
                .setRequired(true)
                .setMinLength(17)
                .setMaxLength(17);

            const icNameInput = new TextInputBuilder()
                .setCustomId('ic_name')
                .setLabel('Karakter İsminiz / Adınız')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Örn: Kerem Yılmaz')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(steamIdInput);
            const secondActionRow = new ActionRowBuilder().addComponents(icNameInput);

            modal.addComponents(firstActionRow, secondActionRow);

            await interaction.showModal(modal);
        }
    }
];
