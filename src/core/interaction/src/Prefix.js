const fs = require('fs');
const path = require('path');
const CommandContext = require('../../../utils/CommandContext');

class Prefix {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.commands = new Map();
        this.aliases = new Map();
    }

    async initialize() {
        await this.loadPrefixCommands();
    }

    async loadPrefixCommands() {
        const commandsPath = path.join(__dirname, '../../../commands/App');
        if (!fs.existsSync(commandsPath)) {
            fs.mkdirSync(commandsPath, { recursive: true });
        }

        const commandFiles = this.getFiles(commandsPath);
        
        for (const file of commandFiles) {
            try {
                delete require.cache[require.resolve(file)];
                const command = require(file);
                const name = command.data?.name || command.name;

                if (name && (typeof command.execute === 'function' || typeof command.run === 'function')) {
                    this.commands.set(name.toLowerCase(), command);
                    
                    const aliases = command.subname || [];
                    if (Array.isArray(aliases)) {
                        for (const alias of aliases) {
                            this.aliases.set(alias.toLowerCase(), name.toLowerCase());
                        }
                    }
                } else {
                    console.error(`Hatalı prefix komut dosyası: ${file}`);
                }
            } catch (error) {
                console.error(`Prefix komut yüklemesi sırasında hata: ${file} - ${error.message}`);
            }
        }
    }

    async handleMessage(message, prefix) {
        if (!message.guild || message.author.bot) return;

        const prefixes = Array.isArray(prefix) ? prefix : [prefix];
        let usedPrefix = null;

        for (const p of prefixes) {
            if (message.content.startsWith(p)) {
                usedPrefix = p;
                break;
            }
        }

        if (!usedPrefix) return;

        const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        let command = this.commands.get(commandName);
        
        if (!command) {
            const mainCommandName = this.aliases.get(commandName);
            if (mainCommandName) {
                command = this.commands.get(mainCommandName);
            }
        }

        if (!command) {
            return;
        }

        const ctx = new CommandContext(this.client, message, args, this.config);

        try {
            // Komut durumu kontrolü
            const db = require('../../../../Database/SuperCore/JsonDatabaseManager');
            const setting = db.getOne('command_settings', { guild_id: message.guild.id, command_name: commandName });

            if (setting && setting.is_active === 0) {
                if (message.channel.permissionsFor(this.client.user).has('SEND_MESSAGES')) {
                    const msg = await message.channel.send('❌ Bu komut sunucu yöneticileri tarafından devre dışı bırakılmıştır.');
                    setTimeout(() => msg.delete().catch(() => {}), 5000);
                }
                return;
            }

            if (typeof command.execute === 'function') {
                await command.execute(ctx);
            } else if (typeof command.run === 'function') {
                await command.run(this.client, message, args, this.config);
            }
            
            if (message.deletable) {
                await message.delete().catch(() => {});
            }
        } catch (error) {
            console.error(`Prefix komut çalıştırma hatası ${commandName}:`, error);
            if (message.channel.permissionsFor(this.client.user).has('SEND_MESSAGES')) {
                message.channel.send('❌ Bir hata oluştu, lütfen daha sonra tekrar deneyin.')
                    .then((msg) => setTimeout(() => msg.delete().catch(() => { }), 2500))
                    .catch(() => {});
                
                if (message.deletable) {
                    await message.delete().catch(() => {});
                }
            }
        }
    }

    async reload() {
        this.commands.clear();
        this.aliases.clear();
        await this.loadPrefixCommands();
    }

    getFiles(dir) {
        let files = [];
        if (!fs.existsSync(dir)) return files;
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

module.exports = Prefix;