const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = [
  {
    customId: 'store_buy_',
    async execute(interaction) {
      const productId = interaction.customId.replace('store_buy_', '');
      
      let productName = 'Unturned Plugin';
      try {
        const prod = dbManager.getOne('store_products', { id: Number(productId) });
        if (prod) {
          productName = prod.name;
        }
      } catch (err) {
        console.error('store_buy query error:', err);
      }

      const modal = new ModalBuilder()
        .setCustomId(`store_modal_buy_${productId}`)
        .setTitle(`🛒 ${productName.slice(0, 20)} Siparişi`);

      const steamInput = new TextInputBuilder()
        .setCustomId('store_steam')
        .setLabel('Discord / Steam Adınız veya Profil Linkiniz')
        .setPlaceholder('Discord veya Steam64 ID / profil linkinizi girin...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const paymentInput = new TextInputBuilder()
        .setCustomId('store_payment')
        .setLabel('Ödeme Yöntemi Tercihiniz')
        .setPlaceholder('IBAN / Havale / Papara / İnal / Kredi Kartı...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const noteInput = new TextInputBuilder()
        .setCustomId('store_note')
        .setLabel('Sunucu IP / Ek Bilgi / Not')
        .setPlaceholder('Sunucunuzun IP adresi veya sormak istediğiniz ek notlar...')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(steamInput),
        new ActionRowBuilder().addComponents(paymentInput),
        new ActionRowBuilder().addComponents(noteInput)
      );

      await interaction.showModal(modal);
    }
  },
  {
    customId: 'store_info_',
    async execute(interaction) {
      const productId = interaction.customId.replace('store_info_', '');
      
      try {
        const prod = dbManager.getOne('store_products', { id: Number(productId) });
        if (!prod) {
          return interaction.reply({ content: '❌ Ürün bilgisi bulunamadı.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setTitle(`ℹ️ ${prod.name} | Ürün Bilgisi`)
          .setDescription(prod.description || 'Detaylı bilgi için destek talebi açabilirsiniz.')
          .addFields(
            { name: '💰 Fiyat', value: `\`${prod.price}\``, inline: true },
            { name: '⚙️ Altyapı', value: `\`${prod.framework || 'RocketMod'}\``, inline: true },
            { name: '📌 Sürüm', value: `\`${prod.version || 'v1.0.0'}\``, inline: true }
          )
          .setColor('#0088FF')
          .setFooter({ text: `${interaction.guild.name} ⬢ Unturned Plugin Store` });

        if (prod.image_url && prod.image_url.startsWith('http')) {
          embed.setImage(prod.image_url);
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });

      } catch (err) {
        console.error('store_info error:', err);
        await interaction.reply({ content: '❌ Bilgi alınırken hata oluştu.', ephemeral: true });
      }
    }
  }
];
