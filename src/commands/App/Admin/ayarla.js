const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, Routes } = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('@discordjs/builders');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayarla')
    .setDescription('Sunucu ayarlarını panel üzerinden yönetir')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'ayarla',
  description: 'Sunucu ayarları panelini açar',
  usage: 'ayarla',

  async execute(ctx) {
    await ctx.deferReply();

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
        return ctx.editReply('❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.');
    }

    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', ctx.guild.id) || {};

    // ContainerBuilder ile Ayar Paneli
    const container = new ContainerBuilder()
        .setAccentColor(0x0088FF);

    // Başlık
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ⚙️ ${ctx.guild.name} — Sunucu Ayar Paneli\nLütfen düzenlemek istediğiniz kategoriyi aşağıdaki menüden seçin.`)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
    );

    // Mevcut Ayar Durumları
    const statusLines = [
        `👋 **Giriş-Çıkış:** ${settings.welcomeChannel ? `✅ <#${settings.welcomeChannel}>` : '❌ Ayarlanmamış'}`,
        `🎫 **Ticket Sistemi:** ${settings.ticketChannel ? `✅ <#${settings.ticketChannel}>` : '❌ Ayarlanmamış'}`,
        `🛡️ **Oto-Rol:** ${settings.autoRole ? `✅ <@&${settings.autoRole}>` : '❌ Ayarlanmamış'}`,
        `👑 **Müşteri Rolü:** ${settings.customerRole ? `✅ <@&${settings.customerRole}>` : '❌ Ayarlanmamış'}`,
        `🛒 **Satış Log Kanalı:** ${settings.customerLogChannel ? `✅ <#${settings.customerLogChannel}>` : '❌ Ayarlanmamış'}`,
        `📊 **Mod/Log Kanalları:** ${settings.modLogChannel ? `✅ <#${settings.modLogChannel}>` : '❌ Ayarlanmamış'}`,
        `💬 **Mesaj Log Kanalı:** ${settings.messageLogChannel ? `✅ <#${settings.messageLogChannel}>` : '❌ Ayarlanmamış'}`,
        `🎙️ **Ses Log Kanalı:** ${settings.voiceLogChannel ? `✅ <#${settings.voiceLogChannel}>` : '❌ Ayarlanmamış'}`
    ].join('\n');

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(statusLines)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
    );

    // Kategori Seçim Menüsü
    container.addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('settings_category_select')
                    .setPlaceholder('Düzenlenecek Kategoriyi Seçin...')
                    .addOptions([
                        { label: 'Giriş-Çıkış Ayarları', description: 'Hoşgeldin ve ayrılma mesajları', value: 'cat_welcome', emoji: { name: '👋' } },
                        { label: 'Ticket Ayarları', description: 'Talep sistemi ve yetkililer', value: 'cat_ticket', emoji: { name: '🎫' } },
                        { label: 'Müşteri & Satış Ayarları', description: 'Müşteri rolü ve satış log kanalı', value: 'cat_customer', emoji: { name: '👑' } },
                        { label: 'Log Ayarları', description: 'Kanal logları (Chat, Ban, Voice vb.)', value: 'cat_logs', emoji: { name: '📊' } },
                        { label: 'Sistem Aç/Kapa (systems.json)', description: 'Tüm bot sistemlerinin True/False durumları', value: 'cat_toggles', emoji: { name: '🔘' } },
                        { label: 'Genel Ayarlar', description: 'Otorol, Haber rolü vb.', value: 'cat_general', emoji: { name: '⚙️' } },
                        { label: 'Sıfırla', description: 'Tüm ayarları temizler', value: 'cat_reset', emoji: { name: '🗑️' } },
                    ]),
            ),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} • Unturned Plugin Store Ayarları`)
    );

    await ctx.editReply({
        components: [container.toJSON()],
        flags: 32768
    });
  },
};
