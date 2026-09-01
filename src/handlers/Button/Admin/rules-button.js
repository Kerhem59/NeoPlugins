const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
  customId: 'rules_accept_btn',
  async execute(interaction) {
    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};

    const member = interaction.member;
    let addedRoleName = '';

    if (settings.autoRole) {
      const autoRole = interaction.guild.roles.cache.get(settings.autoRole);
      if (autoRole && !member.roles.cache.has(autoRole.id)) {
        try {
          await member.roles.add(autoRole);
          addedRoleName = ` ve **${autoRole.name}** rolünüz tanımlandı`;
        } catch (err) {
          console.error('Otorol verme hatası (rules accept):', err.message);
        }
      }
    }

    await interaction.reply({
      content: `✅ **Kuralları başarıyla onayladınız${addedRoleName}!**\nUnturned Plugin Store sunucumuzda keyifli vakitler ve iyi alışverişler dileriz. 🛒🎮`,
      ephemeral: true
    });
  }
};
