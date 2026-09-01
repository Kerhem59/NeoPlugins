const { ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');
const dbManager = require('../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
    customId: 'satis_ekle',
    
    async execute(interaction) {
        // Sadece yöneticiler kullanabilsin
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için yetkiniz yok.', ephemeral: true });
        }

        // Ürünleri çek
        const products = dbManager.get('store_products', { guild_id: interaction.guildId });

        if (!products || products.length === 0) {
            return interaction.reply({ content: '❌ Sistemde hiç ürün bulunamadı. Lütfen önce `/urun-ekle` komutu ile ürün ekleyin.', ephemeral: true });
        }

        // Açılır menü seçeneklerini hazırla
        const options = products.map(product => {
            return {
                label: product.name.substring(0, 100),
                description: `Fiyat: ${product.price}`.substring(0, 100),
                value: product.id ? product.id.toString() : product.name.substring(0, 100) // Fallback to name if id is missing
            };
        });

        // Discord limit (max 25 options per select menu)
        const limitedOptions = options.slice(0, 25);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('satis_urun_secimi')
            .setPlaceholder('🛒 Satışı yapılan ürünü seçin...')
            .addOptions(limitedOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ 
            content: 'Lütfen sattığınız ürünü aşağıdaki menüden seçin:', 
            components: [row],
            ephemeral: true
        });
    }
};
