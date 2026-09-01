const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Routes } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('urun-ekle')
    .setDescription('Yeni bir Unturned plugini ekler ve otomatik olarak özel kanalını açıp vitrini yayınlar')
    .addStringOption(option =>
      option.setName('isim')
        .setDescription('Plugin adı (Örn: Advanced Kits, AntiCheat, DeathMessages)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('fiyat')
        .setDescription('Plugin fiyatı (Örn: 200 TL, $10)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('aciklama')
        .setDescription('Plugin özellikleri ve detaylı açıklaması')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('gorsel_dosya')
        .setDescription('Plugin afişi veya görseli (Cihazınızdan dosya seçin)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('gorsel_url')
        .setDescription('Plugin afişi linki (URL)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('framework')
        .setDescription('Altyapı türü (Varsayılan: RocketMod)')
        .setRequired(false)
        .addChoices(
          { name: 'RocketMod', value: 'RocketMod' },
          { name: 'OpenMod', value: 'OpenMod' },
          { name: 'U3DS / Native', value: 'Native' },
          { name: 'Discord Bot & Entegrasyon', value: 'Discord Bot' }
        )
    )
    .addStringOption(option =>
      option.setName('surum')
        .setDescription('Plugin sürümü (Örn: v1.0.0)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'urun-ekle',
  description: 'Mağazaya yeni plugin ürünü ekler ve otomatik özel kanal açar',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
      return ctx.editReply({ content: '❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.' });
    }

    const guild = ctx.guild;
    const name = ctx.options.getString('isim');
    const price = ctx.options.getString('fiyat');
    const description = ctx.options.getString('aciklama');
    const framework = ctx.options.getString('framework') || 'RocketMod';
    const version = ctx.options.getString('surum') || 'v1.0.0';

    // Görsel URL / Dosya belirleme
    const attachment = ctx.options.getAttachment('gorsel_dosya');
    const gorselUrl = ctx.options.getString('gorsel_url');
    const finalImageUrl = attachment ? attachment.url : (gorselUrl && gorselUrl.startsWith('http') ? gorselUrl : null);

    try {
      // 1. JSON Veritabanına Kaydet
      const insertResult = dbManager.insert('store_products', {
          guild_id: guild.id,
          name: name,
          description: description,
          price: price,
          framework: framework,
          version: version,
          image_url: finalImageUrl,
          created_at: Date.now()
      });

      const productId = insertResult?.id || Date.now();

      // 2. Şık Ürün Vitrin Kartı (ContainerBuilder)
      const container = new ContainerBuilder()
        .setAccentColor(0x2ECC71);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 📦 ${name} \`[${version}]\`\n\n**🛠️ Eklenti Özellikleri & Bilgiler**\n${description}`)
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `💰 **Fiyat:** \`${price}\`\n` +
          `⚙️ **Altyapı:** \`${framework}\`\n` +
          `📌 **Sürüm:** \`${version}\`\n\n` +
          `👇 **Hemen sipariş vermek ve teslimat talebi açmak için butona tıklayın:**`
        )
      );

      if (finalImageUrl) {
        container.addMediaGalleryComponents(
          new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(finalImageUrl)
          )
        );
      }

      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`store_buy_${productId}`)
            .setLabel(`${name} Satın Al`)
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`store_info_${productId}`)
            .setLabel('Detay & Bilgi')
            .setEmoji('💬')
            .setStyle(ButtonStyle.Secondary)
        )
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${guild.name} • Unturned Plugin Store`)
      );

      const results = [];

      // 3. MAĞAZA Kategorisini Bul veya Oluştur
      let storeCategory = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && (c.name.includes('MAĞAZA') || c.name.includes('PLUGIN'))
      );

      if (!storeCategory) {
        storeCategory = await guild.channels.create({
          name: '🛒 ─── PLUGIN MAĞAZASI ───',
          type: ChannelType.GuildCategory
        });
      }

      // 4. OTOMATİK ÖZEL KANAL AÇMA (Örn: #📦│advanced-kits)
      const cleanChannelName = `📦│${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`.slice(0, 30);
      let dedicatedChannel = guild.channels.cache.find(
        c => c.name.toLowerCase() === cleanChannelName.toLowerCase() && c.parentId === storeCategory.id
      );

      if (!dedicatedChannel) {
        dedicatedChannel = await guild.channels.create({
          name: cleanChannelName,
          type: ChannelType.GuildText,
          parent: storeCategory.id,
          topic: `${name} | Fiyat: ${price} | ${framework} ${version}`,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
            }
          ]
        });
      }

      // Ürün kartını özel kanalına gönder (Container)
      await ctx.client.rest.post(Routes.channelMessages(dedicatedChannel.id), {
        body: {
          flags: 32768, // MessageFlags.IsComponentsV2
          components: [container.toJSON()]
        }
      });

      results.push(`📁 **Özel Kanal Açıldı:** ${dedicatedChannel} kanalına ürün kartı ve satın al butonu yerleştirildi.`);

      // 5. Genel Vitrin Kanalı Varsa Oraya da Gönder (#plugin-vitrini)
      const generalVitrin = guild.channels.cache.find(
        c => c.name.includes('plugin-vitrin') || (c.name.includes('vitrin') && c.id !== dedicatedChannel.id)
      );

      if (generalVitrin) {
        await ctx.client.rest.post(Routes.channelMessages(generalVitrin.id), {
          body: {
            flags: 32768,
            components: [container.toJSON()]
          }
        });
        results.push(`📢 **Genel Vitrin:** ${generalVitrin} kanalına da eklendi.`);
      }

      // 6. Yöneticiye Bilgilendirme Kartı
      const successEmbed = new EmbedBuilder()
        .setTitle('🎉 Plugin Başarıyla Eklendi & Kanalı Açıldı!')
        .setDescription(
          `**${name}** plugini sisteme kaydedildi ve kanalı otomatik oluşturuldu!\n\n` +
          results.join('\n')
        )
        .addFields(
          { name: '📦 Ürün', value: `\`${name}\``, inline: true },
          { name: '💰 Fiyat', value: `\`${price}\``, inline: true },
          { name: '⚙️ Altyapı', value: `\`${framework}\` (\`${version}\`)`, inline: true }
        )
        .setColor('#2ECC71')
        .setThumbnail(finalImageUrl || guild.iconURL({ dynamic: true }))
        .setFooter({ text: `${guild.name} ⬢ Plugin Store`, iconURL: ctx.client.user.displayAvatarURL() })
        .setTimestamp();

      await ctx.editReply({
        embeds: [successEmbed]
      });

    } catch (err) {
      console.error('urun-ekle error:', err);
      await ctx.editReply({ content: `❌ Ürün eklenirken hata oluştu: ${err.message}` });
    }
  }
};
