const { PermissionsBitField, ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

// Güvenli etkileşim güncelleme fonksiyonu (Geçici ağ hatalarına karşı koruma)
async function safeUpdate(interaction, payload, maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await interaction.update(payload);
        } catch (err) {
            if ((err.code === 'ECONNRESET' || err.message?.includes('ECONNRESET')) && i < maxRetries - 1) {
                await new Promise(res => setTimeout(res, 500));
                continue;
            }
            throw err;
        }
    }
}

/**
 * Ayar alt paneli için ContainerBuilder oluşturur
 */
function buildSettingsContainer(title, description, accentColor, actionRows) {
    const container = new ContainerBuilder()
        .setAccentColor(accentColor || 0x0088FF);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${title}\n${description}`)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
    );

    // ActionRow'lar Container dışında kalmalı (ChannelSelect, RoleSelect V2 Container içinde çalışmıyor)
    // Bu yüzden Container + ekstra component rows döndürüyoruz
    return { container, actionRows };
}

module.exports = [
    {
        customId: 'settings_category_select',
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi yapmak için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }

            const category = interaction.values[0];
            const jsonManager = new JsonManager();
            const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};

            try {
                let container, actionRows;

                switch (category) {
                    case 'cat_welcome': {
                        const c = new ContainerBuilder().setAccentColor(0x0088FF);
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 👋 Giriş-Çıkış Ayarları\nHoşgeldin kanalını ve mesajlarını ayarlayın.'));
                        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Mevcut: ${settings.welcomeChannel ? `✅ <#${settings.welcomeChannel}>` : '❌ Ayarlanmamış'}`));
                        container = c;
                        actionRows = [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder().setCustomId('set_welcomeChannel').setPlaceholder('Hoşgeldin Kanalını Seçin').addChannelTypes(ChannelType.GuildText)
                            ),
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('btn_welcomeMsg').setLabel('Hoşgeldin Mesajını Yaz').setStyle(ButtonStyle.Primary),
                                new ButtonBuilder().setCustomId('btn_leaveMsg').setLabel('Ayrılma Mesajını Yaz').setStyle(ButtonStyle.Primary),
                                new ButtonBuilder().setCustomId('settings_back').setLabel('Geri Dön').setStyle(ButtonStyle.Secondary)
                            )
                        ];
                        break;
                    }
                    case 'cat_ticket': {
                        const c = new ContainerBuilder().setAccentColor(0x0088FF);
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🎫 Ticket Ayarları\nTicket kanallarını ve yetkili rolünü ayarlayın.'));
                        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**Mevcut Durum:**\n` +
                            `🎫 Ticket Kanalı: ${settings.ticketChannel ? `✅ <#${settings.ticketChannel}>` : '❌ Ayarlanmamış'}\n` +
                            `📋 Ticket Log: ${settings.ticketLog ? `✅ <#${settings.ticketLog}>` : '❌ Ayarlanmamış'}\n` +
                            `👤 Yetkili Rolü: ${settings.ticketStaff ? `✅ <@&${settings.ticketStaff}>` : '❌ Ayarlanmamış'}`
                        ));
                        container = c;
                        actionRows = [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder().setCustomId('set_ticketChannel').setPlaceholder('Ticket Menü Kanalını Seçin').addChannelTypes(ChannelType.GuildText)
                            ),
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder().setCustomId('set_ticketLog').setPlaceholder('Ticket Log Kanalını Seçin').addChannelTypes(ChannelType.GuildText)
                            ),
                            new ActionRowBuilder().addComponents(
                                new RoleSelectMenuBuilder().setCustomId('set_ticketStaff').setPlaceholder('Ticket Yetkili Rolünü Seçin')
                            ),
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('settings_back').setLabel('Geri Dön').setStyle(ButtonStyle.Secondary)
                            )
                        ];
                        break;
                    }
                    case 'cat_customer': {
                        const c = new ContainerBuilder().setAccentColor(0x0088FF);
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 👑 Müşteri & Satış Ayarları\nMüşteri rolünü ve satış log kanalını ayarlayın.'));
                        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**Mevcut Durum:**\n` +
                            `👑 Müşteri Rolü: ${settings.customerRole ? `✅ <@&${settings.customerRole}>` : '❌ Ayarlanmamış'}\n` +
                            `🛒 Satış Log: ${settings.customerLogChannel ? `✅ <#${settings.customerLogChannel}>` : '❌ Ayarlanmamış'}`
                        ));
                        container = c;
                        actionRows = [
                            new ActionRowBuilder().addComponents(
                                new RoleSelectMenuBuilder().setCustomId('set_customerRole').setPlaceholder('Müşteri Rolünü Seçin')
                            ),
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder().setCustomId('set_customerLogChannel').setPlaceholder('Satış Log Kanalını Seçin').addChannelTypes(ChannelType.GuildText)
                            ),
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('settings_back').setLabel('Geri Dön').setStyle(ButtonStyle.Secondary)
                            )
                        ];
                        break;
                    }
                    case 'cat_logs': {
                        const c = new ContainerBuilder().setAccentColor(0x0088FF);
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 📊 Log Ayarları\nLog kanallarını ayarlayın.'));
                        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**Mevcut Durum:**\n` +
                            `📊 Mod/Ban Log: ${settings.modLogChannel ? `✅ <#${settings.modLogChannel}>` : '❌ Ayarlanmamış'}\n` +
                            `💬 Mesaj Log: ${settings.messageLogChannel ? `✅ <#${settings.messageLogChannel}>` : '❌ Ayarlanmamış'}`
                        ));
                        container = c;
                        actionRows = [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder().setCustomId('set_modLogChannel').setPlaceholder('Mod/Ban Log Kanalını Seçin').addChannelTypes(ChannelType.GuildText)
                            ),
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder().setCustomId('set_messageLogChannel').setPlaceholder('Mesaj Log Kanalını Seçin').addChannelTypes(ChannelType.GuildText)
                            ),

                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('settings_back').setLabel('Geri Dön').setStyle(ButtonStyle.Secondary)
                            )
                        ];
                        break;
                    }
                    case 'cat_general': {
                        const c = new ContainerBuilder().setAccentColor(0x0088FF);
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ⚙️ Genel Ayarlar\nOtorol ve diğer genel ayarları yapılandırın.'));
                        c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**Mevcut Durum:**\n` +
                            `🛡️ Oto-Rol: ${settings.autoRole ? `✅ <@&${settings.autoRole}>` : '❌ Ayarlanmamış'}`
                        ));
                        container = c;
                        actionRows = [
                            new ActionRowBuilder().addComponents(
                                new RoleSelectMenuBuilder().setCustomId('set_autoRole').setPlaceholder('Otorol Seçin')
                            ),
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('settings_back').setLabel('Geri Dön').setStyle(ButtonStyle.Secondary)
                            )
                        ];
                        break;
                    }
                    case 'cat_toggles':
                    case 'cat_application': {
                        const c = new ContainerBuilder().setAccentColor(0xFFCC00);
                        c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🚧 Yapım Aşamasında\nBu ayar kategorisi şu an yapım aşamasındadır.'));
                        container = c;
                        actionRows = [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setCustomId('settings_back').setLabel('Geri Dön').setStyle(ButtonStyle.Secondary)
                            )
                        ];
                        break;
                    }
                    case 'cat_reset': {
                        const preserveKeys = ['customerRole', 'ticketStaff', 'vipCustomerRole', 'devRole'];
                        const currentSettings = dbManager.get('server_settings', { guild_id: interaction.guild.id });
                        if (Array.isArray(currentSettings)) {
                            currentSettings.forEach(s => {
                                if (!preserveKeys.includes(s.setting_key)) {
                                    dbManager.delete('server_settings', { guild_id: interaction.guild.id, setting_key: s.setting_key });
                                }
                            });
                        }
                        const resetContainer = new ContainerBuilder().setAccentColor(0x00CC66);
                        resetContainer.addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('## ✅ Ayarlar Sıfırlandı\nSunucu ayarları başarıyla sıfırlandı.')
                        );
                        return safeUpdate(interaction, {
                            embeds: [],
                            components: [resetContainer.toJSON()],
                            flags: 32768
                        });
                    }
                }

                // Container + select menüler/butonlar birlikte gönder
                // NOT: ChannelSelectMenu ve RoleSelectMenu ContainerBuilder içinde desteklenmiyor,
                // bu yüzden Container ilk component olarak, geri kalan ActionRow'lar ayrı gönderiliyor
                const allComponents = [container.toJSON(), ...actionRows.map(r => r.toJSON ? r.toJSON() : r)];
                await safeUpdate(interaction, { 
                    embeds: [], 
                    components: allComponents,
                    flags: 32768
                });
            } catch (error) {
                console.error('Settings Menu Error:', error);
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({ content: `❌ Bir işlem hatası oluştu, lütfen tekrar deneyin. (${error.message})`, ephemeral: true }).catch(() => {});
                }
            }
        }
    },
    {
        customId: 'set_',
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi yapmak için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }
            try {
                const settingKey = interaction.customId.replace('set_', '');
                const value = interaction.values[0];
                const jsonManager = new JsonManager();
                
                const settings = {};
                settings[settingKey] = value;
                await jsonManager.set('server/settings', interaction.guild.id, settings);

                const mention = interaction.isRoleSelectMenu() ? `<@&${value}>` : `<#${value}>`;

                // Components V2 modunda content kullanılamaz, mevcut bileşenlerin ilk Container'ına bildirim ekle
                const existingComponents = interaction.message.components.map(c => c.toJSON ? c.toJSON() : c);
                
                // İlk container'ı bul ve başarı mesajını ekle
                const successNotice = new ContainerBuilder().setAccentColor(0x00CC66);
                successNotice.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# ✅ **${settingKey}** güncellendi: ${mention}`)
                );
                successNotice.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
                
                // Bildirim container'ını en üste ekle, geri kalan bileşenleri koru
                await safeUpdate(interaction, { 
                    components: [successNotice.toJSON(), ...existingComponents],
                    flags: 32768
                });
            } catch (error) {
                console.error('Settings Update Error:', error);
                if (!interaction.deferred && !interaction.replied) {
                    await interaction.reply({ content: `❌ Güncelleme sırasında hata: ${error.message}`, ephemeral: true }).catch(() => {});
                }
            }
        }
    }
];
