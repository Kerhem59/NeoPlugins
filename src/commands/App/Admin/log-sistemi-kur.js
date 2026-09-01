const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log-sistemi-kur')
    .setDescription('Tüm log kanallarını otomatik olarak kurar ve veritabanına kaydeder.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  name: 'log-sistemi-kur',
  description: 'Gelişmiş log kanallarını otomatik oluşturur.',
  usage: 'log-sistemi-kur',

  async execute(ctx) {
    await ctx.deferReply();

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
        return ctx.editReply('❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.');
    }

    try {
        const guild = ctx.guild;

        // Kategori Oluşturma
        const category = await guild.channels.create({
            name: '📊 Neo Bots LOGLAR',
            type: ChannelType.GuildCategory,
            position: 0, // Üstte görünsün
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel], // Herkes göremesin
                },
                {
                    id: guild.client.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                }
            ]
        });

        const channelsToCreate = [
            { name: '💬┃chat-log', key: 'chatLogChannel', desc: 'Oyun içi sohbet logları.' },
            { name: '🟢┃kill-log', key: 'killLogChannel', desc: 'Ölüm ve öldürme logları.' },
            { name: '💡┃hasar-log', key: 'damageLogChannel', desc: 'Hasar, bayılma ve canlanma logları.' },
            { name: '🏗️┃insaat-log', key: 'buildLogChannel', desc: 'Barikat ve yapı yerleştirme/kaldırma.' },
            { name: '🔹┃grup-log', key: 'groupLogChannel', desc: 'Grup oluşturma ve üyelik logları.' },
            { name: '🖥️┃sunucu-log', key: 'serverLogChannel', desc: 'Plugin yükleme, dinleyici ve sunucu olayları.' },
            { name: '🚫┃ban-log', key: 'banLogChannel', desc: 'Ban ve kick logları.' },
            { name: '🟢┃giris-cikis', key: 'joinLeaveLogChannel', desc: 'Oyuncu giriş-çıkış logları.' },
            { name: '🛡️┃admin-log', key: 'adminLogChannel', desc: 'Yetkili eylemleri logları.' },
            { name: '📝┃konsol-log', key: 'consoleLogChannel', desc: 'Bot konsol çıktıları (anlık).' }
        ];

        const jsonManager = new JsonManager();
        let settings = await jsonManager.get('server/settings', guild.id) || {};

        let createdText = "";

        for (const ch of channelsToCreate) {
            const newChannel = await guild.channels.create({
                name: ch.name,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: ch.desc
            });
            
            settings[ch.key] = newChannel.id;
            createdText += `<#${newChannel.id}> - ${ch.desc}\n`;
        }

        // Veritabanını kaydet
        await jsonManager.set('server/settings', guild.id, settings);

        const embed = new EmbedBuilder()
            .setTitle('✅ Log Sistemi Başarıyla Kuruldu')
            .setDescription(`Tüm log kanalları **Neo Bots LOGLAR** kategorisi altında oluşturuldu ve sisteme kaydedildi.\n\n**Oluşturulan Kanallar:**\n${createdText}`)
            .setColor('#2ECC71')
            .setFooter({ text: 'Neo Bots ⬢ Otomatik Kurulum', iconURL: ctx.client.user.displayAvatarURL() })
            .setTimestamp();

        await ctx.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Log kurulum hatası:', error);
        await ctx.editReply('❌ Kanallar oluşturulurken bir hata oluştu: ' + error.message);
    }
  },
};
