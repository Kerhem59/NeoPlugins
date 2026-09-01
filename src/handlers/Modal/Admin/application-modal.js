const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
    customId: 'application_modal',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const jsonManager = new JsonManager();
        const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};

        if (!settings.applicationLogChannel) {
            return interaction.editReply('❌ Sistem yapılandırılmamış. Lütfen yöneticilere bildirin (Başvuru kanalı eksik).');
        }

        const logChannel = interaction.guild.channels.cache.get(settings.applicationLogChannel);
        if (!logChannel) {
            return interaction.editReply('❌ Başvuru log kanalı bulunamadı. Lütfen yöneticilere bildirin.');
        }

        const q1 = interaction.fields.getTextInputValue('app_q1');
        const q2 = interaction.fields.getTextInputValue('app_q2');
        const q3 = interaction.fields.getTextInputValue('app_q3');
        const q4 = interaction.fields.getTextInputValue('app_q4');
        const q5 = interaction.fields.getTextInputValue('app_q5');

        const embed = new EmbedBuilder()
            .setTitle('📄 Yeni Yetkili Başvurusu')
            .setColor('#F1C40F') // Sarı (Beklemede)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 Başvuran', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
                { name: '1️⃣ İsim Soyisim ve Yaş', value: `\`\`\`${q1}\`\`\``, inline: false },
                { name: '2️⃣ Günlük Aktiflik', value: `\`\`\`${q2}\`\`\``, inline: false },
                { name: '3️⃣ Önceki Deneyimler', value: `\`\`\`${q3}\`\`\``, inline: false },
                { name: '4️⃣ Neden Seçmeliyiz?', value: `\`\`\`${q4}\`\`\``, inline: false },
                { name: '5️⃣ Roleplay Bilgisi', value: `\`\`\`${q5}\`\`\``, inline: false }
            )
            .setFooter({ text: 'Başvuru Sistemi', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`apply_approve_${interaction.user.id}`)
                .setLabel('Onayla')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`apply_reject_${interaction.user.id}`)
                .setLabel('Reddet')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

        try {
            await logChannel.send({ embeds: [embed], components: [row] });
            await interaction.editReply('✅ Başvurunuz başarıyla iletildi. Sonuç size DM (Özel Mesaj) üzerinden bildirilecektir.');
        } catch (error) {
            console.error('Başvuru Gönderme Hatası:', error);
            await interaction.editReply('❌ Başvurunuz iletilirken bir hata oluştu.');
        }
    }
};
