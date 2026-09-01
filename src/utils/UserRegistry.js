const JsonManager = require('../../Database/SuperCore/JsonManager');

class UserRegistry {
    static findByDiscordId(users, discordId) {
        if (!users || !discordId) return null;
        for (const [steamId, data] of Object.entries(users)) {
            if (data.discordId === discordId) {
                return { steamId, ...data };
            }
        }
        return null;
    }

    static getFormattedName(userData, member, settings) {
        let name = userData.icName || 'Bilinmiyor';
        if (member && settings?.roleTags) {
            for (const [roleId, roleTag] of Object.entries(settings.roleTags)) {
                if (member.roles.cache.has(roleId)) {
                    return `${roleTag} ${name}`;
                }
            }
        }
        return name;
    }

    static getVerifyRewards(settings = {}) {
        const money = Number(settings.verifyRewardMoney);
        const exp = Number(settings.verifyRewardExp);
        return {
            money: Number.isFinite(money) && money >= 0 ? Math.floor(money) : 100000,
            exp: Number.isFinite(exp) && exp >= 0 ? Math.floor(exp) : 5000
        };
    }

    static async loadUserContext(guild, discordId) {
        const jsonManager = new JsonManager();
        const settings = await jsonManager.get('server/settings', guild.id) || {};
        const users = await jsonManager.get('users/data', guild.id) || {};
        const entry = UserRegistry.findByDiscordId(users, discordId);
        if (!entry) return null;

        const member = await guild.members.fetch(discordId).catch(() => null);
        return {
            steamId: entry.steamId,
            icName: entry.icName,
            formattedName: UserRegistry.getFormattedName(entry, member, settings),
            userData: entry,
            settings
        };
    }
}

module.exports = UserRegistry;
