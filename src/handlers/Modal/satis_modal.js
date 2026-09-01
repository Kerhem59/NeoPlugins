const { Routes, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const JsonManager = require('../../../Database/SuperCore/JsonManager');
const dbManager = require('../../../Database/SuperCore/JsonDatabaseManager');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = {
    customId: 'satis_modal_',
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const productId = interaction.customId.replace('satis_modal_', '');
        
        // Ürünü veritabanından bul
        const product = dbManager.getOne('store_products', { guild_id: interaction.guildId, id: Number(productId) }) 
            || dbManager.getOne('store_products', { guild_id: interaction.guildId, name: productId }); // Fallback if id was not used
            
        if (!product) {
            return interaction.editReply({ content: '❌ Ürün bulunamadı.' });
        }

        const urunAdi = product.name;
        const fiyat = product.price;

        const musteri = interaction.fields.getTextInputValue('musteri');
        const notlar = interaction.fields.getTextInputValue('notlar');

        // Veritabanından log kanalını bul
        const jsonManager = new JsonManager();
        const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};
        const logChannelId = settings.satisLogKanali;

        if (!logChannelId) {
            return interaction.editReply({ content: '❌ Satış log kanalı ayarlanmamış. Lütfen önce `/satis-kur` komutunu kullanarak sistemi kurun.' });
        }

        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (!logChannel) {
            return interaction.editReply({ content: '❌ Ayarlanan log kanalı bulunamadı. Silinmiş olabilir, lütfen tekrar `/satis-kur` yapın.' });
        }

        let isDiscordId = /^\d{17,19}$/.test(musteri);
        let musteriMetni = isDiscordId ? `<@${musteri}>` : musteri;

        // Satışı veritabanına kaydet
        const saleRecord = {
            guild_id: interaction.guildId,
            product_id: productId,
            product_name: urunAdi,
            price: fiyat,
            customer: musteri,
            notes: notlar,
            date: Date.now()
        };
        dbManager.insert('sales', saleRecord);

        // Canvas ile fatura oluştur
        const canvas = createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        // Arka plan
        ctx.fillStyle = '#1e2124';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Süsleme (Sol taraf yeşil çizgi)
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(0, 0, 10, canvas.height);

        // Başlık
        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('SATIS FATURASI / MAKBUZ', 40, 50);

        // Tarih
        const dateStr = new Date().toLocaleDateString('tr-TR');
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Tarih: ${dateStr}`, 550, 45);

        // Ürün Adı
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Ürün: ${urunAdi}`, 40, 110);

        // Fiyat
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(`Fiyat: ${fiyat}`, 40, 150);

        // Müşteri (Eğer ID ise düz ID yazar, isimse isim yazar)
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Müşteri: ${musteri}`, 40, 190);

        // Alt bilgi
        ctx.font = 'italic 14px sans-serif';
        ctx.fillStyle = '#888888';
        ctx.fillText(`${interaction.guild.name} güvencesiyle. Bizi tercih ettiğiniz için teşekkürler.`, 40, 230);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'fatura.png' });

        // Container oluştur
        const container = new ContainerBuilder()
            .setAccentColor(0xf1c40f); 

        let content = `## 🎉 Yeni Bir Satış Gerçekleşti!\n`;
        content += `**${urunAdi}** başarıyla satıldı! Bizi tercih ettiğiniz için teşekkür ederiz.\n\n`;
        content += `📦 **Ürün / Sunucu:** ${urunAdi}\n`;
        content += `💰 **Fiyat:** ${fiyat}\n`;
        content += `👤 **Müşteri:** ${musteriMetni}\n`;

        if (notlar) {
            content += `📝 **Ek Notlar:** ${notlar}\n`;
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content)
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ⬢ ${interaction.guild.name} • Satış Sistemi`)
        );

        try {
            // Log kanalına mesajı ve resmi gönder
            // Container ile beraber attachment göndermek için normal send kullanıyoruz
            // çünkü rest.post ile attachment eklemek daha karmaşık
            // Container'ın toJSON'u normal API ile uyumlu olmalı, değilse embed'e fallback yapmalıyız
            // Ancak DiscordJS v14.27'de Container tam desteklenmeyebilir normal send içinde,
            // NeoPlugins rest ile gönderiyor genelde. Faturayı normal attachment olarak yollayalım.
            await logChannel.send({ 
                content: `> **${urunAdi}** - Satış Faturası 🎉`,
                files: [attachment] 
            });

            await interaction.client.rest.post(Routes.channelMessages(logChannelId), {
                body: {
                    flags: 32768,
                    components: [container.toJSON()]
                }
            });
            
            await interaction.editReply({ content: `✅ Satış başarıyla eklendi, kaydedildi ve fatura <#${logChannelId}> kanalına gönderildi.` });

            // Müşteriye DM at
            if (isDiscordId) {
                try {
                    const user = await interaction.client.users.fetch(musteri);
                    if (user) {
                        const dmRow = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`musteri_degerlendir_${productId}`)
                                .setLabel('Ürünü Değerlendir')
                                .setEmoji('⭐')
                                .setStyle(ButtonStyle.Primary)
                        );
                        await user.send({
                            content: `Merhaba! **${interaction.guild.name}** sunucusundan **${urunAdi}** adlı ürünü satın aldığınızı görüyoruz. Bizi tercih ettiğiniz için teşekkür ederiz!\n\nAşağıdaki butona tıklayarak deneyiminizi puanlayabilir ve yorumunuzu bizimle paylaşabilirsiniz.`,
                            components: [dmRow]
                        });
                    }
                } catch (dmErr) {
                    console.log(`Müşteriye DM atılamadı: ${musteri}`);
                }
            }

        } catch (error) {
            console.error('Satış mesajı gönderilemedi:', error);
            await interaction.editReply({ content: '❌ Mesaj log kanalına gönderilirken bir hata oluştu.' });
        }
    }
};
