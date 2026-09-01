const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, Routes, ActionRowBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, StringSelectMenuBuilder } = require('@discordjs/builders');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-kur')
        .setDescription('Unturned Plugin Satış & Destek panelini kurar')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    name: 'ticket-kur',
    description: 'Unturned Plugin Satış & Destek panelini kurar',

    async execute(ctx) {
        await ctx.deferReply({ ephemeral: true });

        if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
            return ctx.editReply('❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.');
        }

        const jsonManager = new JsonManager();
        const settings = await jsonManager.get('server/settings', ctx.guild.id) || {};

        if (!settings.ticketCategory && !settings.ticketChannel) {
            try {
                const { ChannelType } = require('discord.js');
                const newCategory = await ctx.guild.channels.create({
                    name: '🎫 ─── DESTEK TALEPLERİ ───',
                    type: ChannelType.GuildCategory
                });
                settings.ticketCategory = newCategory.id;
                await jsonManager.set('server/settings', ctx.guild.id, settings);
            } catch (catErr) {
                return ctx.editReply('❌ Önce `/ayarla` panelinden **Ticket Kategorisi** veya **Ticket Kanalı** belirlemelisin.');
            }
        }

        try {
            const container = new ContainerBuilder()
                .setAccentColor(0x0088FF);

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🛒 ${ctx.guild.name} | Satış & Teknik Destek Merkezi\n` +
                    'Unturned sunucunuz için en kaliteli ve optimize eklentileri burada bulabilirsiniz.\n' +
                    'Satın alım yapmak, özel plugin siparişi vermek veya teknik destek almak için aşağıdaki menüden ilgili kategoriyi seçiniz.\n\n' +
                    '🛒 **Plugin Satın Alım & Sipariş** — *Yeni eklenti siparişi ve ödeme.*\n' +
                    '🔧 **Teknik Destek & Hata Bildirimi** — *Kurulum desteği ve hata çözümleri.*\n' +
                    '💡 **Özel (Custom) Plugin Siparişi** — *İsteğinize özel sıfırdan eklenti kodlama.*\n' +
                    '🔑 **Lisans & IP Güncelleme** — *Sunucu IP/Port değişiklik bildirimleri.*\n' +
                    '💬 **Genel Sorular & Bilgi** — *Eklentiler hakkında genel sorularınız.*\n\n' +
                    '⚡ *Lütfen talebinizi oluşturduktan sonra detayları iletiniz. Ekibimiz en kısa sürede yardımcı olacaktır.*'
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('ticket_select')
                            .setPlaceholder('🎫 İşlem Yapmak İstediğiniz Kategoriyi Seçin...')
                            .addOptions([
                                { label: 'Plugin Satın Alım & Sipariş', value: 'Satis-Siparis', emoji: { name: '🛒' }, description: 'Yeni plugin satın alma ve ödeme işlemleri.' },
                                { label: 'Teknik Destek & Hata Bildirimi', value: 'Teknik-Destek', emoji: { name: '🔧' }, description: 'Kurulum sorunları, RocketMod logları ve buglar.' },
                                { label: 'Özel (Custom) Plugin Siparişi', value: 'Ozel-Plugin', emoji: { name: '💡' }, description: 'Sunucunuza özel sıfırdan eklenti yazdırma talebi.' },
                                { label: 'Lisans & IP Güncelleme', value: 'Lisans-IP', emoji: { name: '🔑' }, description: 'Satın alınan eklentiler için IP değişiklik talepleri.' },
                                { label: 'Genel Sorular & Bilgi', value: 'Genel-Soru', emoji: { name: '💬' }, description: 'Eklentiler hakkında genel soru ve danışma.' }
                            ]),
                    ),
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} • Profesyonel Unturned Eklentileri & Destek`)
            );

            await ctx.editReply({ content: '✅ Unturned Plugin Destek Paneli başarıyla oluşturuldu.' });
            
            // Container'ı rest API ile gönder (flags: 32768 gerekli)
            await ctx.client.rest.post(Routes.channelMessages(ctx.channel.id), {
                body: {
                    flags: 32768,
                    components: [container.toJSON()]
                }
            });
        } catch (error) {
            console.error('Ticket setup error:', error);
            await ctx.editReply('❌ Panel oluşturulurken bir hata oluştu: ' + error.message);
        }
    },
};
