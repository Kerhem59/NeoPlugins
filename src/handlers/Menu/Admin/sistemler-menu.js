const { PermissionsBitField } = require('discord.js');
const systemsManager = require('../../../utils/SystemsManager');
const { generateSystemsPanel } = require('../../../commands/App/Admin/sistemler');

module.exports = [
    {
        customId: 'sistemler_select_toggle',
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }

            const selectedValue = interaction.values[0];
            if (!selectedValue || !selectedValue.startsWith('system_toggle_')) return;

            const systemKey = selectedValue.replace('system_toggle_', '');
            const newState = systemsManager.toggleSystem(systemKey);

            const panelData = generateSystemsPanel();
            
            await interaction.update({
                embeds: panelData.embeds,
                components: panelData.components
            });
        }
    },
    {
        customId: 'btn_systems_all_on',
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }
            const systems = systemsManager.getSystems();
            for (const key of Object.keys(systems)) {
                systemsManager.setSystem(key, true);
            }
            const panelData = generateSystemsPanel();
            await interaction.update(panelData);
        }
    },
    {
        customId: 'btn_systems_all_off',
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }
            const systems = systemsManager.getSystems();
            for (const key of Object.keys(systems)) {
                systemsManager.setSystem(key, false);
            }
            const panelData = generateSystemsPanel();
            await interaction.update(panelData);
        }
    },
    {
        customId: 'btn_systems_refresh',
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi gerçekleştirmek için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }
            const panelData = generateSystemsPanel();
            await interaction.update(panelData);
        }
    }
];
