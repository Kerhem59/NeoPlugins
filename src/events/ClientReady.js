const { Events, ActivityType } = require('discord.js');
const main = require('../config/genaral/main.json');
const giveawayManager = require('../utils/GiveawayManager');

function setupActivityCycle(client) {
  const activities = main.Activity || ['Main.js Eksik'];
  let currentIndex = 0;

  client.user.setPresence({
    activities: [{ name: activities[currentIndex], type: 0 }],
    status: 'online'
  });

  setInterval(() => {
    currentIndex = (currentIndex + 1) % activities.length;
    client.user.setActivity(activities[currentIndex], { type: 0 });
  }, 30000);
}



module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
    console.log('@Neo Bots güvencesi ile');
    console.log('Hazırlanıyor...');

    try {
      setupActivityCycle(client);



      // Çekiliş Yöneticisini Başlat
      giveawayManager.init(client);

      console.log('Bot Hazır!');
    } catch (error) {
      console.error('Bot başlatılırken hata oluştu:', error);
    }
  }
};