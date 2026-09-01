const ContainerHelper = require('./ContainerHelper');
const { TextDisplayBuilder } = require('@discordjs/builders');

class ContainerPatcher {
    /**
     * Objenin belirtilen metodunu patchler. 
     * Eğer metoda 'embeds' array'i gelirse bunu otomatik 'components' (Container) formatına çevirir.
     */
    static patchMethod(obj, methodName) {
        if (!obj || typeof obj[methodName] !== 'function') return;
        
        const originalMethod = obj[methodName].bind(obj);
        
        obj[methodName] = async (options) => {
            if (typeof options === 'string') {
                options = { content: options };
            }
            
            if (options && options.embeds && options.embeds.length > 0) {
                try {
                    // Embedleri Container JSON'larına çevir
                    const containerComponents = options.embeds.map(embed => ContainerHelper.fromEmbed(embed).toJSON());
                    
                    // Var olan componentleri (butonlar, menüler) JSON'a çevir (action rows)
                    const existingComponents = (options.components || []).map(c => typeof c.toJSON === 'function' ? c.toJSON() : c);
                    
                    // Hepsini birleştir
                    options.components = [...containerComponents, ...existingComponents];
                    
                    // Embedleri sil
                    delete options.embeds;
                    
                    // V2 Component Flag'ini ekle (32768)
                    options.flags = (options.flags || 0) | 32768;

                    // V2 modunda 'content' alanı kullanılamaz — TextDisplay'e dönüştür
                    if (options.content) {
                        const contentComponent = new TextDisplayBuilder().setContent(options.content);
                        options.components = [contentComponent.toJSON(), ...options.components];
                        delete options.content;
                    }
                } catch (err) {
                    console.error('[ContainerPatcher] Dönüştürme hatası:', err);
                }
            }
            
            return originalMethod(options);
        };
    }

    /**
     * Interaction objesinin yanıt metodlarını (reply, editReply, update vb.) patchler.
     */
    static patchInteraction(interaction) {
        this.patchMethod(interaction, 'reply');
        this.patchMethod(interaction, 'editReply');
        this.patchMethod(interaction, 'update');
        this.patchMethod(interaction, 'followUp');
    }

    /**
     * Message objesinin yanıt metodlarını (reply) ve kanalını patchler.
     */
    static patchMessage(message) {
        this.patchMethod(message, 'reply');
        if (message.channel) {
            this.patchMethod(message.channel, 'send');
        }
    }
}

module.exports = ContainerPatcher;
