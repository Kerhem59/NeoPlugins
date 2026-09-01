const { EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../Database/SuperCore/JsonManager');
const dbManager = require('../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
    customId: 'degerlendirme_modal_',
    
    async execute(interaction) {
        const productId = interaction.customId.replace('degerlendirme_modal_', '');
        
        let puan = parseInt(interaction.fields.getTextInputValue('puan'));
        const yorum = interaction.fields.getTextInputValue('yorum');

        if (isNaN(puan) || puan < 1 || puan > 5) {
            puan = 5; // Hatalı girişte varsayılan 5 yıldız
        }

        const yildizlar = '⭐'.repeat(puan) + '🔲'.repeat(5 - puan);

        // Sunucuyu bulmak için botun cache'ini kullanamayız çünkü DM'den geliyor
        // Fakat jsonManager ile ayarları çekmek için guild_id gerekiyor.
        // Hangi sunucudan geldiğini productId'den çıkaramayabiliriz ama product tablosunda guild_id var!
        
        const products = dbManager.get('store_products', {});
        const product = products.find(p => p.id === Number(productId) || p.name === productId);
        
        if (!product) {
            return interaction.reply({ content: '❌ Ürün bulunamadı veya sistemden silinmiş.', ephemeral: true });
        }

        const guildId = product.guild_id;
        const guild = interaction.client.guilds.cache.get(guildId);
        
        if (!guild) {
            return interaction.reply({ content: '❌ Ürünün satıldığı sunucuya erişilemiyor.', ephemeral: true });
        }

        const jsonManager = new JsonManager();
        const settings = await jsonManager.get('server/settings', guildId) || {};
        const yorumChannelId = settings.yorumKanali;

        if (!yorumChannelId) {
            return interaction.reply({ content: '❌ Sunucuda yorum kanalı ayarlanmamış ancak değerlendirmeniz için teşekkürler!', ephemeral: true });
        }

        const yorumChannel = guild.channels.cache.get(yorumChannelId);
        
        if (!yorumChannel) {
            return interaction.reply({ content: '✅ Değerlendirmeniz için teşekkürler! (Yorum kanalı bulunamadı)', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🌟 Yeni Müşteri Değerlendirmesi!')
            .setColor('#2ecc71')
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Müşteri', value: `<@${interaction.user.id}>`, inline: true },
                { name: '📦 Ürün', value: product.name, inline: true },
                { name: '⭐ Puan', value: yildizlar, inline: false },
                { name: '💬 Yorum', value: `"${yorum}"`, inline: false }
            )
            .setFooter({ text: `${guild.name} • Müşteri Memnuniyeti`, iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        try {
            await yorumChannel.send({ embeds: [embed] });
            await interaction.reply({ content: '✅ Değerlendirmeniz başarıyla gönderildi. Teşekkür ederiz!', ephemeral: true });
        } catch (error) {
            console.error('Yorum gönderilemedi:', error);
            await interaction.reply({ content: '✅ Değerlendirmeniz alındı ancak sunucuya iletilemedi.', ephemeral: true });
        }
    }
};
