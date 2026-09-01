const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
  customId: 'faq_ticket_btn',
  async execute(interaction) {
    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};

    const ticketChannel = settings.ticketChannel ? `<#${settings.ticketChannel}>` : 'destek kanalı';

    await interaction.reply({
      content: `🎫 Destek veya sipariş talebi oluşturmak için lütfen ${ticketChannel} kanalındaki paneli kullanınız veya yetkililerimizle iletişime geçiniz!`,
      ephemeral: true
    });
  }
};
