const dbManager = require('../../Database/SuperCore/JsonDatabaseManager');

class LevelSystem {
    /**
     * Seviye N için gereken XP (Seviye atlamak için gereken miktar)
     */
    static getXpForLevel(level) {
        if (level === 0) return 0;
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    /**
     * Belirli bir seviyeye kadar gereken TOPLAM XP'yi hesaplar
     */
    static getTotalXpForLevel(level) {
        let total = 0;
        for (let i = 1; i <= level; i++) {
            total += this.getXpForLevel(i);
        }
        return total;
    }

    /**
     * Veriyi dengele: Seviye, XP ve Toplam XP'yi birbiriyle eşitle
     */
    static async balanceLevel(guildId, userId, data) {
        let { xp, level } = data;
        let leveledUp = false;

        // 1. Önce XP'ye göre Seviye atlatma kontrolü (Manual XP eklenmişse)
        while (true) {
            const xpNeeded = this.getXpForLevel(level + 1);
            if (xp >= xpNeeded && xpNeeded > 0) {
                xp -= xpNeeded;
                level += 1;
                leveledUp = true;
            } else {
                break;
            }
        }

        // 2. Güncel level ve xp'ye göre Total XP'yi YENİDEN HESAPLA (En doğru yöntem)
        const newTotalXp = this.getTotalXpForLevel(level) + xp;

        // 3. Eğer veritabanındaki Total XP ile hesaplanan farklıysa güncelle
        if (leveledUp || data.totalXp !== newTotalXp) {
            dbManager.update('users_levels', { guild_id: guildId, user_id: userId }, { xp, level, totalXp: newTotalXp });
        }

        return { xp, level, totalXp: newTotalXp, leveledUp };
    }

    /**
     * Seviye verisini oku (Ve otomatik dengele)
     */
    static async getData(guildId, userId) {
        const rows = dbManager.get('users_levels', { guild_id: guildId, user_id: userId });
        
        if (rows.length === 0) {
            return { xp: 0, level: 0, totalXp: 0, lastXpTime: 0 };
        }

        return await this.balanceLevel(guildId, userId, rows[0]);
    }

    /**
     * XP ekle
     */
    static async addXp(guildId, userId, amount = null) {
        const userData = await this.getData(guildId, userId);
        const now = Date.now();
        const cooldown = 30000;

        if (now - userData.lastXpTime < cooldown && amount === null) {
            return { leveledUp: false, level: userData.level, xpGained: 0 };
        }

        const xpGained = amount || (Math.floor(Math.random() * 20) + 10);
        let newXp = userData.xp + xpGained;
        let newLevel = userData.level;

        // Seviye atlama döngüsü
        while (true) {
            const xpNeeded = this.getXpForLevel(newLevel + 1);
            if (newXp >= xpNeeded && xpNeeded > 0) {
                newXp -= xpNeeded;
                newLevel += 1;
            } else {
                break;
            }
        }

        // Yeni Total XP'yi hesapla
        const newTotalXp = this.getTotalXpForLevel(newLevel) + newXp;

        dbManager.upsert('users_levels', 
            { guild_id: guildId, user_id: userId }, 
            { xp: newXp, level: newLevel, totalXp: newTotalXp, lastXpTime: now }
        );

        return { leveledUp: newLevel > userData.level, level: newLevel, xpGained };
    }

    static async getXpNeeded(guildId, userId) {
        const data = await this.getData(guildId, userId);
        return this.getXpForLevel(data.level + 1);
    }

    static async getLeaderboard(guildId) {
        const users = dbManager.get('users_levels', { guild_id: guildId });
        return users.sort((a, b) => b.totalXp - a.totalXp).slice(0, 10);
    }

    static async getRank(guildId, userId) {
        const users = dbManager.get('users_levels', { guild_id: guildId });
        users.sort((a, b) => b.totalXp - a.totalXp);
        const index = users.findIndex(u => u.user_id === userId);
        return index === -1 ? 0 : index + 1;
    }
}

module.exports = LevelSystem;
