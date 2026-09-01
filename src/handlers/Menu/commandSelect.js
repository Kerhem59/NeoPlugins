const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const db = require('../../../Database/SuperCore/JsonDatabaseManager');
const { createEmbed } = require('../../utils/message/embed');

module.exports = {
    customId: 'command_management_select',
    
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için yetkiniz yok.', ephemeral: true });
        }

        const selectedValue = interaction.values[0]; // Örn: cmd_select_afk
        if (!selectedValue.startsWith('cmd_select_')) return;
        
        const commandName = selectedValue.replace('cmd_select_', '');
        
        // Veritabanından komut durumunu kontrol et
        let isActive = 1;
        try {
            const setting = db.getOne('command_settings', { guild_id: interaction.guildId, command_name: commandName });
            if (setting && setting.is_active !== undefined) {
                isActive = setting.is_active;
            }
        } catch (err) {
            console.error('Komut durumu alınamadı:', err);
        }

        const embed = createEmbed({
            title: `🔧 Komut Yönetimi: /${commandName}`,
            description: `Aşağıdaki butonları kullanarak **${commandName}** komutunu bu sunucuda aktif edebilir veya devre dışı bırakabilirsiniz.\n\n` + 
                         `**Mevcut Durum:** ${isActive ? 'Aktif 🟢' : 'Devre Dışı 🔴'}\n` +
                         `*Devre dışı bırakılan komutlar üyeler tarafından kullanılamaz.*`,
            color: isActive ? '#2ecc71' : '#e74c3c'
        });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cmd_toggle_${commandName}`)
                    .setLabel(isActive ? 'Devre Dışı Bırak' : 'Aktif Et')
                    .setEmoji(isActive ? '🔴' : '🟢')
                    .setStyle(isActive ? ButtonStyle.Danger : ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ackapa_back')
                    .setLabel('Geri Dön')
                    .setEmoji('↩️')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.update({ embeds: [embed], components: [row] });
    }
};
