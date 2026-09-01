const fs = require('fs');
const path = require('path');

class Modal {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.handlers = new Map();
    }

    initialize() {
        this.loadModalHandlers();
    }

    loadModalHandlers() {
        const modalPath = path.join(__dirname, '../../../handlers/Modal');
        if (!fs.existsSync(modalPath)) {
            fs.mkdirSync(modalPath, { recursive: true });
        }
        const modalFiles = this.getFiles(modalPath);
        for (const file of modalFiles) {
            try {
                delete require.cache[require.resolve(file)];
                const modalModule = require(file);
                const handlers = Array.isArray(modalModule) ? modalModule : [modalModule];

                for (const handler of handlers) {
                    if (handler.customId && typeof handler.execute === 'function') {
                        this.handlers.set(handler.customId, handler.execute);
                    }
                }
            } catch (err) {
                console.error(`Modal handler yüklemesi sırasında hata: ${file} - ${err.message}`);
            }
        }
    }

    async handleInteraction(interaction) {
        if (!interaction.isModalSubmit()) return;

        const customId = interaction.customId;
        let handler = this.handlers.get(customId);

        // Prefix kontrolü (Örn: modal_set_welcome -> modal_set_)
        if (!handler) {
            const prefix = customId.split('_').slice(0, -1).join('_') + '_';
            handler = this.handlers.get(prefix);
        }

        if (!handler) return;

        try {
            await handler(interaction);
        } catch (error) {
            console.error(`Modal işleme hatası ${customId}: ${error.message}`);
        }
    }

    reload() {
        this.handlers.clear();
        this.loadModalHandlers();
    }

    getFiles(dir) {
        let files = [];
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                files = files.concat(this.getFiles(fullPath));
            } else if (item.isFile() && item.name.endsWith('.js')) {
                files.push(fullPath);
            }
        }
        return files;
    }
}

module.exports = Modal;