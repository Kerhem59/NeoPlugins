const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, Routes } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, StringSelectMenuBuilder } = require('@discordjs/builders');
const JsonManager = require('../../../../Database/SuperCore/JsonManager');

module.exports = [
    {
        customId: 'ticket_btn_', // Prefix handler
        async execute(interaction) {
            const type = interaction.customId.replace('ticket_btn_', '');
            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

            const modal = new ModalBuilder()
                .setCustomId(`ticket_modal_${type}`)
                .setTitle(`${type} — Destek Talebi`);

            const usernameInput = new TextInputBuilder()
                .setCustomId('ticket_username')
                .setLabel('Kullanıcı Adınız (Discord / Twitch / Steam)')
                .setPlaceholder('Discord veya platform kullanıcı adınızı girin...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const talepInput = new TextInputBuilder()
                .setCustomId('ticket_talep')
                .setLabel('Talep Konusu / Başlık')
                .setPlaceholder('Talebinizin kısa özeti...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const reasonInput = new TextInputBuilder()
                .setCustomId('ticket_reason')
                .setLabel('Destek Talebi Açıklaması')
                .setPlaceholder('Lütfen sorununuzu veya talebinizi detaylıca açıklayın...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(10);

            modal.addComponents(
                new ActionRowBuilder().addComponents(usernameInput),
                new ActionRowBuilder().addComponents(talepInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );

            await interaction.showModal(modal);
        }
    },
    {
        customId: 'ticket_claim',
        async execute(interaction) {
            const jsonManager = new JsonManager();
            const guildId = interaction.guild.id;
            const settings = await jsonManager.get('server/settings', guildId) || {};
            
            // Yetkili kontrolü (Yönetici VEYA Ayarlanan Rol)
            const isStaff = interaction.member.permissions.has(PermissionFlagsBits.Administrator) || 
                           (settings.ticketStaff && interaction.member.roles.cache.has(settings.ticketStaff));

            if (!isStaff) {
                return interaction.reply({ content: '❌ Bu işlemi sadece **Ticket Yetkilileri** yapabilir.', ephemeral: true });
            }

            const userId = interaction.user.id;
            
            const EconomySystem = require('../../../utils/EconomySystem');
            const rewardedAmount = await EconomySystem.rewardTicket(guildId, userId);

            await interaction.reply({ content: `✅ Bu talebi <@${interaction.user.id}> üstlendi! (+${rewardedAmount} Coin)`, allowedMentions: { users: [interaction.user.id] } });
            
            const row = ActionRowBuilder.from(interaction.message.components[0]);
            row.components[0].setDisabled(true).setLabel('Üstlenildi');
            
            await interaction.message.edit({ components: [row] });

            if (settings.ticketLog) {
                try {
                    const logChannel = interaction.guild.channels.cache.get(settings.ticketLog);
                    if (logChannel) {
                        const staffThreadName = `📊 Yetkili: ${interaction.user.username}`;
                        const activeThreads = await logChannel.threads.fetchActive();
                        let staffThread = activeThreads.threads.find(t => t.name === staffThreadName);
                        
                        if (!staffThread) {
                            const archivedThreads = await logChannel.threads.fetchArchived();
                            staffThread = archivedThreads.threads.find(t => t.name === staffThreadName);
                            if (staffThread) await staffThread.setArchived(false);
                        }

                        if (!staffThread) {
                            staffThread = await logChannel.threads.create({
                                name: staffThreadName,
                                autoArchiveDuration: 10080,
                                type: ChannelType.GuildPublicThread,
                            });
                        }

                        // Log Container
                        const logContainer = new ContainerBuilder().setAccentColor(0x0088FF);
                        logContainer.addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `## 🙋 Talep Üstlenildi\n` +
                                `**${interaction.channel.name}** adlı talep üstlendiğiniz işler arasına eklendi.\n\n` +
                                `**Kanal:** ${interaction.channel}\n` +
                                `**Zaman:** <t:${Math.floor(Date.now() / 1000)}:R>`
                            )
                        );

                        await staffThread.send({
                            components: [logContainer.toJSON()],
                            flags: 32768
                        }).catch(async () => {
                            // Fallback: rest API
                            await interaction.client.rest.post(Routes.channelMessages(staffThread.id), {
                                body: { flags: 32768, components: [logContainer.toJSON()] }
                            }).catch(() => {});
                        });
                    }
                } catch (err) {
                    console.error('Staff log hatası:', err);
                }
            }
        }
    },
    {
        customId: 'ticket_close',
        async execute(interaction) {
            await interaction.deferUpdate();

            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            const isClaimed = messages.some(m => m.content.includes('üstlendi!') && m.mentions.users.size > 0);

            if (isClaimed) {
                // Rating Container
                const ratingContainer = new ContainerBuilder().setAccentColor(0xFFFF00);
                ratingContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Talep Kapatılıyor\n' +
                        'Hizmetimizden memnun kaldınız mı? Lütfen aşağıdan bizi puanlayın!\n\n' +
                        '*(Sadece talep sahibi puan verebilir)*'
                    )
                );
                ratingContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
                ratingContainer.addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('rating_select')
                                .setPlaceholder('Hizmet Kalitesini Seçin...')
                                .addOptions([
                                    { label: '5 Yıldız - Çok Memnunum', value: '5', emoji: { name: '⭐' } },
                                    { label: '4 Yıldız - Memnunum', value: '4', emoji: { name: '⭐' } },
                                    { label: '3 Yıldız - Orta', value: '3', emoji: { name: '⭐' } },
                                    { label: '2 Yıldız - Kötü', value: '2', emoji: { name: '⭐' } },
                                    { label: '1 Yıldız - Çok Kötü', value: '1', emoji: { name: '⭐' } },
                                ]),
                        )
                );

                await interaction.client.rest.post(Routes.channelMessages(interaction.channel.id), {
                    body: { flags: 32768, components: [ratingContainer.toJSON()] }
                });
            } else {
                // Kapatıldı Container
                const closeContainer = new ContainerBuilder().setAccentColor(0xFF0000);
                closeContainer.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Talep Kapatıldı\n' +
                        'Bu talep herhangi bir yetkili tarafından üstlenilmeden kapatıldı.\n' +
                        'Kanalı aşağıdan silebilirsiniz.'
                    )
                );
                closeContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
                closeContainer.addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId('ticket_delete').setLabel('Kanalı Sil').setStyle(ButtonStyle.Danger)
                        )
                );

                await interaction.client.rest.post(Routes.channelMessages(interaction.channel.id), {
                    body: { flags: 32768, components: [closeContainer.toJSON()] }
                });

                const topic = interaction.channel.name;
                if (topic.startsWith('talep-')) {
                    const userName = topic.replace('talep-', '').toLowerCase();
                    const member = interaction.guild.members.cache.find(m => m.user.username.toLowerCase() === userName);
                    if (member) {
                        await interaction.channel.members.remove(member.id).catch(() => {});
                    }
                }
            }
        }
    },
    {
        customId: 'ticket_delete',
        async execute(interaction) {
            const jsonManager = new JsonManager();
            const settings = await jsonManager.get('server/settings', interaction.guild.id) || {};
            
            await interaction.reply({ content: '⏳ Konuşma geçmişi hazırlanıyor ve arşivleniyor...', ephemeral: true });

            if (settings.ticketLog) {
                try {
                    const logChannel = interaction.guild.channels.cache.get(settings.ticketLog);
                    if (logChannel) {
                        const messages = await interaction.channel.messages.fetch({ limit: 100 });
                        const claimMsg = messages.find(m => m.content.includes('üstlendi!') && m.mentions.users.size > 0);
                        
                        if (claimMsg) {
                            const staffUser = claimMsg.mentions.users.first();
                            const staffThreadName = `📊 Yetkili: ${staffUser.username}`;
                            const activeThreads = await logChannel.threads.fetchActive();
                            let staffThread = activeThreads.threads.find(t => t.name === staffThreadName);
                            
                            if (!staffThread) {
                                const archivedThreads = await logChannel.threads.fetchArchived();
                                staffThread = archivedThreads.threads.find(t => t.name === staffThreadName);
                                if (staffThread) await staffThread.setArchived(false);
                            }

                            const targetLogChannel = staffThread || logChannel;
                            const transcript = messages.reverse().map(m => {
                                const date = new Date(m.createdTimestamp).toLocaleString('tr-TR');
                                return `[${date}] ${m.author.tag}: ${m.content}${m.attachments.size > 0 ? ' [Ek Dosya Mevcut]' : ''}`;
                            }).join('\n');

                            const { AttachmentBuilder } = require('discord.js');
                            const buffer = Buffer.from(transcript, 'utf-8');
                            const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.txt` });

                            // Arşiv log Container
                            const archiveContainer = new ContainerBuilder().setAccentColor(0x2B2D31);
                            archiveContainer.addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(
                                    `## 📂 Talep Arşivlendi\n` +
                                    `**${interaction.channel.name}** adlı talep başarıyla sonuçlandırıldı ve arşive kaldırıldı.\n\n` +
                                    `**Kapatan Yetkili:** ${interaction.user.tag}\n` +
                                    `**Mesaj Sayısı:** ${messages.size}`
                                )
                            );

                            await targetLogChannel.send({ files: [attachment] });
                            await interaction.client.rest.post(Routes.channelMessages(targetLogChannel.id), {
                                body: { flags: 32768, components: [archiveContainer.toJSON()] }
                            }).catch(() => {});
                        }
                    }
                } catch (error) {
                    console.error('Arşivleme hatası:', error);
                }
            }
            
            setTimeout(async () => {
                await interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }
];
