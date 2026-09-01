const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lisans-sorgula')
    .setDescription('Sahip olduğunuz eklenti lisanslarını ve durumlarını gösterir'),

  name: 'lisans-sorgula',
  description: 'Sahip olduğunuz lisansları sorgular',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    try {
      const userLicenses = dbManager.get('licenses', { user_id: ctx.user.id });

      if (!userLicenses || userLicenses.length === 0) {
        return ctx.editReply({
          content: '❌ Hesabınıza kayıtlı herhangi bir lisans bulunamadı.'
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔑 Lisanslarınız')
        .setDescription('Satın aldığınız ürünlere ait lisans anahtarları aşağıda listelenmiştir. Lütfen bu anahtarları kimseyle paylaşmayın.')
        .setColor('#F1C40F')
        .setThumbnail(ctx.user.displayAvatarURL())
        .setFooter({ text: `${ctx.guild.name} ⬢ License Security`, iconURL: ctx.client.user.displayAvatarURL() })
        .setTimestamp();

      userLicenses.forEach((lic, index) => {
        const hwidStatus = lic.hwid ? '🔒 Kilitlendi (Aktif)' : '🔓 Bekliyor (İlk girişte kilitlenecek)';
        
        embed.addFields({
          name: `📦 ${index + 1}. ${lic.product_name}`,
          value: `**Lisans:** \`${lic.license_key}\`\n**Durum:** ${lic.status}\n**Süre:** ${lic.duration}\n**HWID:** ${hwidStatus}`,
          inline: false
        });
      });

      await ctx.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('Lisans sorgulama hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
