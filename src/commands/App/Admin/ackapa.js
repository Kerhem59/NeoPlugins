const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ackapa')
        .setDescription('Bot üzerindeki tüm komutları aktif veya pasif hale getirebileceğiniz kontrol paneli.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    async execute(ctx) {
        const interaction = ctx.interaction;
        const fs = require('fs');
        const path = require('path');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const commandsPath = path.join(__dirname, '../');
        let categories = [];
        try {
            categories = fs.readdirSync(commandsPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
        } catch (err) {
            console.error('Kategori klasörleri okunamadı:', err);
        }

        if (categories.length === 0) {
            return interaction.reply({ content: '❌ Sistemde yönetilebilecek kategori bulunamadı.', ephemeral: true });
        }

        const CATEGORY_EMOJIS = {
            Admin: '⚙️',
            Economy: '💰',
            Moderasyon: '🛡️',
            Root: '👑',
            Stats: '📊',
            member: '👤'
        };

        const options = categories.map(cat => {
            return {
                label: `${cat} Komutları`,
                description: `${cat} kategorisindeki komutları aktif/pasif hale getirin`,
                value: `cat_select_${cat}`,
                emoji: CATEGORY_EMOJIS[cat] || '📁'
            };
        });

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('category_management_select')
                    .setPlaceholder('⚡ Yönetmek istediğiniz komut kategorisini seçin...')
                    .addOptions(options.slice(0, 25))
            );

        const embed = new EmbedBuilder()
            .setTitle('🔷 COMMAND CONTROL CENTER ⬢ KOMUT YÖNETİMİ')
            .setDescription(
                '```ansi\n\u001b[1;34m[ KOMUT KONTROL PANELİ ]\u001b[0m\n' +
                'Sunucunuzda üyelerin erişmesini istemediğiniz komutları\n' +
                'aşağıdaki menüden kategori seçerek tek tıkla kapatabilirsiniz.\n```'
            )
            .addFields(
                { name: '📁 Mevcut Kategoriler', value: categories.map(c => `🔹 **${c}**`).join(' • '), inline: false }
            )
            .setColor('#2563eb')
            .setFooter({ text: 'Crystal Roleplay & Neo Bots ⬢ Mavi Tema Komut Paneli' })
            .setTimestamp();

        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    embeds: [embed],
                    components: [row]
                });
            } else {
                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });
            }
        } catch (err) {
            console.error('ackapa yanıt gönderme hatası:', err.message || err);
        }
    }
};
