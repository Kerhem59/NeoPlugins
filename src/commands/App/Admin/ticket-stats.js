const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-istatistik')
        .setDescription('Destek talebi istatistiklerini gösterir'),

    name: 'ticket-istatistik',
    description: 'Destek talebi istatistiklerini gösterir',

    async execute(ctx) {
        const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
        const jsonManager = new JsonManager();
        const guildId = ctx.guild.id;
        const stats = await jsonManager.get('ticket/stats', guildId) || {};

        const availableWeeks = Object.keys(stats).sort().reverse().slice(0, 25);

        if (availableWeeks.length === 0) {
            return ctx.reply('❌ Henüz kaydedilmiş herhangi bir istatistik verisi bulunmuyor.');
        }

        // Tarih Aralığı Hesaplama Fonksiyonu
        function getWeekRange(weekKey) {
            const [year, week] = weekKey.split('-W').map(Number);
            const simple = new Date(year, 0, 1 + (week - 1) * 7);
            const dow = simple.getDay();
            const ISOweekStart = simple;
            if (dow <= 4)
                ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
            else
                ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
            
            const ISOweekEnd = new Date(ISOweekStart);
            ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
            
            return `${ISOweekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${ISOweekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`;
        }

        const embed = new EmbedBuilder()
            .setTitle('📂 İstatistik Arşivi')
            .setDescription('Aşağıdaki menüden tarih aralığına göre bir hafta seçerek yetkili performanslarını görebilirsiniz.')
            .setColor('#3498DB');

        const menu = new StringSelectMenuBuilder()
            .setCustomId('stats_week_select')
            .setPlaceholder('Tarih Aralığı Seçiniz...')
            .addOptions(availableWeeks.map(week => ({
                label: `${week.split('-')[0]} | ${week.split('-')[1]}. Hafta`,
                description: getWeekRange(week),
                value: week,
                emoji: '📅'
            })));

        const row = new ActionRowBuilder().addComponents(menu);

        await ctx.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
