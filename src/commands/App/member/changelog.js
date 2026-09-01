const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changelog')
    .setDescription('Bir ürünün güncelleme geçmişini (changelog) görüntüler')
    .addStringOption(option =>
      option.setName('urun')
        .setDescription('Changelog görüntülenecek ürünün adı')
        .setRequired(true)
    ),

  name: 'changelog',
  description: 'Ürün güncelleme geçmişini görüntüler',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    const product = ctx.options.getString('urun');

    try {
      const allLogs = dbManager.get('changelogs', { guild_id: ctx.guild.id });

      // Ürün adına göre filtrele (büyük/küçük harf duyarsız)
      const logs = (allLogs || [])
        .filter(l => l.product && l.product.toLowerCase() === product.toLowerCase())
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

      if (logs.length === 0) {
        return ctx.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('📋 Changelog Bulunamadı')
              .setDescription(`**${product}** ürünü için henüz bir güncelleme kaydı bulunmuyor.`)
              .setColor('#E74C3C')
          ]
        });
      }

      const typeEmojis = {
        feature: '✨',
        bugfix: '🐛',
        improvement: '⚡',
        security: '🔒',
        major: '💥'
      };

      const typeLabels = {
        feature: 'Yeni Özellik',
        bugfix: 'Hata Düzeltme',
        improvement: 'İyileştirme',
        security: 'Güvenlik',
        major: 'Büyük Güncelleme'
      };

      // Son 10 changelog'u göster
      const displayLogs = logs.slice(0, 10);
      let description = '';

      displayLogs.forEach((log, index) => {
        const emoji = typeEmojis[log.type] || '📝';
        const label = typeLabels[log.type] || 'Güncelleme';
        const date = log.created_at
          ? `<t:${Math.floor(log.created_at / 1000)}:d>`
          : 'Tarih yok';
        const notesList = log.notes.split(',').map(n => `  • ${n.trim()}`).join('\n');

        description += `### ${emoji} ${log.version} — ${label}\n`;
        description += `${notesList}\n`;
        description += `-# 📅 ${date}\n\n`;
      });

      if (logs.length > 10) {
        description += `\n*... ve ${logs.length - 10} eski güncelleme daha.*`;
      }

      const embed = new EmbedBuilder()
        .setTitle(`📋 ${logs[0].product} — Güncelleme Geçmişi`)
        .setDescription(description)
        .setColor('#3498DB')
        .setFooter({
          text: `${ctx.guild.name} ⬢ Toplam ${logs.length} güncelleme`,
          iconURL: ctx.client.user.displayAvatarURL()
        })
        .setTimestamp();

      await ctx.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('Changelog görüntüleme hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
