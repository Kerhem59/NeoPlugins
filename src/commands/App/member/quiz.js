const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const EconomySystem = require('../../../utils/EconomySystem');
const LevelSystem = require('../../../utils/LevelSystem');

const QUESTIONS = [
  { question: 'RocketMod\'un varsayılan komut öneki (prefix) nedir?', options: ['!', '/', '.', '#'], correct: 1, difficulty: 'Kolay', reward: 25 },
  { question: 'Unturned\'de en yüksek kaliteli (tier) eşya rengi hangisidir?', options: ['Mavi', 'Mor', 'Turuncu', 'Sarı (Mythical)'], correct: 3, difficulty: 'Kolay', reward: 25 },
  { question: 'RocketMod yetki dosyasının tam adı nedir?', options: ['Permissions.xml', 'Rocket.Permissions.config.xml', 'RocketPerms.cfg', 'permissions.json'], correct: 1, difficulty: 'Orta', reward: 50 },
  { question: 'Unturned hangi oyun motorunu kullanır?', options: ['Unreal Engine', 'Unity', 'Godot', 'CryEngine'], correct: 1, difficulty: 'Kolay', reward: 25 },
  { question: 'Unturned\'de "/admin" komutu ne işe yarar?', options: ['Sunucuyu kapatır', 'Admin paneli açar', 'Cheat modunu aktif eder', 'Kendinize admin yetkisi verir'], correct: 3, difficulty: 'Orta', reward: 50 },
  { question: 'RocketMod pluginleri hangi dosya uzantısına sahiptir?', options: ['.jar', '.dll', '.lua', '.py'], correct: 1, difficulty: 'Kolay', reward: 25 },
  { question: 'Unturned\'in geliştiricisi kimdir?', options: ['Valve', 'Nelson Sexton (Smartly Dressed Games)', 'Mojang', 'Re-Logic'], correct: 1, difficulty: 'Kolay', reward: 25 },
  { question: 'OpenMod\'da plugin yüklemek için kullanılan komut nedir?', options: ['/rocket install', '/openmod install', '/plugin add', '/om get'], correct: 1, difficulty: 'Zor', reward: 100 },
  { question: 'Unturned sunucusunun varsayılan portu kaçtır?', options: ['25565', '27015', '7777', '3000'], correct: 1, difficulty: 'Orta', reward: 50 },
  { question: 'RocketMod config dosyaları hangi klasörde bulunur?', options: ['Servers/Config/', 'Rocket/Plugins/', 'Mods/Config/', 'Settings/'], correct: 1, difficulty: 'Orta', reward: 50 },
  { question: 'Unturned\'de "Mauve" (Mor) kalitedeki eşyalar ne anlama gelir?', options: ['Yaygın', 'Nadir', 'Efsanevi', 'Epik'], correct: 3, difficulty: 'Zor', reward: 100 },
  { question: 'Unturned haritalarında "Deadzone" bölgesinde hayatta kalmak için ne gerekir?', options: ['Zırh', 'Gaz maskesi / Filtre', 'Araç', 'Silah'], correct: 1, difficulty: 'Orta', reward: 50 },
  { question: 'Unturned\'de en büyük resmi harita hangisidir?', options: ['PEI', 'Washington', 'Russia', 'Germany'], correct: 2, difficulty: 'Orta', reward: 50 },
  { question: 'RocketMod\'da tüm pluginleri yeniden yüklemek için hangi komut kullanılır?', options: ['/reload', '/p reload', '/rocket reload', '/restart plugins'], correct: 2, difficulty: 'Zor', reward: 100 },
  { question: 'Unturned\'de bir aracı tamir etmek için hangi alet kullanılır?', options: ['Çekiç', 'Kaynak Makinesi (Blowtorch)', 'Tornavida', 'İngiliz Anahtarı'], correct: 1, difficulty: 'Kolay', reward: 25 },
  { question: 'MySQL\'de varsayılan port numarası kaçtır?', options: ['8080', '3306', '5432', '27017'], correct: 1, difficulty: 'Zor', reward: 100 },
  { question: 'Unturned hangi programlama dilinde yazılmıştır?', options: ['Java', 'C++', 'C#', 'Python'], correct: 2, difficulty: 'Orta', reward: 50 },
  { question: 'Unturned\'de kaç tane beceri (skill) ağacı vardır?', options: ['2', '3', '4', '5'], correct: 1, difficulty: 'Zor', reward: 100 }
];

const activeQuizzes = new Set();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Unturned bilgi yarışması başlat! Doğru cevapla coin ve XP kazan 🎮'),

  name: 'quiz',
  description: 'Unturned quiz başlatır',

  async execute(ctx) {
    if (activeQuizzes.has(ctx.channel.id)) {
      return ctx.reply({ content: '⚠️ Bu kanalda zaten aktif bir quiz var! Bitmesini bekleyin.', ephemeral: true });
    }

    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

    const difficultyColors = { 'Kolay': 0x2ECC71, 'Orta': 0xF39C12, 'Zor': 0xE74C3C };
    const difficultyEmojis = { 'Kolay': '🟢', 'Orta': '🟡', 'Zor': '🔴' };

    const container = new ContainerBuilder();
    container.setAccentColor(difficultyColors[q.difficulty]);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('### 🎮 Unturned Quiz Zamanı!')
    );
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${difficultyEmojis[q.difficulty]} **Zorluk:** ${q.difficulty}\n` +
        `💰 **Ödül:** ${q.reward} Coin + ${Math.floor(q.reward / 2)} XP\n\n` +
        `**❓ Soru:** ${q.question}\n\n` +
        `⏰ Cevaplamak için **20 saniyeniz** var!`
      )
    );

    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} Quiz Sistemi • İlk doğru cevaplayan kazanır!`)
    );

    const optionEmojis = ['🅰️', '🅱️', '🅲', '🅳'];
    const buttons = q.options.map((opt, i) =>
      new ButtonBuilder()
        .setCustomId(`quiz_answer_${i}`)
        .setLabel(opt)
        .setEmoji(optionEmojis[i])
        .setStyle(ButtonStyle.Secondary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);
    container.addActionRowComponents(row);

    activeQuizzes.add(ctx.channel.id);

    const quizMsg = await ctx.reply({ components: [container.toJSON()] });
    const answeredUsers = new Set();

    const collector = quizMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 20000,
      filter: (i) => i.customId.startsWith('quiz_answer_')
    });

    let winner = null;

    collector.on('collect', async (interaction) => {
      if (answeredUsers.has(interaction.user.id)) {
        return interaction.reply({ content: '⚠️ Zaten cevap verdiniz!', ephemeral: true });
      }

      answeredUsers.add(interaction.user.id);
      const selectedIndex = parseInt(interaction.customId.split('_')[2]);

      if (selectedIndex === q.correct) {
        winner = interaction.user;
        collector.stop('correct');

        await EconomySystem.addCoins(ctx.guild.id, winner.id, q.reward);
        try {
          await LevelSystem.addXp(ctx.guild.id, winner.id, Math.floor(q.reward / 2));
        } catch (e) {}

        await interaction.reply({
          content: `🎉 **${winner.username}** doğru cevapladı ve **${q.reward} Coin** + **${Math.floor(q.reward / 2)} XP** kazandı!`
        });
      } else {
        await interaction.reply({
          content: `❌ Yanlış cevap! Doğru cevabı bulmaya çalışmaya devam edin.`,
          ephemeral: true
        });
      }
    });

    collector.on('end', async (collected, reason) => {
      activeQuizzes.delete(ctx.channel.id);

      const disabledButtons = q.options.map((opt, i) =>
        new ButtonBuilder()
          .setCustomId(`quiz_ended_${i}`)
          .setLabel(opt)
          .setEmoji(i === q.correct ? '✅' : '❌')
          .setStyle(i === q.correct ? ButtonStyle.Success : ButtonStyle.Danger)
          .setDisabled(true)
      );

      const disabledRow = new ActionRowBuilder().addComponents(disabledButtons);

      const resultContainer = new ContainerBuilder();
      resultContainer.setAccentColor(winner ? 0x2ECC71 : 0x95A5A6);

      resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(winner ? '### 🏆 Quiz Tamamlandı!' : '### ⏰ Süre Doldu!')
      );
      resultContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          winner
            ? `**${winner.username}** soruyu doğru yanıtladı!\n\n**Soru:** ${q.question}\n**Doğru Cevap:** ${q.options[q.correct]}\n**Kazanç:** 💰 ${q.reward} Coin + ⭐ ${Math.floor(q.reward / 2)} XP`
            : `Kimse doğru cevaplayamadı!\n\n**Soru:** ${q.question}\n**Doğru Cevap:** ${q.options[q.correct]}`
        )
      );

      resultContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      resultContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ Coinlerinizi /market komutunda harcayabilirsiniz!`)
      );

      resultContainer.addActionRowComponents(disabledRow);

      await quizMsg.edit({ components: [resultContainer.toJSON()] }).catch(() => {});
    });
  }
};
