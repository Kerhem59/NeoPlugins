const JsonManager = require('../../../../Database/SuperCore/JsonManager');

async function handleRoleButton(interaction, roleType) {
    await interaction.deferReply({ ephemeral: true });

    const jsonManager = new JsonManager();
    const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};

    let roleId;
    let roleName;

    if (roleType === 'announce') {
        roleId = settings.announceRole;
        roleName = 'Duyuru Bildirimi';
    } else if (roleType === 'giveaway') {
        roleId = settings.giveawayRole;
        roleName = 'Çekiliş Katılımcısı';
    } else if (roleType === 'event') {
        roleId = settings.eventRole;
        roleName = 'Etkinlik Bildirimi';
    }

    if (!roleId) {
        return interaction.editReply('❌ Bu rol henüz sunucu yöneticileri tarafından ayarlanmamış.');
    }

    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) {
        return interaction.editReply('❌ Ayarlanan rol sunucuda bulunamadı. Silinmiş olabilir.');
    }

    try {
        if (interaction.member.roles.cache.has(roleId)) {
            await interaction.member.roles.remove(roleId);
            return interaction.editReply(`➖ **${roleName}** rolü üzerinizden alındı.`);
        } else {
            await interaction.member.roles.add(roleId);
            return interaction.editReply(`✅ **${roleName}** rolü size verildi.`);
        }
    } catch (error) {
        console.error('Role assign error:', error);
        return interaction.editReply('❌ Rol verilirken bir hata oluştu. Botun rol yetkilerini kontrol edin.');
    }
}

module.exports = [
    {
        customId: 'role_announce',
        async execute(interaction) {
            await handleRoleButton(interaction, 'announce');
        }
    },
    {
        customId: 'role_giveaway',
        async execute(interaction) {
            await handleRoleButton(interaction, 'giveaway');
        }
    },
    {
        customId: 'role_event',
        async execute(interaction) {
            await handleRoleButton(interaction, 'event');
        }
    }
];
