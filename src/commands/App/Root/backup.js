const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');
const fs = require('fs');
const mainConfig = require('../../../config/genaral/main.json');
const Emote = mainConfig.emotes_custom || {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('JSON veritabanı yedeğini alır')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  name: 'backup',
  subname: ["yedek", "database"],
  description: 'JSON veritabanı yedeğini alır',
  usage: 'backup',

  async execute(ctx) {
    if (!mainConfig.OwnerID.includes(ctx.user.id)) {
        return ctx.reply({ content: '❌ Bu komutu kullanma yetkiniz yok.', ephemeral: true });
    }

    const reply = await ctx.reply(`${Emote.LoadingEmote || '🔄'} Veritabanı yedeği alınıyor, lütfen bekleyin...`);

    const dbSourcePath = path.join(__dirname, '../../../../database.json');

    if (!fs.existsSync(dbSourcePath)) {
        return reply.edit('❌ `database.json` dosyası bulunamadı.');
    }

    const backupDir = path.join(__dirname, '../../../../backups');
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const date = new Date();
    const fileName = `backup-${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}.json`;
    const filePath = path.join(backupDir, fileName);

    try {
        fs.copyFileSync(dbSourcePath, filePath);
        
        const stats = fs.statSync(filePath);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB < 25) {
            await reply.edit({
                content: `✅ Veritabanı yedeği başarıyla alındı! (${fileSizeMB.toFixed(2)} MB)\nDosya: \`${fileName}\``,
                files: [filePath]
            });
        } else {
            await reply.edit(`✅ Veritabanı yedeği başarıyla alındı! Discord boyutu aşıldığı için buraya yüklenmedi.\n📁 Klasör: \`backups/${fileName}\` (${fileSizeMB.toFixed(2)} MB)`);
        }

    } catch (error) {
        console.error('Yedekleme Hatası:', error);
        await reply.edit(`❌ Yedekleme alınırken bir hata oluştu.\nHata: \`${error.message.substring(0, 100)}...\``);
    }
  }
};
