const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { interactions } = require('./core/interaction/Core');
const { EventCore  } = require('./core/event/EventCore');
const loadConfig = require('./config/loadConfig');
const JsonManager = require('../Database/SuperCore/JsonManager');

const config = loadConfig();
const jsonManager = new JsonManager();
const client = new Client({
    partials: [
        Partials.GuildMember,
        Partials.User,
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
    shards: 'auto',
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration,
    ],
});

async function initializeinteractions() {
    try {
        client.interactions = new interactions(client, config);
        client.interactions.setupListeners();
        await client.interactions.initialize();
    } catch (error) {
        console.error("interactions başlatma hatası:", error);
    }
}

EventCore(client);

client.once('clientReady', async () => {
    await initializeinteractions();


    const systemsManager = require('./utils/SystemsManager');
    client.systemsManager = systemsManager;





    if (systemsManager.isEnabled('consolelogger')) {
        const ConsoleLogger = require('./utils/ConsoleLogger');
        const consoleLogger = new ConsoleLogger(client);
        consoleLogger.start();
        console.log('[SİSTEM] Console Logger aktif.');
    } else {
        console.log('[SİSTEM] Console Logger (systems.json) kapalı.');
    }

    if (systemsManager.isEnabled('autobackup')) {
        const AutoBackup = require('./utils/AutoBackup');
        client.autoBackup = new AutoBackup(client);
        client.autoBackup.start();
        console.log('[SİSTEM] Otomatik Yedeğe Alma aktif.');
    } else {
        console.log('[SİSTEM] Otomatik Yedeğe Alma (systems.json) kapalı.');
    }
});

client.on('error', (error) => {
    console.error('[Discord Client] Ağ / Socket Hatası:', error.message || error);
});

client.on('shardError', (error, shardId) => {
    console.error(`[Discord Shard ${shardId}] WebSocket bağlantı hatası:`, error.message || error);
});

async function startBot() {
    try {
        await client.login(config.MainBotToken);
        console.log("Bot oturum açtı, hazırlanıyor...");
    } catch (err) {
        console.error("Bot oturum açarken hata oluştu:", err.message || err);
        console.log("🔄 Bağlantı koptu veya ağ hatası (ECONNRESET vb.). 5 saniye sonra tekrar deneniyor...");
        setTimeout(startBot, 5000);
    }
}

if (!config.MainBotToken) {
    console.error('[BOT] MainBotToken bulunamadı. .env dosyasına BOT_TOKEN ekleyin veya main.json kontrol edin.');
    process.exit(1);
}

startBot();

process.on('unhandledRejection', (error) => {
    console.error('İşlenmeyen Promise Hatası:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Yakalanmayan Hata:', error);
});
