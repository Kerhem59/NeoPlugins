const path = require('path');
const fs = require('fs');

class AutoBackup {
    constructor(client) {
        this.client = client;
    }

    start() {
        console.log('[AutoBackup] Otomatik yedekleme sistemi başlatıldı (30 dakikada bir).');
        
        // 30 dakika = 30 * 60 * 1000 milisaniye
        setInterval(async () => {
            await this.takeBackup();
        }, 30 * 60 * 1000);
    }

    async takeBackup() {
        try {
            console.log('[AutoBackup] Otomatik yedekleme başlatılıyor...');
            
            const dbSourcePath = path.join(__dirname, '../../database.json');

            if (!fs.existsSync(dbSourcePath)) {
                console.error('[AutoBackup] database.json bulunamadı.');
                return;
            }

            const backupDir = path.join(__dirname, '../../backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const date = new Date();
            const fileName = `autobackup-${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}.json`;
            const filePath = path.join(backupDir, fileName);

            fs.copyFileSync(dbSourcePath, filePath);

            const stats = fs.statSync(filePath);
            const fileSizeMB = stats.size / (1024 * 1024);

            console.log(`[AutoBackup] Başarılı! Yedek: ${fileName} (${fileSizeMB.toFixed(2)} MB)`);

            // Eski yedekleri temizle (en fazla 20 yedek kalsın)
            this.cleanOldBackups(backupDir, 20);

        } catch (error) {
            console.error('[AutoBackup] Hata:', error.message);
        }
    }

    cleanOldBackups(backupDir, maxKeep) {
        try {
            const files = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('autobackup-') && f.endsWith('.json'))
                .map(f => ({
                    name: f,
                    path: path.join(backupDir, f),
                    time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time);

            if (files.length > maxKeep) {
                const filesToDelete = files.slice(maxKeep);
                for (const file of filesToDelete) {
                    fs.unlinkSync(file.path);
                    console.log(`[AutoBackup] Eski yedek silindi: ${file.name}`);
                }
            }
        } catch (err) {
            console.error('[AutoBackup] Eski yedekleri temizlerken hata:', err.message);
        }
    }
}

module.exports = AutoBackup;
