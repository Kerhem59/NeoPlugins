const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'satis_urun_secimi',
    
    async execute(interaction) {
        const selectedProductId = interaction.values[0];

        const modal = new ModalBuilder()
            .setCustomId(`satis_modal_${selectedProductId}`)
            .setTitle('Müşteri Bilgileri');

        // Müşteri
        const musteriInput = new TextInputBuilder()
            .setCustomId('musteri')
            .setLabel('Müşteri (Discord ID)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Müşteriye özel mesaj gitmesi için ID girin (Örn: 123456789012345678)')
            .setRequired(true)
            .setMaxLength(100);

        // Ek Notlar
        const notlarInput = new TextInputBuilder()
            .setCustomId('notlar')
            .setLabel('Ek Notlar (Opsiyonel)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Takas, indirim vb. ek notlar...')
            .setRequired(false)
            .setMaxLength(500);

        const musteriRow = new ActionRowBuilder().addComponents(musteriInput);
        const notlarRow = new ActionRowBuilder().addComponents(notlarInput);

        modal.addComponents(musteriRow, notlarRow);

        await interaction.showModal(modal);
    }
};
