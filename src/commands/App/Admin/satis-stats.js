const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('satis-stats')
        .setDescription('Mağaza satış istatistiklerinizi ve toplam cironuzu gösterir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    name: 'satis-stats',
    description: 'Satış istatistikleri ve ciro durumu',

    async execute(ctx) {
        await ctx.deferReply({ ephemeral: true });

        if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
            return ctx.editReply('❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.');
        }

        const sales = dbManager.get('sales', { guild_id: ctx.guild.id }) || [];

        if (sales.length === 0) {
            return ctx.editReply('❌ Sisteme kayıtlı henüz hiçbir satış bulunmuyor.');
        }

        let totalRevenue = 0;
        let productCounts = {};

        sales.forEach(sale => {
            // Fiyat metninden sadece sayıları ayıkla (Örn: "150 TL" -> 150)
            const numericPrice = parseFloat(sale.price.replace(/[^\d.-]/g, ''));
            if (!isNaN(numericPrice)) {
                totalRevenue += numericPrice;
            }

            // En çok satılanı bulmak için say
            if (!productCounts[sale.product_name]) {
                productCounts[sale.product_name] = 0;
            }
            productCounts[sale.product_name]++;
        });

        // En çok satan ürünü bul
        let topProduct = 'Yok';
        let maxCount = 0;
        for (const [name, count] of Object.entries(productCounts)) {
            if (count > maxCount) {
                topProduct = name;
                maxCount = count;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Satış İstatistikleri ve Raporu')
            .setColor('#3498db')
            .setThumbnail(ctx.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '🛒 Toplam Yapılan Satış', value: `**${sales.length} adet**`, inline: true },
                { name: '💰 Tahmini Toplam Ciro', value: `**${totalRevenue.toLocaleString()} birim**\n*(Sayısal olarak hesaplanmıştır)*`, inline: true },
                { name: '🏆 En Çok Satan Ürün', value: `**${topProduct}** (${maxCount} kez satıldı)`, inline: false }
            )
            .setFooter({ text: `${ctx.guild.name} • Ciro Takip Sistemi`, iconURL: ctx.client.user.displayAvatarURL() })
            .setTimestamp();

        // Son 5 satışı listele (Eğer isterseniz)
        const recentSales = sales.sort((a, b) => b.date - a.date).slice(0, 5);
        let recentStr = '';
        recentSales.forEach((s, index) => {
            const dateObj = new Date(s.date);
            recentStr += `\`${index+1}.\` **${s.product_name}** - ${s.price} *(<@${s.customer.replace(/[^\d]/g, '') || s.customer}>)*\n`;
        });

        if (recentStr) {
            embed.addFields({ name: '⏱️ Son 5 Satış', value: recentStr, inline: false });
        }

        await ctx.editReply({ embeds: [embed] });
    },
};
