const fs = require('fs');
const path = require('path');

class JsonDatabaseManager {
    constructor() {
        // path.json'dan veritabanı yollarını oku
        const configPath = path.join(__dirname, '..', '..', 'src', 'config', 'database', 'path.json');
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Veritabanı klasörünün mutlak yolunu belirle
        this.dbDir = path.join(__dirname, '..', '..', this.config.basePath);

        // db klasörünü oluştur (yoksa)
        if (!fs.existsSync(this.dbDir)) {
            fs.mkdirSync(this.dbDir, { recursive: true });
        }

        // Her sistem için ayrı veri deposu (bellek içi cache)
        this.tables = {};

        // Tüm tanımlı veritabanlarını yükle
        this.initAll();

        console.log('✅ JSON Veritabanı Hazır. (path.json yapılandırması kullanılıyor)');
        console.log(`📁 Veritabanı dizini: ${this.dbDir}`);
    }

    /**
     * path.json'daki tüm veritabanı dosyalarını başlat/yükle
     */
    initAll() {
        for (const [tableName, dbInfo] of Object.entries(this.config.databases)) {
            const filePath = path.join(this.dbDir, dbInfo.file);

            if (!fs.existsSync(filePath)) {
                // Dosya yoksa boş array ile oluştur
                fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
            }

            // Dosyayı belleğe yükle
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                this.tables[tableName] = JSON.parse(content || '[]');
            } catch (err) {
                console.error(`❌ ${dbInfo.file} yükleme hatası:`, err);
                this.tables[tableName] = [];
            }
        }
    }

    /**
     * Belirli bir tablo için dosya yolunu döndür
     */
    getFilePath(table) {
        const dbInfo = this.config.databases[table];
        if (dbInfo) {
            return path.join(this.dbDir, dbInfo.file);
        }
        // Tanımlanmamış tablo → otomatik dosya oluştur
        return path.join(this.dbDir, `${table}.json`);
    }

    /**
     * Belirli bir tablonun verisini diske kaydet
     */
    save(table) {
        try {
            const filePath = this.getFilePath(table);
            const data = this.tables[table] || [];
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error(`❌ ${table} kaydetme hatası:`, err);
        }
    }

    /**
     * Tablo verisini al (yoksa oluştur)
     */
    getTable(table) {
        if (!this.tables[table]) {
            this.tables[table] = [];

            // Dosya varsa yükle
            const filePath = this.getFilePath(table);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    this.tables[table] = JSON.parse(content || '[]');
                } catch (err) {
                    console.error(`❌ ${table} yükleme hatası:`, err);
                    this.tables[table] = [];
                }
            }
        }
        return this.tables[table];
    }

    _match(item, filter) {
        if (!filter) return true;
        for (const key in filter) {
            if (item[key] !== filter[key]) return false;
        }
        return true;
    }

    get(table, filter = null) {
        const t = this.getTable(table);
        if (!filter) return [...t];
        return t.filter(item => this._match(item, filter));
    }

    getOne(table, filter) {
        const t = this.getTable(table);
        return t.find(item => this._match(item, filter)) || null;
    }

    insert(table, data) {
        const t = this.getTable(table);

        // Auto-increment logic for 'id'
        if (data && typeof data === 'object' && !data.id && table !== 'afk_data' && table !== 'users_levels') {
            const maxId = t.reduce((max, item) => (item.id && typeof item.id === 'number' && item.id > max ? item.id : max), 0);
            if (maxId > 0 || (table === 'suggestions' || table === 'server_stats_history' || table === 'user_activity_history' || table === 'store_products' || table === 'customer_orders')) {
                 data.id = maxId + 1;
            }
        }

        t.push(data);
        this.save(table);
        return data;
    }

    update(table, filter, updateData) {
        const t = this.getTable(table);
        let updated = false;
        for (let i = 0; i < t.length; i++) {
            if (this._match(t[i], filter)) {
                t[i] = { ...t[i], ...updateData };
                updated = true;
            }
        }
        if (updated) this.save(table);
        return updated;
    }

    upsert(table, filter, data) {
        const existing = this.getOne(table, filter);
        if (existing) {
            this.update(table, filter, data);
        } else {
            this.insert(table, { ...filter, ...data });
        }
    }

    delete(table, filter) {
        const t = this.getTable(table);
        const initialLength = t.length;
        this.tables[table] = t.filter(item => !this._match(item, filter));
        if (this.tables[table].length !== initialLength) {
            this.save(table);
            return true;
        }
        return false;
    }

    /**
     * Tüm veritabanı bilgilerini döndür (debug/admin amaçlı)
     */
    getStats() {
        const stats = {};
        for (const [tableName, dbInfo] of Object.entries(this.config.databases)) {
            const data = this.tables[tableName] || [];
            stats[tableName] = {
                file: dbInfo.file,
                description: dbInfo.description,
                recordCount: data.length,
                filePath: this.getFilePath(tableName)
            };
        }
        return stats;
    }
}

module.exports = new JsonDatabaseManager();
