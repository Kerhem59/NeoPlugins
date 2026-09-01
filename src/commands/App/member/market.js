const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const EconomySystem = require('../../../utils/EconomySystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Coinlerinizi harcayabileceğiniz ödül marketini görüntüler'),

  name: 'market',
  description: 'Ödül marketini görüntüler ve alım yapar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    try {
      const allItems = dbManager.get('quiz_market', { guild_id: ctx.guild.id, status: 'Active' }) || [];
      const userCoins = await EconomySystem.getBalance(ctx.guild.id, ctx.user.id);

      if (allItems.length === 0) {
        const emptyContainer = new ContainerBuilder();
        emptyContainer.setAccentColor(0x95A5A6);
        emptyContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent('### 🛒 Ödül Marketi\n\nŞu anda markette alınabilir hiçbir ödül bulunmuyor.\nLütfen daha sonra tekrar kontrol edin.')
        );
        return ctx.editReply({ components: [emptyContainer.toJSON()] });
      }

      const container = new ContainerBuilder();
      container.setAccentColor(0xF1C40F);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### 🛒 Unturned Ödül Marketi')
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`Güncel Bakiyeniz: 💰 **${userCoins.toLocaleString()} Coin**\n\nAşağıdaki menüden almak istediğiniz ödülü seçin:`)
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      const options = [];

      allItems.forEach((item, index) => {
        const itemId = item.id || `market_item_${index}`;
        const isStockAvailable = item.stock === 0 || item.claimed < item.stock;
        
        let label = `${item.product} — 💰 ${item.price} Coin`;
        let desc = item.description ? item.description.substring(0, 50) : '';
        if (!isStockAvailable) {
          label = `[TÜKENDİ] ${item.product}`;
          desc = 'Bu ürün stokta kalmadı.';
        }

        options.push({
          label: label,
          description: desc,
          value: itemId,
          emoji: isStockAvailable ? (userCoins >= item.price ? '🟢' : '🔴') : '⚫'
        });

        const stockText = item.stock > 0 ? `${item.stock - item.claimed} adet kaldı` : 'Sınırsız Stok';
        
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`**🎁 ${item.product}**\n💰 **${item.price} Coin** | 📦 ${stockText}\n📝 ${item.description || 'Açıklama yok'}`)
        );
        container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      });

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} Ödül Marketi`)
      );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('market_buy_select')
        .setPlaceholder('Almak istediğiniz ödülü seçin...')
        .addOptions(options.slice(0, 25));

      const row = new ActionRowBuilder().addComponents(selectMenu);
      container.addActionRowComponents(row);

      const msg = await ctx.editReply({ components: [container.toJSON()] });

      const collector = msg.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async (interaction) => {
        const selectedId = interaction.values[0];
        const item = allItems.find((i, idx) => (i.id || `market_item_${idx}`) === selectedId);

        if (!item) {
          return interaction.reply({ content: '❌ Bu ürün artık markette bulunmuyor.', ephemeral: true });
        }

        if (item.stock > 0 && item.claimed >= item.stock) {
          return interaction.reply({ content: '❌ Üzgünüz, bu ürünün stoğu tükenmiş!', ephemeral: true });
        }

        const currentCoins = await EconomySystem.getBalance(ctx.guild.id, ctx.user.id);
        if (currentCoins < item.price) {
          return interaction.reply({ 
            content: `❌ Bakiyeniz yetersiz!\nBu ürün **${item.price} Coin** ama sizde sadece **${currentCoins} Coin** var.\n\n\`/quiz\` oynayarak veya mesaj yazarak coin kazanabilirsiniz!`, 
            ephemeral: true 
          });
        }

        await EconomySystem.addCoins(ctx.guild.id, ctx.user.id, -item.price);

        dbManager.upsert('quiz_market', 
          { guild_id: ctx.guild.id, product: item.product }, 
          { claimed: (item.claimed || 0) + 1 }
        );

        dbManager.insert('quiz_redeems', {
          guild_id: ctx.guild.id,
          user_id: ctx.user.id,
          product: item.product,
          price: item.price,
          status: 'Pending',
          created_at: Date.now()
        });

        const logChannel = ctx.guild.channels.cache.find(c => c.name.includes('market-onay') || c.name.includes('admin-log'));
        if (logChannel) {
          const adminContainer = new ContainerBuilder();
          adminContainer.setAccentColor(0xE67E22);
          adminContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### 🚨 Yeni Market Talebi!\n\n**${ctx.user.tag}** kullanıcısı marketten bir ürün talep etti!\n\n🎁 **Ürün:** ${item.product}\n💰 **Ödenen:** ${item.price} Coin`)
          );
          adminContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
          adminContainer.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# Teslim ettikten sonra /market-onayla komutunu kullanın`)
          );
          logChannel.send({ components: [adminContainer.toJSON()] }).catch(() => {});
        }

        const successContainer = new ContainerBuilder();
        successContainer.setAccentColor(0x2ECC71);
        successContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### 🎉 Tebrikler!\n\n\`${item.product}\` ürününü başarıyla **${item.price} Coin** karşılığında satın aldınız.\n\nTalebiniz yöneticilere iletildi. En kısa sürede teslimat için sizinle iletişime geçilecek!`)
        );

        await interaction.reply({ components: [successContainer.toJSON()], ephemeral: true });
        collector.stop();
      });

      collector.on('end', () => {
        msg.edit({ components: [] }).catch(() => {});
      });

    } catch (err) {
      console.error('Market görüntüleme hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
