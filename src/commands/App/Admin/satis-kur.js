const { SlashCommandBuilder, PermissionsBitField, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Routes } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('satis-kur')
        .setDescription('Satış paneli sistemini ve kanallarını kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    name: 'satis-kur',
    description: 'Satış paneli sistemini ve kanallarını kurar.',

    async execute(ctx) {
        await ctx.deferReply({ ephemeral: true });

        if (!ctx.hasPermission(PermissionsBitField.Flags.Administrator)) {
            return ctx.editReply('❌ Bu komutu kullanmak için **Yönetici** iznine sahip olmalısın.');
        }

        try {
            // Kategori oluştur
            const category = await ctx.guild.channels.create({
                name: '💸 SATIŞ SİSTEMİ',
                type: ChannelType.GuildCategory
            });

            // Herkesin görebileceği duyuru kanalı
            const duyuruChannel = await ctx.guild.channels.create({
                name: 'satis-duyuru',
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: ctx.guild.id, // @everyone
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                        deny: [PermissionsBitField.Flags.SendMessages] // Herkes görebilir ama yazamaz
                    },
                    {
                        id: ctx.client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }
                ]
            });

            // Sadece adminlerin görebileceği yönetim kanalı
            const yonetimChannel = await ctx.guild.channels.create({
                name: 'satis-yonetim',
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: ctx.guild.id, // @everyone
                        deny: [PermissionsBitField.Flags.ViewChannel] // Kimse göremez
                    },
                    {
                        id: ctx.user.id, // Komutu kullanan kişi görebilir
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: ctx.client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }
                ]
            });

            // Müşteri yorumları kanalı
            const yorumChannel = await ctx.guild.channels.create({
                name: 'musteri-yorumlari',
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: ctx.guild.id, // @everyone
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                        deny: [PermissionsBitField.Flags.SendMessages] // Herkes görebilir ama yazamaz
                    },
                    {
                        id: ctx.client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }
                ]
            });

            // Veritabanına kaydet
            const jsonManager = new JsonManager();
            const settings = await jsonManager.get('server/settings', ctx.guild.id) || {};
            settings.satisLogKanali = duyuruChannel.id;
            settings.yorumKanali = yorumChannel.id;
            await jsonManager.set('server/settings', ctx.guild.id, settings);

            // Container ile panel oluştur
            const container = new ContainerBuilder()
                .setAccentColor(0x2ecc71);

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🛒 ${ctx.guild.name} | Satış Bildirim & Yönetim Paneli\n` +
                    'Müşterilerimize yaptığımız satışları sisteme kaydetmek ve herkese açık log kanalına duyurmak için bu paneli kullanabilirsiniz.\n' +
                    'Aşağıdaki "Satış Ekle" butonuna tıkladığınızda açılan formu doldururken şu detaylara dikkat ediniz:\n\n' +
                    '📦 **Ürün / Sunucu Adı** — *Satılan eklentinin veya paketin tam adını girin.*\n' +
                    '💰 **Satış Fiyatı** — *Para birimini belirterek (Örn: 150 TL, 10$) yazın.*\n' +
                    '👤 **Müşteri** — *Kişinin Discord ID sini girerseniz sistem otomatik olarak onu etiketler.*\n' +
                    '📝 **Ek Notlar** — *İndirim, hediye veya takas gibi özel bir durum varsa buraya belirtebilirsiniz.*\n\n' +
                    '⚡ *Satış işleminiz anında duyuru kanalına yansıtılacaktır. Hatalı girmemeye özen gösterin.*'
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('satis_ekle')
                            .setLabel('Satış Ekle')
                            .setEmoji('💸')
                            .setStyle(ButtonStyle.Success)
                    )
            );
            
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} • Satış Sistemi`)
            );

            // Container'ı yönetim kanalına rest API ile gönder (flags: 32768 gerekli)
            await ctx.client.rest.post(Routes.channelMessages(yonetimChannel.id), {
                body: {
                    flags: 32768,
                    components: [container.toJSON()]
                }
            });
            
            await ctx.editReply({ content: `✅ Satış paneli başarıyla kuruldu.\n👉 Yönetim Kanalı: <#${yonetimChannel.id}>\n👉 Duyuru Kanalı: <#${duyuruChannel.id}>` });

        } catch (error) {
            console.error('Kanal oluşturma hatası:', error);
            await ctx.editReply('❌ Kanallar oluşturulurken bir hata meydana geldi. Botun **Kanalları Yönet** yetkisine sahip olduğundan emin olun.');
        }
    },
};
