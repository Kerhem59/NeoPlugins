const { SlashCommandBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const ServerQuery = require('../../../utils/ServerQuery');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sunucumu-ekle')
    .setDescription('Unturned sunucunuzu bota ekler (Sadece müşteriler)')
    .addStringOption(option =>
      option.setName('ip')
        .setDescription('Sunucunuzun IP adresi')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('port')
        .setDescription('Sunucunuzun Portu (Örn: 27015)')
        .setRequired(true)
    ),

  name: 'sunucumu-ekle',
  description: 'Kullanıcının Unturned sunucusunu sisteme ekler',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });

    const ip = ctx.options.getString('ip').trim();
    const port = ctx.options.getInteger('port');

    // İstediğiniz takdirde buraya müşteri kontrolü ekleyebilirsiniz (Örn: role ID kontrolü veya loyalty db)
    
    // IP doğrulama
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[a-zA-Z0-9.-]+$/;
    if (!ipRegex.test(ip)) {
      return ctx.editReply({ content: '❌ Geçersiz IP veya Domain adresi girdiniz.' });
    }

    try {
      // Önce sunucunun gerçekten açık olup olmadığını kontrol edelim
      let queryPort = port + 1; // Unturned Query port is usually gameport + 1
      let serverData;
      
      try {
        serverData = await ServerQuery.query(ip, queryPort, 3000);
      } catch (e) {
        // Fallback: belki direkt query portunu girmiştir
        try {
          serverData = await ServerQuery.query(ip, port, 3000);
          queryPort = port;
        } catch (e2) {
          return ctx.editReply({ content: '❌ Sunucunuza bağlanılamadı. Lütfen sunucunuzun açık olduğundan ve doğru IP/Port (veya Query Port) girdiğinizden emin olun.' });
        }
      }

      // Veritabanına kaydet (Eski sunucusu varsa üzerine yazar veya günceller)
      dbManager.upsert('customer_servers', 
        { guild_id: ctx.guild.id, user_id: ctx.user.id },
        { 
          ip: ip,
          port: port, // Gösterilecek oyun portu
          query_port: queryPort, // Gerçek A2S sorgu portu
          last_name: serverData.name,
          updated_at: Date.now()
        }
      );

      const container = new ContainerBuilder();
      container.setAccentColor(0x2ECC71);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### ✅ Sunucunuz Başarıyla Eklendi!')
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Bağlantı Başarılı:** \`${serverData.name}\`\n\nSunucunuz sisteme kaydedildi. Artık \`/sunucum\` komutunu kullanarak sunucunuzun anlık durumunu afiş olarak görebilir ve sunucumuzda reklamını yapabilirsiniz! 🎉`)
      );

      await ctx.editReply({ components: [container.toJSON()] });

    } catch (err) {
      console.error('Sunucu ekleme hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
