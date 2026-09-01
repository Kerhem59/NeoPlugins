const dbManager = require('./JsonDatabaseManager');

class JsonManager {
    constructor() {}

    /**
     * Ayarları JSON veritabanından çeker
     */
    async get(id, guildId) {
        if (id === 'server/settings') {
            const rows = dbManager.get('server_settings', { guild_id: guildId });
            const settings = {};
            if (Array.isArray(rows)) {
                rows.forEach(row => {
                    const value = row.setting_value;
                    if (value && (typeof value === 'string') && (value.startsWith('{') || value.startsWith('['))) {
                        try {
                            settings[row.setting_key] = JSON.parse(value);
                        } catch {
                            settings[row.setting_key] = value;
                        }
                    } else {
                        settings[row.setting_key] = value;
                    }
                });
            }
            return settings;
        }

        const row = dbManager.getOne('server_settings', { guild_id: guildId, setting_key: id });
        if (row) {
            const value = row.setting_value;
            if (value && (typeof value === 'string') && (value.startsWith('{') || value.startsWith('['))) {
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            }
            return value;
        }
        return null;
    }

    /**
     * Ayarları JSON veritabanına kaydeder
     */
    async set(id, guildId, data) {
        if (id === 'server/settings') {
            for (const [key, value] of Object.entries(data)) {
                try {
                    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    dbManager.upsert('server_settings', { guild_id: guildId, setting_key: key }, { setting_value: valStr });
                } catch (err) {
                    console.error(`Ayar kaydedilirken hata (${key}):`, err);
                }
            }
            return true;
        }

        try {
            const valStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
            dbManager.upsert('server_settings', { guild_id: guildId, setting_key: id }, { setting_value: valStr });
            return true;
        } catch (err) {
            console.error(`Veri kaydedilirken hata (${id}):`, err);
            return false;
        }
    }
}

module.exports = JsonManager;