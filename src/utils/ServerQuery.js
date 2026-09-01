const dgram = require('dgram');

class ServerQuery {
    /**
     * Steam A2S_INFO protokolü kullanarak Unturned (veya Source) sunucusunu sorgular
     * @param {string} ip - Sunucu IP adresi
     * @param {number} port - Sunucu Portu (Genellikle Unturned query portu gameport + 1'dir, yani 27016)
     * @param {number} timeoutMs - Zaman aşımı (ms)
     * @returns {Promise<Object>}
     */
    static async query(ip, port, timeoutMs = 2000) {
        return new Promise((resolve, reject) => {
            const client = dgram.createSocket('udp4');
            const startTime = Date.now();

            const timeout = setTimeout(() => {
                client.close();
                reject(new Error('TIMEOUT'));
            }, timeoutMs);

            client.on('message', (msg, rinfo) => {
                clearTimeout(timeout);
                client.close();

                const ping = Date.now() - startTime;

                try {
                    // A2S_INFO yanıt başlığı her zaman FF FF FF FF 49 ('I') şeklindedir
                    if (msg.readUInt32LE(0) !== 0xFFFFFFFF || msg[4] !== 0x49) {
                        return reject(new Error('INVALID_RESPONSE'));
                    }

                    let offset = 5; // Protokol (byte) atlıyoruz, genelde 5. byte protokol sürümü
                    offset++;

                    // String okuma fonksiyonu
                    const readString = () => {
                        let end = msg.indexOf(0x00, offset);
                        if (end === -1) end = msg.length;
                        const str = msg.toString('utf8', offset, end);
                        offset = end + 1;
                        return str;
                    };

                    const name = readString(); // Sunucu Adı
                    const map = readString(); // Harita Adı
                    const folder = readString(); // Oyun klasörü (örn: unturned)
                    const game = readString(); // Oyun Adı (örn: Unturned)

                    const appId = msg.readUInt16LE(offset); offset += 2;
                    const players = msg.readUInt8(offset); offset++;
                    const maxPlayers = msg.readUInt8(offset); offset++;
                    const bots = msg.readUInt8(offset); offset++;
                    const serverType = String.fromCharCode(msg.readUInt8(offset)); offset++;
                    const environment = String.fromCharCode(msg.readUInt8(offset)); offset++;
                    const visibility = msg.readUInt8(offset); offset++;
                    const vac = msg.readUInt8(offset); offset++;

                    resolve({
                        name: name,
                        map: map,
                        players: players,
                        maxPlayers: maxPlayers,
                        ping: ping,
                        isOnline: true
                    });
                } catch (e) {
                    reject(new Error('PARSE_ERROR'));
                }
            });

            client.on('error', (err) => {
                clearTimeout(timeout);
                client.close();
                reject(err);
            });

            // A2S_INFO sorgusu (0xFFFFFFFF "TSource Engine Query\0")
            const request = Buffer.from([
                0xFF, 0xFF, 0xFF, 0xFF,
                0x54, 0x53, 0x6F, 0x75, 0x72, 0x63, 0x65, 0x20,
                0x45, 0x6E, 0x67, 0x69, 0x6E, 0x65, 0x20, 0x51,
                0x75, 0x65, 0x72, 0x79, 0x00
            ]);

            client.send(request, port, ip, (err) => {
                if (err) {
                    clearTimeout(timeout);
                    client.close();
                    reject(err);
                }
            });
        });
    }
}

module.exports = ServerQuery;
