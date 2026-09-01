const fs = require('fs');
const path = require('path');

function loadDotEnv() {
    const envPath = path.join(__dirname, '../../.env');
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
    }
}

let cached;

function loadConfig() {
    if (cached) return cached;
    loadDotEnv();
    cached = require('./genaral/main.json');

    if (process.env.BOT_TOKEN) cached.MainBotToken = process.env.BOT_TOKEN;
    if (process.env.API_KEY) cached.ApiKey = process.env.API_KEY;
    if (process.env.API_PORT) cached.ApiPort = Number(process.env.API_PORT);
    if (process.env.PLUGIN_LISTENER_PORT) cached.PluginListenerPort = Number(process.env.PLUGIN_LISTENER_PORT);
    if (process.env.MYSQL_HOST) cached.MySQL.host = process.env.MYSQL_HOST;
    if (process.env.MYSQL_USER) cached.MySQL.user = process.env.MYSQL_USER;
    if (process.env.MYSQL_PASSWORD) cached.MySQL.password = process.env.MYSQL_PASSWORD;
    if (process.env.MYSQL_DATABASE) cached.MySQL.database = process.env.MYSQL_DATABASE;

    return cached;
}

module.exports = loadConfig;
