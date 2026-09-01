const { SlashCommandBuilder } = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('@discordjs/builders');
const dbManager = require('../../../../Database/SuperCore/JsonDatabaseManager');
const crypto = require('crypto');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('referans')
    .setDescription('Kişisel referans kodunuzu oluşturun veya görüntüleyin. Arkadaşınızı getirin, ikisi de kazansın!')
    .addSubcommand(sub =>
      sub.setName('kodum')
        .setDescription('Kişisel referans kodunuzu görüntüleyin veya oluşturun')
    )
    .addSubcommand(sub =>
      sub.setName('kullan')
        .setDescription('Bir referans kodu kullanarak bonus puan kazanın')
        .addStringOption(option =>
          option.setName('kod')
            .setDescription('Kullanmak istediğiniz referans kodu')
            .setRequired(true)
        )
    ),

  name: 'referans',
  description: 'Referans sistemi',

  async execute(ctx) {
    await ctx.deferReply({ ephemeral: true });
    const sub = ctx.options.getSubcommand();

    if (sub === 'kodum') {
      return this.handleMyCode(ctx);
    } else if (sub === 'kullan') {
      return this.handleUseCode(ctx);
    }
  },

  async handleMyCode(ctx) {
    try {
      const existing = dbManager.get('referrals', { guild_id: ctx.guild.id, user_id: ctx.user.id });

      let refCode;
      let totalReferrals = 0;
      let totalEarned = 0;

      if (existing && existing.length > 0) {
        refCode = existing[0].code;
        totalReferrals = existing[0].total_referrals || 0;
        totalEarned = existing[0].total_earned || 0;
      } else {
        const namePart = ctx.user.username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5);
        const randPart = crypto.randomBytes(2).toString('hex').toUpperCase();
        refCode = `REF-${namePart}-${randPart}`;

        dbManager.insert('referrals', {
          guild_id: ctx.guild.id,
          user_id: ctx.user.id,
          code: refCode,
          total_referrals: 0,
          total_earned: 0,
          used_by: JSON.stringify([]),
          created_at: Date.now()
        });
      }

      const container = new ContainerBuilder();
      container.setAccentColor(0x9B59B6);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### 👥 Referans Programı')
      );
      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Arkadaşlarınızı davet edin, **ikisi de kazansın!** 🎉\n\n` +
          `Arkadaşınız bu kodu kullandığında:\n` +
          `✅ Siz **+5 sadakat puanı** kazanırsınız\n` +
          `✅ Arkadaşınız da **+5 sadakat puanı** kazanır\n\n` +
          `**Referans Kodunuz:**\n\`\`\`${refCode}\`\`\`\n` +
          `Arkadaşınıza bu kodu verin, o da \`/referans kullan ${refCode}\` yazarak aktivasyon yapabilir.`
        )
      );

      container.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**👥 Toplam Davet:** ${totalReferrals} kişi\n**⭐ Kazanılan Puan:** ${totalEarned} puan`)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ⬢ ${ctx.guild.name} Referans Sistemi`)
      );

      await ctx.editReply({ components: [container.toJSON()] });

    } catch (err) {
      console.error('Referans kodu hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  },

  async handleUseCode(ctx) {
    const code = ctx.options.getString('kod').toUpperCase().replace(/\s/g, '');

    try {
      const results = dbManager.get('referrals', { guild_id: ctx.guild.id, code: code });
      const referral = results && results.length > 0 ? results[0] : null;

      if (!referral) {
        return ctx.editReply({ content: '❌ Geçersiz referans kodu.' });
      }

      if (referral.user_id === ctx.user.id) {
        return ctx.editReply({ content: '❌ Kendi referans kodunuzu kullanamazsınız!' });
      }

      const usedBy = JSON.parse(referral.used_by || '[]');
      if (usedBy.includes(ctx.user.id)) {
        return ctx.editReply({ content: '❌ Bu referans kodunu zaten kullanmışsınız.' });
      }

      const ownerLoyalty = dbManager.get('loyalty', { guild_id: ctx.guild.id, user_id: referral.user_id });
      if (ownerLoyalty && ownerLoyalty.length > 0) {
        dbManager.upsert('loyalty', { guild_id: ctx.guild.id, user_id: referral.user_id }, {
          points: (ownerLoyalty[0].points || 0) + 5
        });
      } else {
        dbManager.insert('loyalty', { guild_id: ctx.guild.id, user_id: referral.user_id, points: 5, total_purchases: 0, created_at: Date.now() });
      }

      const userLoyalty = dbManager.get('loyalty', { guild_id: ctx.guild.id, user_id: ctx.user.id });
      if (userLoyalty && userLoyalty.length > 0) {
        dbManager.upsert('loyalty', { guild_id: ctx.guild.id, user_id: ctx.user.id }, {
          points: (userLoyalty[0].points || 0) + 5
        });
      } else {
        dbManager.insert('loyalty', { guild_id: ctx.guild.id, user_id: ctx.user.id, points: 5, total_purchases: 0, created_at: Date.now() });
      }

      usedBy.push(ctx.user.id);
      dbManager.upsert('referrals', { guild_id: ctx.guild.id, code: code }, {
        total_referrals: (referral.total_referrals || 0) + 1,
        total_earned: (referral.total_earned || 0) + 5,
        used_by: JSON.stringify(usedBy)
      });

      try {
        const owner = await ctx.client.users.fetch(referral.user_id);
        const ownerContainer = new ContainerBuilder();
        ownerContainer.setAccentColor(0x9B59B6);
        ownerContainer.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### 🎉 Referans Kodunuz Kullanıldı!\n\n**${ctx.user.username}** referans kodunuzu kullandı!\n\nHesabınıza **+5 sadakat puanı** eklendi.`)
        );
        await owner.send({ components: [ownerContainer.toJSON()] });
      } catch (e) {}

      const container = new ContainerBuilder();
      container.setAccentColor(0x2ECC71);
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ✅ Referans Kodu Başarıyla Kullanıldı!\n\n**+5 sadakat puanı** hesabınıza eklendi! 🎉\n\nReferans sahibi de **+5 puan** kazandı. Teşekkürler!\n\nPuanınızı görmek için \`/sadakat\` komutunu kullanabilirsiniz.`)
      );

      await ctx.editReply({ components: [container.toJSON()] });

    } catch (err) {
      console.error('Referans kullanma hatası:', err);
      await ctx.editReply({ content: `❌ Bir hata oluştu: ${err.message}` });
    }
  }
};
