const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rehber-kur')
    .setDescription('Sunucu rehberi (Kurallar, İpuçları, Linkler) panelini kurar.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  name: 'rehber-kur',
  description: 'Sunucu rehberi (Kurallar, İpuçları, Linkler) panelini kurar.',

  async execute(ctx) {
    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
        return ctx.reply({ content: '❌ Bu komutu sadece Yöneticiler kullanabilir.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('📖 Sunucu Rehberi & İpuçları')
        .setDescription('Sunucumuzda keyifli vakit geçirmek için kuralları bilmek ve sunucu dinamiklerini anlamak çok önemlidir.\n\nAşağıdaki menüden merak ettiğiniz başlığı seçerek anında bilgi alabilirsiniz.')
        .setColor('#0088FF')
        .setImage(ctx.guild.bannerURL({ size: 1024 }) || null)
        .setThumbnail(ctx.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `${ctx.guild.name} Rehber Sistemi`, iconURL: ctx.guild.iconURL() || undefined });

    const menu = new StringSelectMenuBuilder()
        .setCustomId('guide_menu_select')
        .setPlaceholder('Öğrenmek istediğiniz başlığı seçin...')
        .addOptions([
            {
                label: 'Genel Kurallar',
                description: 'Sunucu genel sohbet ve davranış kuralları.',
                value: 'rules_basic',
                emoji: '📜'
            },
            {
                label: 'Güvenlik & Gizlilik',
                description: 'Hesap ve sunucu güvenliği rehberi.',
                value: 'rules_safezone',
                emoji: '🛡️'
            },
            {
                label: 'Destekçi & VIP Ayrıcalıkları',
                description: 'Destekçi paketleri ve ayrıcalıklar hakkında bilgi verir.',
                value: 'guide_donate',
                emoji: '💎'
            }
        ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await ctx.channel.send({ embeds: [embed], components: [row] });
    await ctx.reply({ content: '✅ Rehber paneli başarıyla kuruldu.', ephemeral: true });
  },
};
