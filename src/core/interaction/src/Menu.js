const fs = require('fs');
const path = require('path');

class Menu {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.handlers = new Map();
    }

    initialize() {
        this.loadMenuHandlers();
    }

    loadMenuHandlers() {
        const menuPath = path.join(__dirname, '../../../handlers/Menu');
        if (!fs.existsSync(menuPath)) {
            fs.mkdirSync(menuPath, { recursive: true });
        }
        const menuFiles = this.getFiles(menuPath);
        for (const file of menuFiles) {
            try {
                delete require.cache[require.resolve(file)];
                const menuModule = require(file);
                const handlers = Array.isArray(menuModule) ? menuModule : [menuModule];

                for (const handler of handlers) {
                    const id = handler.customId || handler.value;
                    if (id && typeof handler.execute === 'function') {
                        this.handlers.set(id, handler.execute);
                    }
                }
            } catch (err) {
                console.error(`Menü handler yüklemesi sırasında hata: ${file} - ${err.message}`);
            }
        }
    }

    async handleInteraction(interaction) {
        try {
            if (!interaction.isAnySelectMenu()) {
                return;
            }

            const customId = interaction.customId;
            let handler = this.handlers.get(customId);

            // Prefix kontrolü (Örn: set_welcomeChannel -> set_)
            if (!handler) {
                const prefix = customId.split('_').slice(0, -1).join('_') + '_';
                handler = this.handlers.get(prefix);
            }

            if (!handler) return;

            await handler(interaction);
        } catch (error) {
            console.error(`Menü işleme hatası ${interaction.customId}: ${error.message}`);
        }
    }

    reload() {
        this.handlers.clear();
        this.loadMenuHandlers();
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

module.exports = Menu;