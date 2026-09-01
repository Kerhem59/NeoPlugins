const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'musteri_degerlendir_',
    
    async execute(interaction) {
        const productId = interaction.customId.replace('musteri_degerlendir_', '');

        const modal = new ModalBuilder()
            .setCustomId(`degerlendirme_modal_${productId}`)
            .setTitle('Ürün Değerlendirmesi');

        // Puan (1-5)
        const puanInput = new TextInputBuilder()
            .setCustomId('puan')
            .setLabel('Puanınız (1 ile 5 arası bir rakam)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Örn: 5')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(1);

        // Yorum
        const yorumInput = new TextInputBuilder()
            .setCustomId('yorum')
            .setLabel('Yorumunuz')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ürün hakkındaki düşüncelerinizi buraya yazın...')
            .setRequired(true)
            .setMaxLength(1000);

        const puanRow = new ActionRowBuilder().addComponents(puanInput);
        const yorumRow = new ActionRowBuilder().addComponents(yorumInput);

        modal.addComponents(puanRow, yorumRow);

        await interaction.showModal(modal);
    }
};
