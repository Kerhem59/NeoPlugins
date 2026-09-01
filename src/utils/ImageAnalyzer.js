const axios = require('axios');

class ImageAnalyzer {
  constructor() {
    this.tesseract = null;
    this.initTesseract();
  }

  initTesseract() {
    try {
      this.tesseract = require('tesseract.js');
    } catch (e) {
      this.tesseract = null;
    }
  }

  /**
   * Resim bağlantısındaki metinleri ve kanalları analiz eder.
   * @param {string} imageUrl 
   * @returns {Promise<{success: boolean, confidence: string, score: number, badge: string, details: string, matchedTerms: string[]}>}
   */
  async analyzeImage(imageUrl) {
    if (!this.tesseract) {
      this.initTesseract();
    }

    try {
      let extractedText = '';

      if (this.tesseract) {
        // Tesseract.js ile OCR metin çıkarma
        const worker = await this.tesseract.createWorker('tur+eng', 1, {
          logger: () => {} // Sessiz mod
        });
        
        const { data: { text } } = await worker.recognize(imageUrl);
        await worker.terminate();
        extractedText = text ? text.toLowerCase() : '';
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return {
          success: false,
          confidence: 'LOW',
          score: 0,
          badge: '⚪ Otomatik Görsel Analizi: Metin Tespiti Yapılamadı (Manuel İnceleme)',
          details: 'Fotoğraftaki metinler okunamadı. Lütfen yetkili incelemesini bekleyin.',
          matchedTerms: []
        };
      }

      // Kanal Eşleşmeleri
      const channelKeywords = ['özdemir', 'ozdemir', 'ozdemirtv', 'özdemir tv', 'ozdemir-tv', 'ozdemirtmp'];
      const subKeywords = ['abone olundu', 'abonelikten çık', 'subscribed', 'unsubscribe', 'takip ediliyor', 'takibi bırak', 'following'];
      const generalKeywords = ['abone', 'takip', 'katıl', 'destekçi', 'bell'];

      const foundChannels = channelKeywords.filter(k => extractedText.includes(k));
      const foundSubText = subKeywords.filter(k => extractedText.includes(k));
      const foundGeneralText = generalKeywords.filter(k => extractedText.includes(k));

      const matchedTerms = [...new Set([...foundChannels, ...foundSubText, ...foundGeneralText])];

      // --- TARİH VE SAAT TARAMASI ---
      const now = new Date();
      const currentYear = now.getFullYear().toString();
      const monthNames = ['ocak', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım', 'aralık'];
      const currentMonthName = monthNames[now.getMonth()];

      const dateRegex = /\b(\d{1,2})[\.\/\-](0?[1-9]|1[0-2])[\.\/\-](\d{2,4})\b/g;
      const timeRegex = /\b([01]?\d|2[0-3])[\:\.]([0-5]\d)\b/g;
      const relativeTimeKeywords = ['bugün', 'dün', 'saat önce', 'dakika önce', 'az önce', 'yeni', 'şimdi', 'sn önce', 'dk önce'];

      const detectedDates = extractedText.match(dateRegex) || [];
      const detectedTimes = extractedText.match(timeRegex) || [];
      const foundRelativeTime = relativeTimeKeywords.filter(k => extractedText.includes(k));

      let dateStatus = '❓ Belirgin Tarih Okunamadı';
      let isDateRecent = false;

      if (foundRelativeTime.length > 0) {
        isDateRecent = true;
        dateStatus = `✅ Güncel İfade (\`${foundRelativeTime.join(', ')}\`)`;
      } else if (detectedDates.length > 0) {
        const firstDate = detectedDates[0];
        if (firstDate.includes(currentYear) || extractedText.includes(currentMonthName)) {
          isDateRecent = true;
          dateStatus = `✅ Güncel Tarih (\`${firstDate}\`)`;
        } else {
          dateStatus = `⚠️ Eski/Farklı Tarih (\`${firstDate}\`)`;
        }
      } else if (extractedText.includes(currentMonthName) || extractedText.includes(currentYear)) {
        isDateRecent = true;
        dateStatus = `✅ Güncel Dönem (\`${currentMonthName} ${currentYear}\`)`;
      }

      if (detectedTimes.length > 0 && !dateStatus.includes('Tarih')) {
        dateStatus += ` (Saat: \`${detectedTimes[0]}\`)`;
      }

      let score = 0;
      if (foundChannels.length > 0) score += 45;
      if (foundSubText.length > 0) score += 40;
      else if (foundGeneralText.length > 0) score += 15;
      if (isDateRecent) score += 15;

      let confidence = 'LOW';
      let badge = '⚪ Otomatik Görsel Analizi: Yetersiz Eşleşme (Manuel İnceleme)';

      if (score >= 80) {
        confidence = 'HIGH';
        badge = `🟢 Otomatik Görsel Analizi: ✅ Abonelik & Güncel Tarih Tespit Edildi! (%${score} Uyum)`;
      } else if (score >= 40) {
        confidence = 'MEDIUM';
        badge = `🟡 Otomatik Görsel Analizi: ⚠️ Kanal/Abonelik Bulundu (%${score} Uyum - Tarih/Buton İncelenmeli)`;
      }

      const details = `**Tespit Edilen Etiketler:** ${matchedTerms.length > 0 ? matchedTerms.map(t => `\`${t}\``).join(', ') : 'Metin eşleşmesi yok.'}\n` +
                      `**📅 Tarih & Saat Analizi:** ${dateStatus}\n` +
                      `**📌 Zorunlu Kural:** Üyenin **TÜM platformlara (YouTube, Kick & Instagram)** aboneliği/takibi kontrol edilmelidir.`;

      return {
        success: true,
        confidence,
        score,
        badge,
        details,
        matchedTerms,
        detectedDates,
        detectedTimes,
        isDateRecent
      };

    } catch (error) {
      console.error('[ImageAnalyzer] Görsel analiz hatası:', error.message);
      return {
        success: false,
        confidence: 'LOW',
        score: 0,
        badge: '⚪ Otomatik Görsel Analizi: İşlenemedi (Manuel İnceleme)',
        details: 'Görsel işlenirken bir hata oluştu.',
        matchedTerms: []
      };
    }
  }
}

module.exports = new ImageAnalyzer();
