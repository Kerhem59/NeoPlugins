const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, Routes } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

// Unturned Plugin Satış ve Destek Kategori Başlıkları
const TICKET_TYPES = {
    'Satis-Siparis': { emoji: '🛒', label: 'Plugin Satın Alım & Sipariş' },
    'Teknik-Destek': { emoji: '🔧', label: 'Teknik Destek & Hata Bildirimi' },
    'Ozel-Plugin':   { emoji: '💡', label: 'Özel (Custom) Plugin Siparişi' },
    'Lisans-IP':     { emoji: '🔑', label: 'Lisans & IP Güncelleme' },
    'Genel-Soru':    { emoji: '💬', label: 'Genel Sorular & Bilgi' },
};

module.exports = {
    customId: 'ticket_modal_', // Prefix handler
    async execute(interaction) {
        const type = interaction.customId.replace('ticket_modal_', '');
        const talep   = interaction.fields.getTextInputValue('ticket_talep');
        const reason  = interaction.fields.getTextInputValue('ticket_reason');
        const username = interaction.fields.getTextInputValue('ticket_username');

        const typeInfo = TICKET_TYPES[type] || { emoji: '🎫', label: type };

        // Panel mesajının menüsünü sıfırla (seçilmemiş hale)
        if (interaction.message) {
            await interaction.message.edit({ components: interaction.message.components }).catch(() => {});
        }

        const jsonManager = new JsonManager();
        const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};

        if (!settings.ticketCategory && !settings.ticketChannel) {
            // Otomatik kategori oluştur
            try {
                const newCategory = await interaction.guild.channels.create({
                    name: '🎫 ─── DESTEK TALEPLERİ ───',
                    type: ChannelType.GuildCategory
                });
                settings.ticketCategory = newCategory.id;
                await jsonManager.set('server/settings', interaction.guild.id, settings);
            } catch (catErr) {
                return interaction.reply({ content: '❌ Sistem henüz kurulmamış. Önce `/ayarla` ile kategori veya kanal belirleyin.', ephemeral: true });
            }
        }

        // Kullanıcının zaten açık bir talebi var mı?
        const safeUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const existingChannel = interaction.guild.channels.cache.find(
            c => c.name === `talep-${safeUsername}` || c.name === `siparis-${safeUsername}`
        );
        if (existingChannel) {
            return interaction.reply({ content: `❌ Zaten açık bir talebiniz var: ${existingChannel}`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const staffRole = settings.ticketStaff;
            let finalChannel;
            const channelPrefix = type === 'Satis-Siparis' ? 'siparis' : 'talep';

            // --- Kanal oluşturma ---
            if (settings.ticketChannel) {
                const ticketCh = interaction.guild.channels.cache.get(settings.ticketChannel);
                if (!ticketCh) return interaction.editReply({ content: '❌ Ticket kanalı bulunamadı! `/ayarla` ile tekrar kurun.' });

                finalChannel = await ticketCh.threads.create({
                    name: `${channelPrefix}-${interaction.user.username}`,
                    autoArchiveDuration: 1440,
                    type: ChannelType.PrivateThread,
                    reason: `${interaction.user.tag} → ${typeInfo.label} talebi.`,
                });
                await finalChannel.members.add(interaction.user.id);

            } else if (settings.ticketCategory) {
                const category = interaction.guild.channels.cache.get(settings.ticketCategory);
                if (!category) return interaction.editReply({ content: '❌ Ticket kategorisi bulunamadı! `/ayarla` ile tekrar kurun.' });

                finalChannel = await interaction.guild.channels.create({
                    name: `${channelPrefix}-${safeUsername || interaction.user.id}`,
                    type: ChannelType.GuildText,
                    parent: settings.ticketCategory,
                    topic: `${interaction.user.tag} → ${typeInfo.label} | ID: ${interaction.user.id}`,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.AttachFiles,
                            ],
                        },
                        ...(staffRole ? [{
                            id: staffRole,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.AttachFiles,
                            ],
                        }] : []),
                    ],
                });
            } else {
                return interaction.editReply({ content: '❌ Sistem kurulmamış!' });
            }

            // --- Ticket İç Mesajı (ContainerBuilder) ---
            const staffMention = staffRole ? `<@&${staffRole}>` : '@here';
            const guildIcon = interaction.guild.iconURL({ dynamic: true, size: 256 });

            const ticketContainer = new ContainerBuilder();

            if (type === 'Satis-Siparis') {
                // Satış / Sipariş — Premium altın tema (satış sistemiyle uyumlu)
                ticketContainer.setAccentColor(0xf1c40f);

                ticketContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## 🛒 Yeni Sipariş Talebi\n` +
                        `Merhaba ${interaction.user}! Sipariş talebiniz oluşturuldu, ekibimiz en kısa sürede ilgilenecektir.\n`
                    )
                );

                ticketContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

                ticketContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `📦 **Ürün / Paket:** \`${talep}\`\n` +
                        `👤 **Müşteri:** \`${username}\`\n` +
                        `💳 **Ödeme & Notlar:**\n\`\`\`${reason}\`\`\``
                    )
                );

                ticketContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

            } else {
                // Diğer ticket türleri — Yeşil tema
                ticketContainer.setAccentColor(0x2ECC71);

                ticketContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${typeInfo.emoji} ${typeInfo.label}\n` +
                        `Merhaba ${interaction.user}! Talebiniz oluşturuldu, yetkili ekibimiz en kısa sürede ilgilenecektir.\n\n` +
                        `> 📌 **Kategori:** \`${typeInfo.label}\`\n` +
                        `> 👤 **Discord / Steam:** \`${username}\`\n` +
                        `> 📦 **Konu / Ürün:** \`${talep}\`\n\n` +
                        `**Açıklama & Detay:**\n\`\`\`${reason}\`\`\``
                    )
                );

                ticketContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
            }

            ticketContainer.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ticket_claim')
                            .setLabel('Talebi Üstlen')
                            .setEmoji({ name: '🙋' })
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('ticket_close')
                            .setLabel('Talebi Kapat')
                            .setEmoji({ name: '🔒' })
                            .setStyle(ButtonStyle.Secondary),
                    )
            );

            ticketContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# ⬢ ${interaction.guild.name} • ${type === 'Satis-Siparis' ? 'Satış & Sipariş' : 'Unturned Destek & Satış'}`)
            );

            // Mention'ı container'ın en üstüne TextDisplay olarak ekle
            const mentionDisplay = new TextDisplayBuilder().setContent(`${interaction.user} | ${staffMention}`);
            const containerJson = ticketContainer.toJSON();
            containerJson.components.unshift(mentionDisplay.toJSON());

            await interaction.client.rest.post(Routes.channelMessages(finalChannel.id), {
                body: {
                    flags: 32768,
                    components: [containerJson]
                }
            });

            // Kullanıcıya yanıt (ContainerBuilder)
            const replyContainer = new ContainerBuilder()
                .setAccentColor(0x2ECC71);
            replyContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `✅ Talebiniz başarıyla oluşturuldu!\n\n` +
                    `🔗 **Kanal:** ${finalChannel}\n` +
                    `${typeInfo.emoji} **Kategori:** \`${typeInfo.label}\``
                )
            );
            replyContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# ⬢ ${interaction.guild.name} • Destek Merkezi`)
            );

            await interaction.editReply({
                components: [replyContainer.toJSON()],
                flags: 32768
            });

            // --- Log Bildirimi ---
            if (settings.ticketLog) {
                const logChannel = interaction.guild.channels.cache.get(settings.ticketLog);
                if (logChannel) {
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x0088FF);
                    logContainer.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 📩 Yeni Talep / Sipariş Açıldı\n\n` +
                            `**👤 Kullanıcı:** ${interaction.user} (\`${interaction.user.id}\`)\n` +
                            `**🎫 Kategori:** ${typeInfo.emoji} \`${typeInfo.label}\`\n` +
                            `**🧵 Kanal:** ${finalChannel}\n` +
                            `**👤 Gönderen Adı:** \`${username}\`\n\n` +
                            `**📌 Konu / Ürün:**\n\`\`\`${talep}\`\`\`\n` +
                            `**📝 Açıklama:**\n\`\`\`${reason}\`\`\``
                        )
                    );
                    logContainer.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`-# ⬢ ${interaction.guild.name} • Ticket Log`)
                    );

                    await interaction.client.rest.post(Routes.channelMessages(logChannel.id), {
                        body: { flags: 32768, components: [logContainer.toJSON()] }
                    }).catch(err => console.error('Ticket log gönderme hatası:', err));
                }
            }

        } catch (error) {
            console.error('[Ticket] Oluşturma hatası:', error);
            await interaction.editReply({ content: '❌ Talep oluşturulurken bir hata oluştu: ' + error.message });
        }
    }
};
