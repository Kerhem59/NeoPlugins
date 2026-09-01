const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = [
    {
        customId: 'btn_set_chat_name',
        async execute(interaction) {
            const modal = new ModalBuilder()
                .setCustomId('modal_chat_name')
                .setTitle('Oyun İçi İsmimi Belirle');

            const nameInput = new TextInputBuilder()
                .setCustomId('input_chat_name')
                .setLabel('Karakter Adınız (Örn: Kerhem, Neo)')
                .setPlaceholder('Oyun içinde görünecek isminizi yazın...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(16);

            const row = new ActionRowBuilder().addComponents(nameInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    }
];
