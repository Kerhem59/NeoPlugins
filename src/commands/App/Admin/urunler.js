const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('urunler')
    .setDescription('Unturned Plugin Mağazası vitrinini listeler veya kanala gönderir')
    .addBooleanOption(option =>
      option.setName('kanala_gonder')
        .setDescription('Ürün vitrinini herkesin göreceği şekilde bu kanala göndersin mi?')
        .setRequired(false)
    ),

  name: 'urunler',
  description: 'Unturned Plugin Mağazasını görüntüler',

  async execute(ctx) {
    const sendToChannel = ctx.options?.getBoolean('kanala_gonder') || false;
    await ctx.deferReply({ ephemeral: !sendToChannel });

    const guild = ctx.guild;

    try {
      const allProducts = dbManager.get('store_products', { guild_id: guild.id });
      const products = allProducts.sort((a, b) => (b.id || 0) - (a.id || 0));

      if (!products || products.length === 0) {
        return ctx.editReply({
          content: 'ℹ️ Mağazada henüz listelenmiş bir Unturned plugini bulunmuyor. Yeni ürün eklemek için `/urun-ekle` komutunu kullanabilirsiniz.'
        });
      }

      const headerEmbed = new EmbedBuilder()
        .setTitle(`🛒 ${guild.name} | Unturned Plugin Mağazası`)
        .setDescription(
          'Aşağıda sunucumuzda satışta olan güncel Unturned eklentileri yer almaktadır.\n' +
          'İlgilendiğiniz eklentinin altındaki **🛒 Satın Al** butonuna tıklayarak doğrudan destek & sipariş talebi açabilirsiniz!\n\n' +
          '⚡ *Tüm eklentilerimiz güncel RocketMod ve Unturned sürümleriyle tam uyumludur.*'
        )
        .setColor('#0088FF')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: `${guild.name} ⬢ Kaliteli & Güvenilir Unturned Eklentileri`, iconURL: ctx.client.user.displayAvatarURL() })
        .setTimestamp();

      const embedsToSend = [headerEmbed];
      const rowsToSend = [];

      for (const prod of products.slice(0, 10)) { // İlk 10 ürünü listele
        const prodEmbed = new EmbedBuilder()
          .setTitle(`📦 ${prod.name} \`[${prod.version || 'v1.0.0'}]\``)
          .setDescription(prod.description || 'Detaylı bilgi için destek talebi açınız.')
          .addFields(
            { name: '💰 Fiyat', value: `\`${prod.price}\``, inline: true },
            { name: '⚙️ Altyapı', value: `\`${prod.framework || 'RocketMod'}\``, inline: true }
          )
          .setColor('#2ECC71');

        if (prod.image_url && prod.image_url.startsWith('http')) {
          prodEmbed.setImage(prod.image_url);
        }

        const buyRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`store_buy_${prod.id}`)
            .setLabel(`${prod.name} Satın Al`)
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`store_info_${prod.id}`)
            .setLabel('Detay / Soru')
            .setEmoji('💬')
            .setStyle(ButtonStyle.Secondary)
        );

        embedsToSend.push(prodEmbed);
        rowsToSend.push(buyRow);
      }

      if (sendToChannel) {
        await ctx.editReply({ content: '✅ Ürün vitrini başarıyla kanala gönderildi.' });
        
        // Kanala vitrin mesajlarını parça parça gönder
        await ctx.channel.send({ embeds: [headerEmbed] });
        for (let i = 1; i < embedsToSend.length; i++) {
          await ctx.channel.send({
            embeds: [embedsToSend[i]],
            components: [rowsToSend[i - 1]]
          });
        }
      } else {
        // Ephemeral olarak göster
        await ctx.editReply({
          embeds: embedsToSend.slice(0, 5), // Max embed limit
          components: rowsToSend.slice(0, 5)
        });
      }

    } catch (err) {
      console.error('urunler error:', err);
      await ctx.editReply({ content: `❌ Ürünler listelenirken hata oluştu: ${err.message}` });
    }
  }
};
