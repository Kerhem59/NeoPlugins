const { SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, StringSelectMenuBuilder } = require('@discordjs/builders');
const main = require('../../../config/genaral/main.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardim')
        .setDescription('Tüm komutları kategorilere göre listeler'),
    
    name: 'yardim',
    subname: ['help', 'y'],
    description: 'Tüm komutları listeler',
    
    async execute(ctx) {
        const prefix = main.prefix || '!';

        const categories = {
            home: {
                emoji: '🏠',
                title: '🏠 Ana Sayfa',
                accentColor: 0x5865F2,
                content: [
                    '## 🏠 Neo Bots — Yardım Menüsü',
                    'Komut yardım menüsüne hoş geldiniz!',
                    'Aşağıdaki menüden bir kategori seçerek ilgili komutları görüntüleyebilirsiniz.\n',
                    '**📋 Genel Bilgiler**',
                    `> Prefix: \`${prefix}\``,
                    '> Slash: `/`',
                    '> Toplam Kategori: **6**\n',
                    '**💡 İpucu**',
                    '> Komutları hem slash (`/komut`)',
                    '> hem de prefix (`!komut`)',
                    '> ile kullanabilirsiniz.\n',
                    '━━━━━━━━━━━━━━━━━━━━━━\n',
                    '**📂 Kategoriler**',
                    '🔹 **Genel** ➜ Profil, rank, sıralama',
                    '🎉 **Eğlence & Sosyal** ➜ Rehber, avatar',
                    '⏸️ **AFK Sistemi** ➜ AFK yönetimi',
                    '🎫 **Ticket & Destek** ➜ Talep ve istatistik',
                    '👑 **Abone Sistemi** ➜ Abone kanıt ve yetkili istatistikleri',
                    '🛡️ **Yönetim** ➜ Sunucu ayarları ve kurulumlar'
                ].join('\n'),
                commands: []
            },
            general: {
                emoji: '🔹',
                title: '🔹 Genel Komutlar',
                accentColor: 0x5865F2,
                content: '## 🔹 Genel Komutlar\nProfil, seviye ve ekonomi ile ilgili komutlar.',
                commands: [
                    { name: 'profil', text: '**</profil:0>**\n> Profilinizi veya başka birinin profilini görüntüleyin.\n> **Kullanım:** `/profil [@kullanıcı]`\n> **Alternatif:** `!profil`, `!profile`, `!p`' },
                    { name: 'rank', text: '**</rank:0>**\n> Seviye ve XP durumunuzu görüntüleyin.\n> **Kullanım:** `/rank [@kullanıcı]`\n> **Alternatif:** `!rank`, `!seviye`, `!level`, `!xp`' },
                    { name: 'top', text: '**</top:0>**\n> Sunucu seviye sıralamasını görüntüleyin.\n> **Kullanım:** `/top`\n> **Alternatif:** `!top`, `!sıralama`, `!leaderboard`, `!lb`' }
                ]
            },
            abone: {
                emoji: '👑',
                title: '👑 Abone Sistemi',
                accentColor: 0xF1C40F,
                content: '## 👑 Abone Sistemi\nAbone kanıt paneli ve yetkili istatistik komutları.',
                commands: [
                    { name: 'abone-kur', text: '**</abone-kur:0>**\n> Abone Kanıt Paneli ve sistemini kurar.\n> **Kullanım:** `/abone-kur`\n> **Yetki:** `Yönetici`' },
                    { name: 'abone-ver', text: '**</abone-ver:0>**\n> Kullanıcıya Abone Rolü verir.\n> **Kullanım:** `/abone-ver <kullanıcı>`\n> **Yetki:** `Abone Yetkilisi`' },
                    { name: 'abone-al', text: '**</abone-al:0>**\n> Kullanıcıdan Abone Rolünü alır.\n> **Kullanım:** `/abone-al <kullanıcı>`\n> **Yetki:** `Abone Yetkilisi`' },
                    { name: 'abone-stats', text: '**</abone-stats:0>**\n> Abone yetkili istatistiklerini ve liderlik tablosunu listeler.\n> **Kullanım:** `/abone-stats [yetkili]`' }
                ]
            },
            social: {
                emoji: '🎉',
                title: '🎉 Eğlence & Sosyal',
                accentColor: 0xE91E63,
                content: '## 🎉 Eğlence & Sosyal\nKullanıcı bilgileri komutları.',
                commands: [
                    { name: 'avatar', text: '**</avatar:0>**\n> Kullanıcının avatarını büyük boyutta görüntüleyin.\n> **Kullanım:** `/avatar [@kullanıcı]`\n> **Alternatif:** `!avatar`, `!pp`' },
                    { name: 'banner', text: '**</banner:0>**\n> Kullanıcının banner görselini görüntüleyin.\n> **Kullanım:** `/banner [@kullanıcı]`\n> **Alternatif:** `!banner`' }
                ]
            },
            afk: {
                emoji: '⏸️',
                title: '⏸️ AFK Sistemi',
                accentColor: 0x9B59B6,
                content: '## ⏸️ AFK Sistemi\nAFK durumu ve istatistikleri komutları.',
                commands: [
                    { name: 'afk', text: '**</afk:0>**\n> AFK moduna geçin. Biri sizi etiketlediğinde otomatik yanıt gönderilir.\n> **Kullanım:** `/afk [sebep]`\n> **Alternatif:** `!afk [sebep]`' },
                    { name: 'afk-istatistik', text: '**</afk-istatistik:0>**\n> AFK istatistiklerinizi görüntüleyin.\n> **Kullanım:** `/afk-istatistik [@kullanıcı]`\n> **Alternatif:** `!afk-istatistik`' }
                ]
            },
            ticket: {
                emoji: '🎫',
                title: '🎫 Ticket & Destek',
                accentColor: 0x3498DB,
                content: '## 🎫 Ticket & Destek\nDestek talebi ve istatistik komutları.',
                commands: [
                    { name: 'ticket-kur', text: '**</ticket-kur:0>**\n> Ticket panelini belirtilen kanala kurar.\n> **Kullanım:** `/ticket-kur`\n> **Yetki:** `Yönetici`' },
                    { name: 'ticket-istatistik', text: '**</ticket-istatistik:0>**\n> Haftalık ticket istatistiklerini görüntüleyin.\n> **Kullanım:** `/ticket-istatistik`\n> **Yetki:** `Yönetici`' }
                ]
            },
            admin: {
                emoji: '🛡️',
                title: '🛡️ Yönetim Komutları',
                accentColor: 0xE74C3C,
                content: '## 🛡️ Yönetim Komutları\nSunucu yönetimi ve kurulum komutları. (Yönetici yetkisi gerektirir)',
                commands: [
                    { name: 'ayarla', text: '**</ayarla:0>**\n> Sunucu ayar panelini açar.\n> **Kullanım:** `/ayarla`' },
                    { name: 'emojiekle', text: '**</emojiekle:0>**\n> Sunucuya toplu emoji ekler.\n> **Kullanım:** `/emojiekle`' },
                    { name: 'sil', text: '**</sil:0>**\n> Belirtilen sayıda mesajı siler.\n> **Kullanım:** `/sil <sayı>`' }
                ]
            }
        };

        const createContainer = async (cat) => {
            const data = categories[cat];
            const container = new ContainerBuilder()
                .setAccentColor(data.accentColor || 0x5865F2);

            // Devre dışı komutları kontrol et
            let disabledCommands = new Set();
            try {
                const db = require('../../../../Database/SuperCore/JsonDatabaseManager');
                const rows = db.get('command_settings', { guild_id: ctx.guild.id, is_active: 0 });
                if (rows) {
                    rows.forEach(r => disabledCommands.add(r.command_name));
                }
            } catch (err) {
                console.error('Yardım menüsü için komut ayarları okunamadı:', err);
            }

            // Ana içerik
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(data.content)
            );

            // Komut listesi varsa ekle
            if (data.commands && data.commands.length > 0) {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setDivider(true)
                );

                const activeCommands = data.commands.filter(cmd => !disabledCommands.has(cmd.name));

                if (activeCommands.length > 0) {
                    const commandsText = activeCommands.map(cmd => cmd.text).join('\n\n');
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(commandsText)
                    );
                } else {
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('*Bu kategorideki tüm komutlar şu anda devre dışı bırakılmıştır.*')
                    );
                }
            }

            // Footer
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('-# ⬢ Neo Bots • Yardım Menüsü')
            );

            return container;
        };

        const createMenu = (selected) => {
            return new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help_category')
                    .setPlaceholder('📂 Kategori Seçin...')
                    .addOptions([
                        { label: 'Ana Sayfa', description: 'Genel bilgiler ve kategoriler', value: 'home', emoji: { name: '🏠' }, default: selected === 'home' },
                        { label: 'Genel Komutlar', description: 'Profil, rank, sıralama', value: 'general', emoji: { name: '🔹' }, default: selected === 'general' },
                        { label: 'Eğlence & Sosyal', description: 'Avatar, banner', value: 'social', emoji: { name: '🎉' }, default: selected === 'social' },
                        { label: 'AFK Sistemi', description: 'AFK yönetimi ve istatistikler', value: 'afk', emoji: { name: '⏸️' }, default: selected === 'afk' },
                        { label: 'Ticket & Destek', description: 'Talep sistemi ve istatistikler', value: 'ticket', emoji: { name: '🎫' }, default: selected === 'ticket' },
                        { label: 'Abone Sistemi', description: 'Abone kanıt paneli ve yetkili istatistikleri', value: 'abone', emoji: { name: '👑' }, default: selected === 'abone' },
                        { label: 'Yönetim', description: 'Sunucu ayarları ve kurulumlar', value: 'admin', emoji: { name: '🛡️' }, default: selected === 'admin' },
                    ])
            );
        };

        const homeContainer = await createContainer('home');

        await ctx.reply({
            components: [homeContainer.toJSON(), createMenu('home').toJSON()],
            flags: 32768
        });
    }
};
