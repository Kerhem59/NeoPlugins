const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changelog-ekle')
    .setDescription('Bir ürüne yeni güncelleme notu (changelog) ekler')
    .addStringOption(option =>
      option.setName('urun')
        .setDescription('Güncelleme yapılan ürünün adı')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('versiyon')
        .setDescription('Yeni sürüm numarası (Örn: v2.1.0)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('notlar')
        .setDescription('Bu sürümde neler değişti? (Virgülle ayırarak birden fazla yazılabilir)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tip')
        .setDescription('Güncelleme tipi')
        .setRequired(false)
        .addChoices(
          { name: '✨ Yeni Özellik', value: 'feature' },
          { name: '🐛 Hata Düzeltme', value: 'bugfix' },
          { name: '⚡ İyileştirme', value: 'improvement' },
          { name: '🔒 Güvenlik', value: 'security' },
          { name: '💥 Büyük Güncelleme', value: 'major' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'changelog-ekle',
  description: 'Ürün güncelleme notu ekler',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** yetkisine sahip olmalısın.' });
    }

    const product = ctx.options.getString('urun');
    const version = ctx.options.getString('versiyon');
    const notes = ctx.options.getString('notlar');
    const type = ctx.options.getString('tip') || 'improvement';

    const typeLabels = {
      feature: '✨ Yeni Özellik',
      bugfix: '🐛 Hata Düzeltme',
      improvement: '⚡ İyileştirme',
      security: '🔒 Güvenlik',
      major: '💥 Büyük Güncelleme'
    };

    const typeColors = {
      feature: '#3498DB',
      bugfix: '#E74C3C',
      improvement: '#2ECC71',
      security: '#F39C12',
      major: '#9B59B6'
    };

    try {
      dbManager.insert('changelogs', {
        guild_id: ctx.guild.id,
        product: product,
        version: version,
        notes: notes,
        type: type,
        author_id: ctx.user.id,
        created_at: Date.now()
      });

      // Changelog kanalını bul ve oraya da at
      const changelogChannel = ctx.guild.channels.cache.find(c =>
        c.name.includes('changelog') || c.name.includes('degisiklik') || c.name.includes('güncelleme-log')
      );

      const notesList = notes.split(',').map(n => `• ${n.trim()}`).join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`📋 ${product} — ${version}`)
        .setDescription(
          `**${typeLabels[type]}**\n\n` +
          `**Değişiklikler:**\n${notesList}`
        )
        .setColor(typeColors[type])
        .setFooter({ text: `${ctx.guild.name} ⬢ Changelog • ${ctx.user.username} tarafından`, iconURL: ctx.client.user.displayAvatarURL() })
        .setTimestamp();

      if (changelogChannel) {
        await changelogChannel.send({ embeds: [embed] }).catch(() => {});
      }

      await ctx.editReply({
        content: `✅ **${product}** ürünü için \`${version}\` changelog kaydı oluşturuldu!` +
          (changelogChannel ? ` ${changelogChannel} kanalına da gönderildi.` : ''),
        embeds: [embed]
      });

    } catch (err) {
      console.error('Changelog ekleme hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
