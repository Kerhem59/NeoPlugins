const { PermissionsBitField } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = [
    {
        customId: 'modal_set_', // Prefix handler
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '❌ Bu işlemi yapmak için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
            }
            
            const settingKey = interaction.customId.replace('modal_set_', '');
            const value = interaction.fields.getTextInputValue('value');
            const jsonManager = new JsonManager();
            
            const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};
            settings[settingKey] = value;
            await jsonManager.set('server/settings', interaction.guild.id, settings);

            await interaction.reply({ content: `✅ **${settingKey}** başarıyla güncellendi.`, ephemeral: true });
        }
    }
];
