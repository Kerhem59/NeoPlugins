/**
 * Unified context for both Slash and Prefix commands
 */
class CommandContext {
    constructor(client, interactionOrMessage, args = [], config = {}) {
        this.client = client;
        this.interaction = interactionOrMessage.isCommand?.() ? interactionOrMessage : null;
        this.message = interactionOrMessage.author ? interactionOrMessage : null;
        this.args = args;
        this.config = config;

        this.user = this.interaction ? this.interaction.user : this.message.author;
        this.member = interactionOrMessage.member;
        this.guild = interactionOrMessage.guild;
        this.channel = interactionOrMessage.channel;

        // OwnerID bypass — config'deki OwnerID listesindeki kullanıcılar tüm yetkilere sahiptir
        this.isOwner = Array.isArray(config.OwnerID) && config.OwnerID.includes(this.user.id);
    }

    /**
     * Proxies for interaction states and options
     */
    get options() {
        return this.interaction?.options;
    }

    get deferred() {
        return this.interaction?.deferred || false;
    }

    get replied() {
        return this.interaction?.replied || false;
    }

    /**
     * Yetki kontrolü — OwnerID listesindekiler her zaman true döner
     * @param {bigint} permission - Discord.js PermissionsBitField
     */
    hasPermission(permission) {
        if (this.isOwner) return true;
        return this.member?.permissions?.has(permission) || false;
    }

    /**
     * Unified reply method
     * @param {string|object} options 
     */
    async reply(options) {
        if (this.interaction) {
            try {
                if (this.interaction.replied || this.interaction.deferred) {
                    return await this.interaction.editReply(options);
                }
                return await this.interaction.reply(options);
            } catch (error) {
                console.error('Interaction reply error:', error);
            }
        } else {
            try {
                return await this.message.reply(options);
            } catch (error) {
                console.error('Message reply error:', error);
            }
        }
    }

    /**
     * Unified defer method
     */
    async deferReply(options) {
        if (this.interaction) {
            return await this.interaction.deferReply(options);
        }
        return null;
    }

    async editReply(options) {
        if (this.interaction) {
            return await this.interaction.editReply(options);
        } else {
            return await this.reply(options);
        }
    }

    async followUp(options) {
        if (this.interaction) {
            return await this.interaction.followUp(options);
        } else {
            return await this.reply(options);
        }
    }

    /**
     * Helper to get options or args
     * @param {string} name Option name for slash
     * @param {number} index Argument index for prefix
     */
    getOption(name, index) {
        if (this.interaction) {
            return this.interaction.options.get(name)?.value;
        }
        return this.args[index];
    }

    getString(name, index) {
        if (this.interaction) {
            return this.interaction.options.getString(name);
        }
        // If index is provided, return that arg, otherwise return all args joined
        if (index !== undefined) return this.args[index];
        return this.args.join(' ');
    }

    getInteger(name, index) {
        if (this.interaction) {
            return this.interaction.options.getInteger(name);
        }
        const val = parseInt(this.args[index], 10);
        return isNaN(val) ? null : val;
    }

    getBoolean(name, index) {
        if (this.interaction) {
            return this.interaction.options.getBoolean(name);
        }
        const val = this.args[index]?.toLowerCase();
        if (val === 'true' || val === 'evet' || val === '1') return true;
        if (val === 'false' || val === 'hayır' || val === '0') return false;
        return null;
    }

    getMember(name, index) {
        if (this.interaction) {
            return this.interaction.options.getMember(name);
        }
        const mention = this.args[index];
        if (!mention) return null;
        const id = mention.replace(/[<@!>]/g, '');
        return this.guild.members.cache.get(id);
    }

    getChannel(name, index) {
        if (this.interaction) {
            return this.interaction.options.getChannel(name);
        }
        const mention = this.args[index];
        if (!mention) return null;
        const id = mention.replace(/[<#@!>]/g, '');
        return this.guild.channels.cache.get(id);
    }

    getRole(name, index) {
        if (this.interaction) {
            return this.interaction.options.getRole(name);
        }
        const mention = this.args[index];
        if (!mention) return null;
        const id = mention.replace(/[<@&>]/g, '');
        return this.guild.roles.cache.get(id);
    }

    getUser(name, index) {
        if (this.interaction) {
            return this.interaction.options.getUser(name);
        }
        const mention = this.args[index];
        if (!mention) return null;
        const id = mention.replace(/[<@!>]/g, '');
        return this.client.users.cache.get(id);
    }
}

module.exports = CommandContext;
