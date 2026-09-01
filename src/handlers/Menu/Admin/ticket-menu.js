const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'ticket_',
    async execute(interaction) {
        const type = interaction.values[0];

        const modal = new ModalBuilder()
            .setCustomId(`ticket_modal_${type}`)
            .setTitle(`${type} Talebi`);

        const usernameInput = new TextInputBuilder()
            .setCustomId('ticket_username')
            .setLabel('Kullanıcı Adınız (Discord / Steam)')
            .setPlaceholder('Discord veya Steam adınızı / Steam64ID girin...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        let talepInput = new TextInputBuilder()
            .setCustomId('ticket_talep')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        let reasonInput = new TextInputBuilder()
            .setCustomId('ticket_reason')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMinLength(5);

        if (type === 'Satis-Siparis') {
            talepInput.setLabel('Satın Almak İstediğiniz Plugin / Paket')
                .setPlaceholder('Örn: Advanced Kits, AntiCheat, VIP Sistemi');
            reasonInput.setLabel('Ödeme Yöntemi & İletmek İstediğiniz Not')
                .setPlaceholder('Örn: IBAN / Papara / Kredi Kartı ile ödeme yapmak istiyorum...');
        } else if (type === 'Teknik-Destek') {
            talepInput.setLabel('Sorun Yaşadığınız Plugin & RocketMod Sürümü')
                .setPlaceholder('Örn: DeathMessages v1.2.0 - RocketMod 4.9.3');
            reasonInput.setLabel('Hata Açıklaması & Hata Logu (Kısaca)')
                .setPlaceholder('Karşılaştığınız hata çıktısını veya console logunu buraya ekleyin...');
        } else if (type === 'Ozel-Plugin') {
            talepInput.setLabel('İstediğiniz Özel Pluginin Adı & Amacı')
                .setPlaceholder('Örn: Özel Klan Sistemi / Özel Görev Plugini');
            reasonInput.setLabel('Plugin Özellikleri & Bütçeniz')
                .setPlaceholder('İstediğiniz tüm komutları, özellikleri ve bütçenizi detaylandırın...');
        } else if (type === 'Lisans-IP') {
            talepInput.setLabel('Plugin Adı & Eski Sunucu IP')
                .setPlaceholder('Örn: CustomKits - Eski IP: 185.198.x.x:27015');
            reasonInput.setLabel('Yeni Sunucu IP / Port Bilgisi')
                .setPlaceholder('Eklentinin tanımlanmasını istediğiniz yeni sunucu IP:Port bilgisi...');
        } else {
            talepInput.setLabel('Talep Konusu / Başlık')
                .setPlaceholder('Talebinizin kısa özeti...');
            reasonInput.setLabel('Destek Talebi Açıklaması')
                .setPlaceholder('Lütfen sorunuzu veya danışmak istediğiniz konuyu detaylıca açıklayın...');
        }

        modal.addComponents(
            new ActionRowBuilder().addComponents(usernameInput),
            new ActionRowBuilder().addComponents(talepInput),
            new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
    }
};
