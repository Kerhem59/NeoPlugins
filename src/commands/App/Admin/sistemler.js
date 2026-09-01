const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const systemsManager = require('../../../utils/SystemsManager');

const SYSTEM_CATEGORIES = {
    server: {
        title: '🌐 Sunucu Entegrasyon & Log Modülleri',
        keys: ['consolelogger', 'autobackup']
    },
    activity: {
        title: '💎 Ekonomi & Aktivite Sistemleri',
        keys: ['economy', 'level']
    },
    general: {
        title: '🛠️ Genel Topluluk & Yönetim Araçları',
        keys: ['afk', 'automessage', 'welcome', 'autorole', 'ticket', 'application', 'store']
    }
};

const SYSTEM_LABELS = {
    afk: { label: 'AFK Modu', emoji: '🌙', desc: 'Kullanıcıların AFK kalma durumu ve etiketlenme yanıtları' },
    autobackup: { label: 'Otomatik Yedeğe Alma', emoji: '💾', desc: '30 dakikada bir veritabanı yedeği kaydetme' },
    consolelogger: { label: 'Konsol & Discord Log', emoji: '📺', desc: 'Sistem olaylarının konsol ve Discord log kanallarına iletimi' },
    automessage: { label: 'Oto-Mesaj Yanıtlayıcı', emoji: '💬', desc: 'Sık sorulan sorulara akıllı otomatik yanıt sistemi' },
    level: { label: 'Level & XP Sistemi', emoji: '⭐', desc: 'Mesaj ve ses seviye atlama mekanizması' },
    economy: { label: 'Ekonomi Sistemi', emoji: '💰', desc: 'Bakiye, cüzdan ve sunucu içi para işlemleri' },
    welcome: { label: 'Giriş-Çıkış Mesajları', emoji: '👋', desc: 'Resimli/metinli hoşgeldin ve ayrılma mesajları' },
    autorole: { label: 'Otorol Sistemi', emoji: '🛡️', desc: 'Sunucuya katılan üyelere otomatik rol verilmesi' },
    ticket: { label: 'Ticket / Destek Talebi', emoji: '🎫', desc: 'Kanal destek talebi açma sistemi' },
    application: { label: 'Yetkili Başvurusu', emoji: '📝', desc: 'Yetkili alım formu ve mülakat takibi' },
    store: { label: 'Plugin Mağazası & Vitrin', emoji: '🛒', desc: 'Unturned plugin mağazası ve vitrin sipariş sistemi' }
};

function generateSystemsPanel() {
    const systems = systemsManager.getSystems();
    
    let totalCount = 0;
    let activeCount = 0;
    const options = [];

    const embed = new EmbedBuilder()
        .setTitle('🔷 SYSTEM CONTROL CENTER ⬢ MODÜLER AÇ/KAPA')
        .setDescription(
            '```ansi\n\u001b[1;34m[ SİSTEM DURUMU & YÖNETİM PANELİ ]\u001b[0m\n' +
            'Aşağıdaki sistemlerin durumunu değiştirebilirsiniz.\n' +
            'Değişiklikler anında systems.json dosyasına kaydedilir.\n```'
        )
        .setColor('#2563eb');

    for (const [catKey, category] of Object.entries(SYSTEM_CATEGORIES)) {
        const lines = [];
        for (const key of category.keys) {
            const meta = SYSTEM_LABELS[key];
            if (!meta) continue;
            totalCount++;
            const isEnabled = systems[key] !== false;
            if (isEnabled) activeCount++;

            const statusBadge = isEnabled ? '`🟢 AÇIK`' : '`🔴 KAPALI`';
            lines.push(`${meta.emoji} **${meta.label}**: ${statusBadge}`);

            options.push({
                label: `${meta.label}`,
                description: `${isEnabled ? '🔴 KAPAT' : '🟢 AÇ'} - ${meta.desc.slice(0, 50)}`,
                value: `system_toggle_${key}`,
                emoji: meta.emoji
            });
        }

        embed.addFields({
            name: category.title,
            value: lines.join('\n') || 'Sistem bulunamadı.',
            inline: false
        });
    }

    const inactiveCount = totalCount - activeCount;

    embed.addFields({
        name: '📊 Sistem İstatistikleri',
        value: `🔹 **Aktif Sistemler:** \`${activeCount}\` | 🔸 **Pasif Sistemler:** \`${inactiveCount}\` | 🔷 **Toplam:** \`${totalCount}\``,
        inline: false
    });

    embed.setFooter({
        text: 'System Control Panel',
        iconURL: 'https://cdn.discordapp.com/emojis/1356821571414786079.gif'
    }).setTimestamp();

    const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('sistemler_select_toggle')
            .setPlaceholder('⚡ Durumunu değiştirmek istediğiniz sistemi seçin...')
            .addOptions(options.slice(0, 25))
    );

    const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_systems_all_on')
            .setLabel('Tümünü Aç')
            .setEmoji('🟢')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('btn_systems_all_off')
            .setLabel('Tümünü Kapat')
            .setEmoji('🔴')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('btn_systems_refresh')
            .setLabel('Yenile')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Primary)
    );

    return { embeds: [embed], components: [selectMenu, buttonRow] };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sistemler')
        .setDescription('Bot üzerindeki tüm modüler sistemleri Aç/Kapa (True/False) yapabileceğiniz kontrol paneli.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    
    name: 'sistemler',
    description: 'Bot sistemleri kontrol panelini açar.',
    usage: 'sistemler',

    generateSystemsPanel,

    async execute(ctx) {
        const interaction = ctx.interaction || ctx;

        if (interaction.member && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const panelData = generateSystemsPanel();
        
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ ...panelData, ephemeral: true });
        } else {
            await interaction.reply({ ...panelData, ephemeral: true });
        }
    }
};
