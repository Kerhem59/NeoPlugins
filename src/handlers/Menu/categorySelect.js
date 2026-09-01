const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../../../Database/SuperCore/JsonDatabaseManager');
const { createEmbed } = require('../../utils/message/embed');

module.exports = {
    customId: 'category_management_select',
    
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için yetkiniz yok.', ephemeral: true });
        }

        const selectedValue = interaction.values[0];
        if (!selectedValue.startsWith('cat_select_')) return;
        
        const categoryName = selectedValue.replace('cat_select_', '');
        
        const categoryPath = path.join(__dirname, '../../commands/App', categoryName);
        if (!fs.existsSync(categoryPath)) {
            return interaction.reply({ content: '❌ Kategori bulunamadı.', ephemeral: true });
        }

        // Get all .js files in the category folder
        const getFiles = (dir) => {
            let files = [];
            if (!fs.existsSync(dir)) return files;
            const items = fs.readdirSync(dir, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    files = files.concat(getFiles(fullPath));
                } else if (item.isFile() && item.name.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
            return files;
        };

        const commandFiles = getFiles(categoryPath);
        const commandNames = [];

        for (const file of commandFiles) {
            try {
                // Delete cache to avoid getting stale data if commands changed
                delete require.cache[require.resolve(file)];
                const command = require(file);
                if ('data' in command && command.data.name) {
                    commandNames.push(command.data.name);
                }
            } catch (err) {
                console.error(`Komut yüklenemedi: ${file}`, err);
            }
        }

        if (commandNames.length === 0) {
            return interaction.update({ content: 'Bu kategoride yönetilebilecek komut bulunamadı.', embeds: [], components: [] });
        }

        // We can only put max 25 options in a SelectMenu
        const commandsToList = commandNames.slice(0, 25);

        // Veritabanındaki ayarları çek
        let settings = [];
        try {
            const rows = db.get('command_settings', { guild_id: interaction.guildId });
            settings = rows || [];
        } catch (err) {
            console.error('Komut ayarları çekilemedi:', err);
        }

        const settingsMap = new Map();
        settings.forEach(row => {
            settingsMap.set(row.command_name, row.is_active);
        });

        const options = commandsToList.map(cmd => {
            const isActive = settingsMap.has(cmd) ? settingsMap.get(cmd) : 1;
            return {
                label: `/${cmd}`,
                description: `Durum: ${isActive ? 'Aktif 🟢' : 'Pasif 🔴'}`,
                value: `cmd_select_${cmd}`
            };
        });

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('command_management_select')
                    .setPlaceholder(`${categoryName} kategorisinden komut seçin`)
                    .addOptions(options)
            );

        const embed = createEmbed({
            title: `🛠️ Komut Yönetim Paneli - ${categoryName}`,
            description: 'Aşağıdaki menüden bir komut seçerek o komutu aktif veya pasif hale getirebilirsiniz.\n\n*Pasif hale getirilen komutları sunucu üyeleri kullanamaz.*',
            color: '#3b82f6'
        });

        await interaction.update({
            content: '',
            embeds: [embed],
            components: [row]
        });
    }
};
