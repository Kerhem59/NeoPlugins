const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const db = require('../../../Database/SuperCore/JsonDatabaseManager');
const { createEmbed } = require('../../utils/message/embed');

module.exports = {
    customId: 'cmd_toggle_',
    
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için yetkiniz yok.', ephemeral: true });
        }

        const commandName = interaction.customId.replace('cmd_toggle_', '');

        // Mevcut durumu al
        let isActive = 1;
        try {
            const setting = db.getOne('command_settings', { guild_id: interaction.guildId, command_name: commandName });
            if (setting && setting.is_active !== undefined) {
                isActive = setting.is_active;
            }
        } catch (err) {
            console.error('Durum okuma hatası:', err);
            return interaction.reply({ content: 'Veritabanı hatası oluştu.', ephemeral: true });
        }

        const newState = isActive ? 0 : 1;

        // Durumu güncelle
        try {
            db.upsert('command_settings', { guild_id: interaction.guildId, command_name: commandName }, { is_active: newState });
        } catch (err) {
            console.error('Durum güncelleme hatası:', err);
            return interaction.reply({ content: 'Güncelleme sırasında hata oluştu.', ephemeral: true });
        }

        // Discord API komutlarını senkronize et
        try {
            if (interaction.client.interactions && interaction.client.interactions.slashHandler) {
                await interaction.client.interactions.slashHandler.reload();
            }
        } catch (err) {
            console.error('Slash komutlari guncellenirken hata:', err);
        }

        // Arayüzü güncelle
        const embed = createEmbed({
            title: `🔧 Komut Yönetimi: /${commandName}`,
            description: `Aşağıdaki butonları kullanarak **${commandName}** komutunu bu sunucuda aktif edebilir veya devre dışı bırakabilirsiniz.\n\n` + 
                         `**Mevcut Durum:** ${newState ? 'Aktif 🟢' : 'Devre Dışı 🔴'}\n` +
                         `*Devre dışı bırakılan komutlar üyeler tarafından kullanılamaz.*`,
            color: newState ? '#2ecc71' : '#e74c3c'
        });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cmd_toggle_${commandName}`)
                    .setLabel(newState ? 'Devre Dışı Bırak' : 'Aktif Et')
                    .setEmoji(newState ? '🔴' : '🟢')
                    .setStyle(newState ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ackapa_back')
                    .setLabel('Geri Dön')
                    .setEmoji('↩️')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({ embeds: [embed], components: [row] });
    }
};
