const { EmbedBuilder } = require('discord.js');
const main = require('../../../config/genaral/main.json');

module.exports = {
    customId: 'help_category',
    async execute(interaction) {
        const prefix = main.prefix || '!';
        const selected = interaction.values[0];

        const categories = {
            home: {
                title: '🏠 Ana Sayfa',
                description: 'Neo Bots bot komut yardım menüsüne hoş geldiniz!\n\nAşağıdaki menüden bir kategori seçerek ilgili komutları görüntüleyebilirsiniz.',
                fields: [
                    { name: '📋 Genel Bilgiler', value: `> Prefix: \`${prefix}\`\n> Slash: \`/\`\n> Toplam Kategori: **5**`, inline: true },
                    { name: '💡 İpucu', value: '> Komutları hem slash (`/komut`)\n> hem de prefix (`!komut`)\n> ile kullanabilirsiniz.', inline: true },
                    { name: '\u200b', value: '━━━━━━━━━━━━━━━━━━━━━━', inline: false },
                    { name: '📂 Kategoriler', value: '🔹 **Genel** ➜ Profil, rank, sıralama\n🎉 **Eğlence & Sosyal** ➜ Rehber, avatar\n⏸️ **AFK Sistemi** ➜ AFK yönetimi\n🎫 **Ticket & Destek** ➜ Talep ve istatistik\n🛡️ **Yönetim** ➜ Sunucu ayarları ve kurulumlar', inline: false }
                ]
            },
            general: {
                title: '🔹 Genel Komutlar',
                description: 'Profil, seviye ve ekonomi ile ilgili komutlar.',
                fields: [
                    { name: '</profil:0>', value: '> Profilinizi veya başka birinin profilini görüntüleyin.\n> **Kullanım:** `/profil [@kullanıcı]`\n> **Alternatif:** `!profil`, `!profile`, `!p`', inline: false },
                    { name: '</rank:0>', value: '> Seviye ve XP durumunuzu görüntüleyin.\n> **Kullanım:** `/rank [@kullanıcı]`\n> **Alternatif:** `!rank`, `!seviye`, `!level`, `!xp`', inline: false },
                    { name: '</top:0>', value: '> Sunucu seviye sıralamasını görüntüleyin.\n> **Kullanım:** `/top`\n> **Alternatif:** `!top`, `!sıralama`, `!leaderboard`, `!lb`', inline: false }
                ]
            },
            social: {
                title: '🎉 Eğlence & Sosyal',
                description: 'Kullanıcı bilgileri komutları.',
                fields: [
                    { name: '</avatar:0>', value: '> Kullanıcının avatarını büyük boyutta görüntüleyin.\n> **Kullanım:** `/avatar [@kullanıcı]`\n> **Alternatif:** `!avatar`, `!pp`', inline: false },
                    { name: '</banner:0>', value: '> Kullanıcının banner görselini görüntüleyin.\n> **Kullanım:** `/banner [@kullanıcı]`\n> **Alternatif:** `!banner`', inline: false }
                ]
            },
            afk: {
                title: '⏸️ AFK Sistemi',
                description: 'AFK durumu ve istatistikleri komutları.',
                fields: [
                    { name: '</afk:0>', value: '> AFK moduna geçin. Biri sizi etiketlediğinde otomatik yanıt gönderilir.\n> **Kullanım:** `/afk [sebep]`\n> **Alternatif:** `!afk [sebep]`', inline: false },
                    { name: '</afk-istatistik:0>', value: '> AFK istatistiklerinizi görüntüleyin.\n> **Kullanım:** `/afk-istatistik [@kullanıcı]`\n> **Alternatif:** `!afk-istatistik`', inline: false }
                ]
            },
            ticket: {
                title: '🎫 Ticket & Destek',
                description: 'Destek talebi ve istatistik komutları.',
                fields: [
                    { name: '</ticket-kur:0>', value: '> Ticket panelini belirtilen kanala kurar.\n> **Kullanım:** `/ticket-kur`\n> **Yetki:** `Yönetici`', inline: false },
                    { name: '</ticket-istatistik:0>', value: '> Haftalık ticket istatistiklerini görüntüleyin.\n> **Kullanım:** `/ticket-istatistik`\n> **Yetki:** `Yönetici`', inline: false }
                ]
            },
            abone: {
                title: '👑 Abone Sistemi',
                description: 'Abone kanıt paneli ve yetkili istatistik komutları.',
                fields: [
                    { name: '</abone-kur:0>', value: '> Abone Kanıt Paneli ve sistemini kurar.\n> **Kullanım:** `/abone-kur`\n> **Yetki:** `Yönetici`', inline: false },
                    { name: '</abone-ver:0>', value: '> Kullanıcıya Abone Rolü verir.\n> **Kullanım:** `/abone-ver <kullanıcı>`\n> **Yetki:** `Abone Yetkilisi`', inline: false },
                    { name: '</abone-al:0>', value: '> Kullanıcıdan Abone Rolünü alır.\n> **Kullanım:** `/abone-al <kullanıcı>`\n> **Yetki:** `Abone Yetkilisi`', inline: false },
                    { name: '</abone-stats:0>', value: '> Abone yetkili istatistiklerini ve liderlik tablosunu listeler.\n> **Kullanım:** `/abone-stats [yetkili]`', inline: false }
                ]
            },
            admin: {
                title: '🛡️ Yönetim Komutları',
                description: 'Sunucu yönetimi ve kurulum komutları. (Yönetici yetkisi gerektirir)',
                fields: [
                    { name: '</ayarla:0>', value: '> Sunucu ayar panelini açar.\n> **Kullanım:** `/ayarla`', inline: false },
                    { name: '</emojiekle:0>', value: '> Sunucuya toplu emoji ekler.\n> **Kullanım:** `/emojiekle`', inline: false },
                    { name: '</sil:0>', value: '> Belirtilen sayıda mesajı siler.\n> **Kullanım:** `/sil <sayı>`', inline: false }
                ]
            }
        };

        const data = categories[selected];
        if (!data) return;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(data.title)
            .setDescription(data.description)
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setTimestamp()
            .setFooter({ text: 'Neo Bots ⬢ Yardım Menüsü', iconURL: interaction.client.user.displayAvatarURL() });

        if (data.fields) {
            const db = require('../../../../Database/SuperCore/JsonDatabaseManager');
            let disabledCommands = new Set();
            try {
                const rows = db.get('command_settings', { guild_id: interaction.guild.id, is_active: 0 });
                if (rows) {
                    rows.forEach(r => disabledCommands.add(r.command_name));
                }
            } catch (err) {
                console.error('Yardım menüsü için komut ayarları okunamadı:', err);
            }

            const filteredFields = data.fields.filter(field => {
                const match = field.name.match(/<\/([^:]+):\d*>/);
                if (match) {
                    const cmdName = match[1];
                    if (disabledCommands.has(cmdName)) return false;
                }
                return true;
            });

            if (filteredFields.length > 0) {
                embed.addFields(filteredFields);
            } else if (selected !== 'home') {
                embed.setDescription(data.description + '\n\n*Bu kategorideki tüm komutlar şu anda devre dışı bırakılmıştır.*');
            }
        }

        // Menüdeki seçili öğeyi güncelle
        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_category')
                .setPlaceholder('📂 Kategori Seçin...')
                .addOptions([
                    { label: 'Ana Sayfa', description: 'Genel bilgiler ve kategoriler', value: 'home', emoji: '🏠', default: selected === 'home' },
                    { label: 'Genel Komutlar', description: 'Profil, rank, sıralama', value: 'general', emoji: '🔹', default: selected === 'general' },
                    { label: 'Eğlence & Sosyal', description: 'Avatar, banner', value: 'social', emoji: '🎉', default: selected === 'social' },
                    { label: 'AFK Sistemi', description: 'AFK yönetimi ve istatistikler', value: 'afk', emoji: '⏸️', default: selected === 'afk' },
                    { label: 'Ticket & Destek', description: 'Talep sistemi ve istatistikler', value: 'ticket', emoji: '🎫', default: selected === 'ticket' },
                    { label: 'Yönetim', description: 'Sunucu ayarları ve kurulumlar', value: 'admin', emoji: '🛡️', default: selected === 'admin' },
                ])
        );

        await interaction.update({ embeds: [embed], components: [menu] });
    }
};
