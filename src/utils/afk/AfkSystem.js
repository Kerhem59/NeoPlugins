const dbManager = require('../../../Database/SuperCore/JsonDatabaseManager');

async function loadAfkData() {
  const rows = dbManager.get('afk_data');
  const afkData = {};
  rows.forEach(row => {
    afkData[row.user_id] = {
        reason: row.reason,
        timestamp: row.timestamp
    };
  });
  return afkData;
}

async function getAfkReason(user) {
    const afkInfo = dbManager.getOne('afk_data', { user_id: user.id });
    if (afkInfo) {
        const duration = Date.now() - afkInfo.timestamp;
        const reason = afkInfo.reason || 'Sebep belirtilmemiş';
        return {
            reason,
            duration: formatDuration(duration)
        };
    }
    return null;
}

async function removeAfk(user, guild) {
    const afkInfo = dbManager.getOne('afk_data', { user_id: user.id });
    if (afkInfo) {
        const duration = Date.now() - afkInfo.timestamp;
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);

        // AFK verisini sil
        dbManager.delete('afk_data', { user_id: user.id });

        // İstatistikleri güncelle
        let history = dbManager.getOne('afk_history', { user_id: user.id });
        if (!history) {
            history = { user_id: user.id, total_afk_count: 0, total_afk_duration: 0, last_reason: '', last_afk_at: 0 };
        }
        history.total_afk_count += 1;
        history.total_afk_duration += duration;
        history.last_reason = afkInfo.reason;
        history.last_afk_at = afkInfo.timestamp;
        dbManager.upsert('afk_history', { user_id: user.id }, history);

        // Nickname düzeltme
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (member) {
            try {
                if (member.nickname && member.nickname.startsWith('[AFK]')) {
                    const cleanName = member.nickname.replace('[AFK] ', '');
                    await member.setNickname(cleanName);
                }
            } catch (error) {
                console.log(`Botun ${user.username} adını düzeltme yetkisi yok.`);
            }
        }

        let textParts = [];
        if (hours > 0) textParts.push(`${hours} saat`);
        if (minutes > 0) textParts.push(`${minutes} dakika`);
        if (seconds > 0 || textParts.length === 0) textParts.push(`${seconds} saniye`);
        
        return {
            text: `${textParts.join(' ')} AFK kaldınız.`,
            durationMs: duration,
            hours,
            minutes,
            seconds
        };
    }
    return null;
}

async function setAfk(user, reason, guild) {
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member) {
        try {
            const currentNickname = member.nickname || user.username;
            if (!currentNickname.startsWith('[AFK]')) {
                await member.setNickname(`[AFK] ${currentNickname}`);
            }
        } catch (error) {
            console.log(`Botun ${user.username} adını değiştirme yetkisi yok.`);
        }
    }

    dbManager.upsert('afk_data', { user_id: user.id }, { reason, timestamp: Date.now() });
}

async function getAfkStats(userId) {
    const stats = dbManager.getOne('afk_history', { user_id: userId });
    if (stats) {
        const totalDuration = stats.total_afk_duration || 0;
        const totalCount = stats.total_afk_count || 0;
        const avgDuration = totalCount > 0 ? Math.floor(totalDuration / totalCount) : 0;

        return {
            totalCount,
            totalDuration,
            avgDuration,
            lastReason: stats.last_reason || 'Belirtilmemiş',
            lastAfkAt: stats.last_afk_at || 0,
            // Formatlı süreler
            totalDurationFormatted: formatDuration(totalDuration),
            avgDurationFormatted: formatDuration(avgDuration)
        };
    }
    return {
        totalCount: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastReason: 'Henüz AFK olmadı',
        lastAfkAt: 0,
        totalDurationFormatted: '0 dakika',
        avgDurationFormatted: '0 dakika'
    };
}

function formatDuration(ms) {
    if (!ms || isNaN(ms)) return '0 sn';
    ms = Number(ms);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}g`);
    if (hours > 0) parts.push(`${hours}sa`);
    if (minutes > 0) parts.push(`${minutes}dk`);
    if (parts.length === 0) {
        parts.push(`${seconds}sn`);
    }
    return parts.join(' ');
}

module.exports = {
  loadAfkData,
  removeAfk,
  setAfk,
  getAfkReason,
  getAfkStats
};