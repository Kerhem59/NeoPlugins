const JsonManager = require('../../../../Database/SuperCore/JsonManager');
const { EmbedBuilder } = require('discord.js');

module.exports = [
    {
        customId: 'modal_chat_name',
        async execute(interaction) {
            const chatName = interaction.fields.getTextInputValue('input_chat_name').trim();

            const blockedWords = ['sex', 'kürt', 'zenci', 'amk', 'aq', 'oç', 'orospu', 'siktir', 'piç', 'orosbu', 'yarrak', 'yarak', 'amcık', 'nazi'];
            const lowerChatName = chatName.toLowerCase();
            
            if (blockedWords.some(word => lowerChatName.includes(word))) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Geçersiz İsim!')
                    .setDescription('Belirttiğiniz isimde yasaklı/uygunsuz kelimeler bulunuyor. Lütfen başka bir isim seçin.')
                    .setColor('#ff0000');
                
                return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const jsonManager = new JsonManager();
            let chatNames = await jsonManager.get('users/chat_names', interaction.guild.id) || {};
            
            chatNames[interaction.user.id] = chatName;
            await jsonManager.set('users/chat_names', interaction.guild.id, chatNames);

            const embed = new EmbedBuilder()
                .setTitle('✅ İsminiz Kaydedildi!')
                .setDescription(`Oyun içi isminiz başarıyla **${chatName}** olarak belirlendi.\nArtık oyun sohbetine dilediğiniz gibi yazabilirsiniz!`)
                .setColor('#2ecc71');

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
];
