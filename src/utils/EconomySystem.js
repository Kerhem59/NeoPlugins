const dbManager = require('../../Database/SuperCore/JsonDatabaseManager');

class EconomySystem {
    /**
     * Kullanıcı verisini oku
     */
    static async getData(guildId, userId) {
        const user = dbManager.getOne('users_economy', { guild_id: guildId, user_id: userId });
        
        if (!user) {
            return { coins: 0, lastMessage: 0, lastVoice: 0, totalMessages: 0, totalTickets: 0 };
        }
        return user;
    }

    /**
     * Kullanıcıya coin ekler
     */
    static async addCoins(guildId, userId, amount) {
        const userData = await this.getData(guildId, userId);
        const newCoins = userData.coins + amount;

        dbManager.upsert('users_economy', { guild_id: guildId, user_id: userId }, { coins: newCoins });
        return newCoins;
    }

    static async getBalance(guildId, userId) {
        const data = await this.getData(guildId, userId);
        return data.coins;
    }

    /**
     * Mesaj başı coin verme mantığı
     */
    static async rewardMessage(guildId, userId) {
        const userData = await this.getData(guildId, userId);
        const now = Date.now();
        const cooldown = 60000; // 1 dakika

        if (now - userData.lastMessage < cooldown) return false;

        const amount = Math.floor(Math.random() * 5) + 1;
        const newCoins = userData.coins + amount;
        const newTotalMessages = userData.totalMessages + 1;

        dbManager.upsert('users_economy', { guild_id: guildId, user_id: userId }, { coins: newCoins, lastMessage: now, totalMessages: newTotalMessages });
        return amount;
    }

    /**
     * Ticket üstlenince coin verir
     */
    static async rewardTicket(guildId, userId) {
        const userData = await this.getData(guildId, userId);
        const amount = Math.floor(Math.random() * (100 - 45 + 1)) + 45;
        const newCoins = userData.coins + amount;
        const newTotalTickets = userData.totalTickets + 1;

        dbManager.upsert('users_economy', { guild_id: guildId, user_id: userId }, { coins: newCoins, totalTickets: newTotalTickets });
        return amount;
    }
}

module.exports = EconomySystem;
