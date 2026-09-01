const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const giveawayManager = require('../../../utils/GiveawayManager');

module.exports = {
  customId: 'giveaway_enter_',
  async execute(interaction) {
    const messageId = interaction.customId.replace('giveaway_enter_', '');

    try {
      const gw = dbManager.getOne('giveaways', { message_id: messageId });
      if (!gw) {
        return interaction.reply({ content: '❌ Çekiliş bulunamadı.', ephemeral: true });
      }

      if (gw.ended || Date.now() >= gw.end_time) {
        return interaction.reply({ content: '❌ Bu çekiliş sona ermiştir!', ephemeral: true });
      }

      // Zorunlu rol kontrolü
      if (gw.required_role) {
        if (!interaction.member.roles.cache.has(gw.required_role)) {
          return interaction.reply({
            content: `❌ Bu çekilişe katılabilmek için <@&${gw.required_role}> rolüne sahip olmalısınız!`,
            ephemeral: true
          });
        }
      }

      let participants = typeof gw.participants === 'string' ? JSON.parse(gw.participants || '[]') : (gw.participants || []);
      const userId = interaction.user.id;

      let messageText = '';
      if (participants.includes(userId)) {
        // Zaten katılmışsa çekilişten çık
        participants = participants.filter(id => id !== userId);
        messageText = '❌ Çekiliş katılımınızı iptal ettiniz.';
      } else {
        // Katıl
        participants.push(userId);
        messageText = `🎉 **${gw.prize}** çekilişine başarıyla katıldınız! Bol şanslar dileriz. 🍀`;
      }

      // Veritabanını güncelle
      dbManager.update('giveaways', { message_id: messageId }, { participants: JSON.stringify(participants) });

      // Buton sayacını ve embedi güncelle
      const updatedRow = giveawayManager.createActionRow(messageId, participants.length, false);
      gw.participants = participants;
      const updatedEmbed = giveawayManager.createEmbed(gw, false, []);

      await interaction.message.edit({
        embeds: [updatedEmbed],
        components: [updatedRow]
      }).catch(() => {});

      await interaction.reply({
        content: messageText,
        ephemeral: true
      });

    } catch (err) {
      console.error('giveaway_enter error:', err);
      await interaction.reply({
        content: `❌ Bir hata oluştu: ${err.message}`,
        ephemeral: true
      }).catch(() => {});
    }
  }
};
