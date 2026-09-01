const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionsBitField, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = [
    {
        customId: 'settings_',
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi yapmak için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }
            
            if (interaction.customId === 'settings_back') {
                const jsonManager = new JsonManager();
                const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};
                
                const embed = new EmbedBuilder()
                    .setTitle('⚙️ Sunucu Ayar Paneli')
                    .setDescription('Lütfen düzenlemek istediğiniz kategoriyi aşağıdaki menüden seçin.')
                    .addFields(
                        { name: '👋 Giriş-Çıkış', value: settings.welcomeChannel ? `✅ <#${settings.welcomeChannel}>` : '❌ Ayarlanmamış', inline: true },
                        { name: '🎫 Ticket Sistemi', value: settings.ticketChannel ? `✅ <#${settings.ticketChannel}>` : '❌ Ayarlanmamış', inline: true },
                        { name: '🛡️ Oto-Rol', value: settings.autoRole ? `✅ <@&${settings.autoRole}>` : '❌ Ayarlanmamış', inline: true },
                        { name: '🛡️ Mod/Ban Log', value: settings.modLogChannel ? `✅ <#${settings.modLogChannel}>` : '❌ Ayarlanmamış', inline: true },
                        { name: '💬 Mesaj Log', value: settings.messageLogChannel ? `✅ <#${settings.messageLogChannel}>` : '❌ Ayarlanmamış', inline: true }
                    )
                    .setColor('#0088FF')
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .setFooter({ text: `${interaction.guild.name} ⬢ Ayar Sistemi`, iconURL: interaction.client.user.displayAvatarURL() });

                const menu = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('settings_category_select')
                            .setPlaceholder('Düzenlenecek Kategoriyi Seçin...')
                            .addOptions([
                                { label: 'Giriş-Çıkış Ayarları', description: 'Hoşgeldin ve ayrılma mesajları', value: 'cat_welcome', emoji: '👋' },
                                { label: 'Ticket Ayarları', description: 'Talep sistemi ve yetkililer', value: 'cat_ticket', emoji: '🎫' },
                                { label: 'Başvuru Ayarları', description: 'Yetkili başvuru onay ve mülakat', value: 'cat_application', emoji: '📝' },
                                { label: 'Log Ayarları', description: 'Kanal logları (Chat, Ban, Voice vb.)', value: 'cat_logs', emoji: '📊' },
                                { label: 'Sistem Aç/Kapa (systems.json)', description: 'Tüm bot sistemlerinin True/False durumları', value: 'cat_toggles', emoji: '🔘' },
                                { label: 'Genel Ayarlar', description: 'Otorol, Haber rolü vb.', value: 'cat_general', emoji: '⚙️' },
                                { label: 'Sıfırla', description: 'Tüm ayarları temizler', value: 'cat_reset', emoji: '🗑️' },
                            ]),
                    );

                await interaction.update({ embeds: [embed], components: [menu] });
            }
        }
    },
    {
        customId: 'btn_',
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi yapmak için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }

            if (interaction.customId === 'btn_welcomeMsg') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_set_welcomeMessage')
                    .setTitle('Hoşgeldin Mesajı');

                const input = new TextInputBuilder()
                    .setCustomId('value')
                    .setLabel('Mesaj Metni')
                    .setPlaceholder('{member} sunucumuza hoş geldin! 🎉')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            } else if (interaction.customId === 'btn_leaveMsg') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_set_leaveMessage')
                    .setTitle('Ayrılma Mesajı');

                const input = new TextInputBuilder()
                    .setCustomId('value')
                    .setLabel('Mesaj Metni')
                    .setPlaceholder('{member} sunucudan ayrıldı. Görüşürüz! 👋')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
            }
        }
    }
];
