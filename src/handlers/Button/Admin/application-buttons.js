const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

// Ortak işlem fonksiyonu (Onayla/Reddet için)
async function handleAction(interaction, action) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ Bu işlemi yapmak için **Yönetici** yetkisine sahip olmalısınız.', ephemeral: true });
    }

    await interaction.deferUpdate();

    const userId = interaction.customId.replace(`apply_${action}_`, '');
    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};

    const embed = EmbedBuilder.from(interaction.message.embeds[0]);

    try {
        const applicant = await interaction.client.users.fetch(userId);

        if (action === 'approve') {
            embed.setColor('#2ECC71');
            embed.addFields({ name: '✅ Durum', value: `**ONAYLANDI** - İşlem Yapan: ${interaction.user}` });
            
            const interviewChannel = settings.interviewChannel ? `<#${settings.interviewChannel}>` : 'mülakat kanalına';
            await applicant.send(`Tebrikler! **${interaction.guild.name}** sunucusuna yaptığınız yetkili başvurusu **onaylandı**.\nLütfen en kısa sürede ${interviewChannel} geçerek yetkilileri bekleyiniz.`).catch(() => {});
        } else if (action === 'reject') {
            embed.setColor('#E74C3C');
            embed.addFields({ name: '❌ Durum', value: `**REDDEDİLDİ** - İşlem Yapan: ${interaction.user}` });

            await applicant.send(`Maalesef, **${interaction.guild.name}** sunucusuna yaptığınız yetkili başvurusu **reddedildi**.\nİlginiz için teşekkür ederiz.`).catch(() => {});
        }

        // Remove buttons
        await interaction.editReply({ embeds: [embed], components: [] });
    } catch (error) {
        console.error('Approve/Reject Error:', error);
        await interaction.followUp({ content: '❌ İşlem sırasında bir hata oluştu. Kullanıcıya DM gönderilememiş olabilir.', ephemeral: true });
    }
}

module.exports = [
    {
        customId: 'apply_start',
        async execute(interaction) {
            const modal = new ModalBuilder()
                .setCustomId('application_modal')
                .setTitle('Yetkili Başvurusu');

            const q1 = new TextInputBuilder()
                .setCustomId('app_q1')
                .setLabel('İsim Soyisim ve Yaşınız')
                .setPlaceholder('Örn: Kerem Yılmaz, 18')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const q2 = new TextInputBuilder()
                .setCustomId('app_q2')
                .setLabel('Günlük Aktiflik Süreniz')
                .setPlaceholder('Örn: Hafta içi 4 saat, Hafta sonu 8 saat')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const q3 = new TextInputBuilder()
                .setCustomId('app_q3')
                .setLabel('Önceki Yetkililik Deneyimleriniz')
                .setPlaceholder('Hangi sunucularda görev yaptınız?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const q4 = new TextInputBuilder()
                .setCustomId('app_q4')
                .setLabel('Neden Bizi Seçtiniz / Neden Seçmeliyiz?')
                .setPlaceholder('Kendinizi neden uygun görüyorsunuz?')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const q5 = new TextInputBuilder()
                .setCustomId('app_q5')
                .setLabel('Roleplay Bilginiz (Terimleri açıklayın)')
                .setPlaceholder('RDM, VDM, Fail RP gibi temel terimleri kısaca açıklayın.')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(q1),
                new ActionRowBuilder().addComponents(q2),
                new ActionRowBuilder().addComponents(q3),
                new ActionRowBuilder().addComponents(q4),
                new ActionRowBuilder().addComponents(q5)
            );

            await interaction.showModal(modal);
        }
    },
    {
        customId: 'apply_approve_',
        async execute(interaction) {
            await handleAction(interaction, 'approve');
        }
    },
    {
        customId: 'apply_reject_',
        async execute(interaction) {
            await handleAction(interaction, 'reject');
        }
    }
];
