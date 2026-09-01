module.exports = {
  customId: 'faq_store_btn',
  async execute(interaction) {
    const vitrin = interaction.guild.channels.cache.find(c => c.name.includes('plugin-vitrin') || c.name.includes('vitrin'));
    const msg = vitrin ? `🛒 Tüm satıştaki Unturned eklentilerini ${vitrin} kanalından inceleyebilir ve satın alabilirsiniz!` : '🛒 Mağaza vitrinimizden pluginleri inceleyebilirsiniz!';

    await interaction.reply({
      content: msg,
      ephemeral: true
    });
  }
};
