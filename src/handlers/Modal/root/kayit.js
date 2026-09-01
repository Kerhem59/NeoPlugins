const JsonManager = require('../../../../Database/SuperCore/JsonManager');
const UserRegistry = require('../../../utils/UserRegistry');

module.exports = [
    {
        customId: 'kayit_modal',
        async execute(interaction) {
            const steamId = interaction.fields.getTextInputValue('steam_id');
            const icName = interaction.fields.getTextInputValue('ic_name');
            const discordId = interaction.user.id;

            const jsonManager = new JsonManager();
            const guildId = interaction.guild.id;
            const users = await jsonManager.get('users/data', guildId) || {};

            // Daha önce kayıt olmuş mu kontrolü (Opsiyonel)
            const alreadyRegistered = Object.values(users).find(u => u.discordId === discordId);
            if (alreadyRegistered) {
                return interaction.reply({ content: '❌ Zaten bir hesabınız kayıtlı!', ephemeral: true });
            }

            if (users[steamId]) {
                return interaction.reply({ content: '❌ Bu SteamID zaten başka bir hesapla eşleşmiş!', ephemeral: true });
            }

            // Kaydet
            users[steamId] = {
                discordId: discordId,
                icName: icName,
                rewardClaimed: false, // Yeni kayıt olduğu için ödül bekliyor
                registeredAt: new Date().toISOString()
            };

            await jsonManager.set('users/data', guildId, users);

            const settings = await jsonManager.get('server/settings', guildId) || {};
            const rewards = UserRegistry.getVerifyRewards(settings);

            await interaction.reply({
                content:
                    `✅ Başarıyla kayıt oldunuz!\n\n` +
                    `**SteamID:** ${steamId}\n` +
                    `**Karakter İsmi:** ${icName}\n\n` +
                    `🎁 Oyuna girip \`/dogrula\` yazın:\n` +
                    `💰 **${rewards.money.toLocaleString('tr-TR')}** TL` +
                    (rewards.exp > 0 ? `\n✨ **${rewards.exp.toLocaleString('tr-TR')}** EXP` : ''),
                ephemeral: true
            });
        }
    }
];
