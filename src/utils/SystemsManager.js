const fs = require('fs');
const path = require('path');

class SystemsManager {
    constructor() {
        this.filePath = path.join(__dirname, '../config/genaral/systems.json');
        this.defaultSystems = {
            afk: true,
            autobackup: true,
            voicerewards: true,
            consolelogger: true,
            automessage: true,
            level: true,
            economy: true,
            welcome: true,
            autorole: true,
            ticket: true,
            application: true,
            autoban: false,
            abone: true
        };
        this.cache = null;
    }

    /**
     * Tüm sistem durumlarını yükler / döner
     */
    getSystems() {
        try {
            if (!fs.existsSync(this.filePath)) {
                fs.writeFileSync(this.filePath, JSON.stringify(this.defaultSystems, null, 2), 'utf8');
                this.cache = { ...this.defaultSystems };
                return this.cache;
            }
            const data = fs.readFileSync(this.filePath, 'utf8');
            this.cache = { ...this.defaultSystems, ...JSON.parse(data) };
            return this.cache;
        } catch (error) {
            console.error('[SystemsManager] Yükleme hatası:', error);
            return this.cache || this.defaultSystems;
        }
    }

    /**
     * Belirtilen sistemin aktif (true) olup olmadığını kontrol eder
     * @param {string} systemName 
     * @returns {boolean}
     */
    isEnabled(systemName) {
        const systems = this.getSystems();
        const key = systemName.toLowerCase();
        return systems[key] !== false;
    }

    /**
     * Belirtilen sistemin durumunu ayarlar (true/false)
     * @param {string} systemName 
     * @param {boolean} status 
     */
    setSystem(systemName, status) {
        const systems = this.getSystems();
        const key = systemName.toLowerCase();
        systems[key] = Boolean(status);
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(systems, null, 2), 'utf8');
            this.cache = systems;
            return true;
        } catch (error) {
            console.error('[SystemsManager] Kaydetme hatası:', error);
            return false;
        }
    }

    /**
     * Belirtilen sistemin durumunu tersine çevirir (Aç/Kapa)
     * @param {string} systemName 
     * @returns {boolean} Yeni durum
     */
    toggleSystem(systemName) {
        const current = this.isEnabled(systemName);
        const newState = !current;
        this.setSystem(systemName, newState);
        return newState;
    }
}

module.exports = new SystemsManager();
