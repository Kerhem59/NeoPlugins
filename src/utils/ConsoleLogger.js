const { EmbedBuilder } = require('discord.js');
const JsonManager = require('../../Database/SuperCore/JsonManager');

class ConsoleLogger {
    isSensitiveLog(text) {
        if (!text) return false;
        const lower = String(text).toLowerCase();
        const patterns = ['mainbottoken', 'api_key', 'apikey', 'password', 'mysql', 'authorization', 'bearer ', 'token', 'secret'];
        return patterns.some((p) => lower.includes(p));
    }

    constructor(client) {
        this.client = client;
        this.buffer = [];
        this.maxBufferLength = 1800; // Discord mesaj limiti güvenli alan
        this.flushInterval = null;
        this.channelCache = null;
        this.channelCacheTime = 0;
    }

    start() {
        // Orijinal console metodlarını kaydet
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        // console.log yakala
        console.log = (...args) => {
            originalLog.apply(console, args);
            this.addToBuffer('📋', args.join(' '));
        };

        // console.error yakala
        console.error = (...args) => {
            originalError.apply(console, args);
            const text = args.map(a => {
                if (a instanceof Error) return a.stack || a.message;
                if (typeof a === 'object') try { return JSON.stringify(a, null, 2); } catch { return String(a); }
                return String(a);
            }).join(' ');
            this.addToBuffer('❌', text);
        };

        // console.warn yakala
        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.addToBuffer('⚠️', args.join(' '));
        };

        // Her 5 saniyede bir buffer'ı gönder
        this.flushInterval = setInterval(() => this.flush(), 5000);

        originalLog('[ConsoleLog] 📺 Konsol log sistemi aktif.');
    }

    addToBuffer(emoji, text) {
        if (this.isSensitiveLog(text)) return;

        const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const line = `\`${timestamp}\` ${emoji} ${text}`;
        this.buffer.push(line);
    }

    async getChannel() {
        // 30 saniye cache
        const now = Date.now();
        if (this.channelCache && (now - this.channelCacheTime) < 30000) {
            return this.channelCache;
        }

        try {
            const guild = this.client.guilds.cache.first();
            if (!guild) return null;

            const jsonManager = new JsonManager();
            const settings = await jsonManager.get('server/settings', guild.id) || {};

            if (!settings.consoleLogChannel) return null;

            const channel = guild.channels.cache.get(settings.consoleLogChannel);
            if (channel) {
                this.channelCache = channel;
                this.channelCacheTime = now;
            }
            return channel;
        } catch {
            return null;
        }
    }

    async flush() {
        if (this.buffer.length === 0) return;

        const channel = await this.getChannel();
        if (!channel) {
            this.buffer = []; // Kanal yoksa buffer'ı temizle (birikmesin)
            return;
        }

        // Buffer'daki tüm satırları birleştir
        let message = '';
        const lines = [...this.buffer];
        this.buffer = [];

        for (const line of lines) {
            // Mesaj çok uzunsa parçala
            if ((message + line + '\n').length > this.maxBufferLength) {
                if (message.length > 0) {
                    await this.sendMessage(channel, message);
                }
                message = '';
            }
            message += line + '\n';
        }

        if (message.length > 0) {
            await this.sendMessage(channel, message);
        }
    }

    async sendMessage(channel, content) {
        try {
            // Kod bloğu içinde gönder (daha okunabilir)
            await channel.send({
                content: `\`\`\`ansi\n${this.stripEmojis(content)}\n\`\`\``,
            }).catch(() => {});
        } catch {
            // Sessizce geç
        }
    }

    stripEmojis(text) {
        // ANSI uyumlu olması için emojileri basit etiketlere çevir
        return text
            .replace(/📋/g, '[LOG]')
            .replace(/❌/g, '[ERR]')
            .replace(/⚠️/g, '[WRN]')
            .replace(/`/g, '');
    }

    stop() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
    }
}

module.exports = ConsoleLogger;
