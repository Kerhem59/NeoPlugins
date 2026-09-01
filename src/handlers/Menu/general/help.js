const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const main = require('../../../config/genaral/main.json');
module.exports = {
    value: 'help',
    async execute(interaction) {
        try {
            const client = interaction.client;
            if (!client.interactions) {
                return interaction.reply({
                    content: 'interactions sistemi yüklenemedi!',
                    ephemeral: true
                });
            }
            const core = client.interactions;
            const selectedValue = interaction.values[0];
            const prefix = main.prefix || '!';
            if (selectedValue === 'slash_commands') {
                const slashCommands = [...core.slashHandler.commands.values()];
                const container = new ContainerBuilder().setAccentColor(0x2B2D31);
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## ⚙️ Slash Komutları')
                );
                container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

                if (slashCommands.length > 0) {
                    const sortedCommands = slashCommands.sort((a, b) => a.data.name.localeCompare(b.data.name));
                    let commandsText = '';
                    sortedCommands.forEach(cmd => {
                        if (cmd.data && cmd.data.name && cmd.data.description) {
                            commandsText += `**/${cmd.data.name}** - ${cmd.data.description}\n`;
                        }
                    });
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(commandsText || 'Komut bulunamadı.')
                    );
                } else {
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('Hiç slash komutu bulunamadı.')
                    );
                }
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# ⬢ ${interaction.guild.name}`)
                );
                await interaction.update({ 
                    embeds: [],
                    components: [container.toJSON(), ...interaction.message.components.filter(c => c.type !== 17)],
                    flags: 32768
                }).catch(err => {
                    console.error(`Menü güncelleme hatası: ${err.message}`);
                });
            }
            if (selectedValue === 'prefix_commands') {
                const prefixCommands = [...core.prefixHandler.commands.values()];
                const container = new ContainerBuilder().setAccentColor(0x2B2D31);
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 📝 Prefix Komutları\nAşağıda tüm \`${prefix}\` ile başlayan komutlar listelenmiştir.`)
                );
                container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

                if (prefixCommands.length > 0) {
                    const sortedCommands = prefixCommands.sort((a, b) => a.name.localeCompare(b.name));
                    let commandsText = '';
                    sortedCommands.forEach(cmd => {
                        const aliases = cmd.subname && Array.isArray(cmd.subname) ? `(${cmd.subname.join(', ')})` : '';
                        commandsText += `**${prefix}${cmd.name}** ${aliases} - ${cmd.description || 'Açıklama yok'}\n`;
                    });
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(commandsText || 'Komut bulunamadı.')
                    );
                } else {
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('Hiç prefix komutu bulunamadı.')
                    );
                }
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# ⬢ ${interaction.guild.name}`)
                );
                await interaction.update({ 
                    embeds: [],
                    components: [container.toJSON(), ...interaction.message.components.filter(c => c.type !== 17)],
                    flags: 32768
                }).catch(err => {
                    console.error(`Menü güncelleme hatası: ${err.message}`);
                });
            }
        } catch (error) {
            console.error(`Menü handler hatası: ${error.message}`);
        }
    }
};