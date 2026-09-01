const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// ===================== FONT KAYDI =====================
const fontsDir = path.join(__dirname, 'fonts');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Inter-Variable.ttf'), 'Inter');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Regular.ttf'), 'Poppins');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Bold.ttf'), 'Poppins Bold');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-SemiBold.ttf'), 'Poppins SemiBold');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Medium.ttf'), 'Poppins Medium');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Light.ttf'), 'Poppins Light');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Italic.ttf'), 'Poppins Italic');

// Font ailesi sabitleri
const FONT = {
    heading: 'Poppins Bold',
    subheading: 'Poppins SemiBold',
    body: 'Inter',
    medium: 'Poppins Medium',
    light: 'Poppins Light',
    italic: 'Poppins Italic',
};

// Yardımcı: Yuvarlak dikdörtgen çizme
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Yardımcı: Avatar çemberi çizme
function drawCircleImage(ctx, image, x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, x, y, radius * 2, radius * 2);
    ctx.restore();
}

// Yardımcı: Premium avatar çizme (çift halka, gradient, glow, iç gölge)
function drawPremiumAvatar(ctx, image, centerX, centerY, radius, colors) {
    // colors = { primary: '#f39c12', secondary: '#f1c40f', glow: '#f39c12' }
    const primary = colors.primary || '#667eea';
    const secondary = colors.secondary || '#764ba2';
    const glowColor = colors.glow || primary;

    // Katmanlı dış glow
    for (let i = 4; i >= 1; i--) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 8 + i * 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(glowColor)}, ${0.03 * i})`;
        ctx.fill();
        ctx.restore();
    }

    // Dış halka (ince, yarı saydam)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hexToRgb(primary)}, 0.25)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ana gradient çerçeve
    const borderGrad = ctx.createLinearGradient(
        centerX - radius, centerY - radius,
        centerX + radius, centerY + radius
    );
    borderGrad.addColorStop(0, primary);
    borderGrad.addColorStop(0.5, secondary);
    borderGrad.addColorStop(1, primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 4;
    ctx.stroke();

    // İç arka plan daire
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a1a';
    ctx.fill();

    // Avatar çizimi
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(image, centerX - radius, centerY - radius, radius * 2, radius * 2);

    // İç vignette gölge (avatarın kenarlarını karartır)
    const vignetteGrad = ctx.createRadialGradient(
        centerX, centerY, radius * 0.6,
        centerX, centerY, radius
    );
    vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.restore();

    // İnce iç çizgi (beyaz parlama)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dekoratif parlamalar (Dış halkada küçük aksanlar)
    const accentSize = Math.PI / 8;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 8, (i * Math.PI / 2) - accentSize / 2, (i * Math.PI / 2) + accentSize / 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }

    // Cam parlaması (Glossy overlay)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();
    const gloss = ctx.createLinearGradient(centerX, centerY - radius, centerX, centerY + radius);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    gloss.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = gloss;
    ctx.fill();
    ctx.restore();
}

// Yardımcı: Hex renk kodunu RGB'ye çevirme
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

// Yardımcı: Metin kısaltma
function truncateText(ctx, text, maxWidth) {
    let width = ctx.measureText(text).width;
    if (width <= maxWidth) return text;
    while (width > maxWidth && text.length > 0) {
        text = text.slice(0, -1);
        width = ctx.measureText(text + '...').width;
    }
    return text + '...';
}

// Yardımcı: Ağ hatasını kontrol et (fetch TypeError sarmalıyor)
function isNetworkError(err) {
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') return true;
    if (err.cause?.code === 'ECONNRESET' || err.cause?.code === 'ETIMEDOUT' || err.cause?.code === 'ENOTFOUND') return true;
    if (err.message?.includes('fetch failed') || err.message?.includes('ECONNRESET')) return true;
    return false;
}

// Yardımcı: Varsayılan avatar oluştur (ağ hatası durumunda)
function createDefaultAvatar() {
    const size = 256;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Gradient arka plan
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#667eea');
    grad.addColorStop(1, '#764ba2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Kullanıcı ikonu (basit siluet)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.36, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.85, size * 0.28, size * 0.22, 0, Math.PI, 0);
    ctx.fill();

    return canvas.toBuffer('image/png');
}

// Yardımcı: Hex avatarURL → Buffer (retry + fallback destekli)
async function fetchAvatar(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (err) {
            console.warn(`[Avatar] Deneme ${attempt}/${maxRetries} başarısız: ${err.cause?.code || err.code || err.message}`);
            if (attempt < maxRetries && isNetworkError(err)) {
                await new Promise(res => setTimeout(res, 800 * attempt));
                continue;
            }
            // Tüm denemeler başarısız → varsayılan avatar döndür
            console.warn('[Avatar] Ağ hatası, varsayılan avatar kullanılıyor.');
            return createDefaultAvatar();
        }
    }
}

class CanvasBuilder {

    // ===================== HOŞGELDİN KARTI =====================
    static async createWelcomeCard(member) {
        const canvas = createCanvas(900, 300);
        const ctx = canvas.getContext('2d');

        // Arka plan gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 900, 300);
        bgGrad.addColorStop(0, '#0f0c29');
        bgGrad.addColorStop(0.5, '#302b63');
        bgGrad.addColorStop(1, '#24243e');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 900, 300, 20);
        ctx.fill();

        // Dekoratif parçacıklar
        for (let i = 0; i < 40; i++) {
            const px = Math.random() * 900;
            const py = Math.random() * 300;
            const pr = Math.random() * 2.5 + 0.5;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.05})`;
            ctx.fill();
        }

        // Kenar çizgisi
        const borderGrad = ctx.createLinearGradient(0, 0, 900, 300);
        borderGrad.addColorStop(0, '#667eea');
        borderGrad.addColorStop(1, '#764ba2');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 3;
        roundRect(ctx, 2, 2, 896, 296, 18);
        ctx.stroke();

        // Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarBuffer = await fetchAvatar(avatarUrl);
        const avatar = await loadImage(avatarBuffer);

        drawPremiumAvatar(ctx, avatar, 150, 150, 72, { primary: '#667eea', secondary: '#764ba2', glow: '#667eea' });

        // "HOŞGELDİN" başlığı
        ctx.font = 'bold 14px Poppins Bold, sans-serif';
        ctx.fillStyle = '#667eea';
        ctx.textAlign = 'left';
        ctx.fillText('H O Ş G E L D İ N', 260, 90);

        // Kullanıcı adı
        ctx.font = 'bold 36px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(102, 126, 234, 0.5)';
        ctx.shadowBlur = 10;
        const displayName = truncateText(ctx, member.user.username, 500);
        ctx.fillText(displayName, 260, 135);
        ctx.shadowBlur = 0;

        // Discriminator / tag
        ctx.font = '18px Inter, sans-serif';
        ctx.fillStyle = '#a0a0cc';
        ctx.fillText(`@${member.user.username}`, 260, 165);

        // Sunucu bilgisi
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#8888aa';
        ctx.fillText(`${member.guild.name} sunucusuna katıldı!`, 260, 200);

        // Üye sayısı badge
        const memberCount = `#${member.guild.memberCount}. üye`;
        ctx.font = 'bold 14px Poppins Bold, sans-serif';
        const badgeWidth = ctx.measureText(memberCount).width + 24;
        
        roundRect(ctx, 260, 220, badgeWidth, 30, 15);
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 1;
        roundRect(ctx, 260, 220, badgeWidth, 30, 15);
        ctx.stroke();
        
        ctx.fillStyle = '#667eea';
        ctx.fillText(memberCount, 272, 240);

        return canvas.toBuffer('image/png');
    }

    // ===================== AYRILAN KİŞİ KARTI =====================
    static async createLeaveCard(member) {
        const canvas = createCanvas(900, 300);
        const ctx = canvas.getContext('2d');

        // Arka plan gradient (kırmızımsı tonlar)
        const bgGrad = ctx.createLinearGradient(0, 0, 900, 300);
        bgGrad.addColorStop(0, '#1a0a0a');
        bgGrad.addColorStop(0.5, '#3d1515');
        bgGrad.addColorStop(1, '#2a0e0e');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 900, 300, 20);
        ctx.fill();

        // Dekoratif parçacıklar
        for (let i = 0; i < 30; i++) {
            const px = Math.random() * 900;
            const py = Math.random() * 300;
            const pr = Math.random() * 2 + 0.5;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 100, 100, ${Math.random() * 0.2 + 0.05})`;
            ctx.fill();
        }

        // Kenar çizgisi
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        roundRect(ctx, 2, 2, 896, 296, 18);
        ctx.stroke();

        // Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarBuffer = await fetchAvatar(avatarUrl);
        const avatar = await loadImage(avatarBuffer);

        drawPremiumAvatar(ctx, avatar, 150, 150, 72, { primary: '#e74c3c', secondary: '#c0392b', glow: '#e74c3c' });

        // "GÜLE GÜLE" başlığı
        ctx.font = 'bold 14px Poppins Bold, sans-serif';
        ctx.fillStyle = '#e74c3c';
        ctx.textAlign = 'left';
        ctx.fillText('G Ü L E   G Ü L E', 260, 90);

        // Kullanıcı adı
        ctx.font = 'bold 36px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(231, 76, 60, 0.5)';
        ctx.shadowBlur = 10;
        const displayName = truncateText(ctx, member.user.username, 500);
        ctx.fillText(displayName, 260, 135);
        ctx.shadowBlur = 0;

        ctx.font = '18px Inter, sans-serif';
        ctx.fillStyle = '#cc8888';
        ctx.fillText(`@${member.user.username}`, 260, 165);

        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#aa6666';
        ctx.fillText(`${member.guild.name} sunucusundan ayrıldı.`, 260, 200);

        // Kalan üye sayısı
        const memberCount = `${member.guild.memberCount} üye kaldı`;
        ctx.font = 'bold 14px Poppins Bold, sans-serif';
        const badgeWidth = ctx.measureText(memberCount).width + 24;

        roundRect(ctx, 260, 220, badgeWidth, 30, 15);
        ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        roundRect(ctx, 260, 220, badgeWidth, 30, 15);
        ctx.stroke();

        ctx.fillStyle = '#e74c3c';
        ctx.fillText(memberCount, 272, 240);

        return canvas.toBuffer('image/png');
    }

    // ===================== PROFİL KARTI =====================
    static async createProfileCard(member, data) {
        const canvas = createCanvas(900, 400);
        const ctx = canvas.getContext('2d');

        // data = { coins, totalMessages, totalTickets, level, xp, xpNeeded, rank, isAfk, afkReason }

        // Arka plan
        const bgGrad = ctx.createLinearGradient(0, 0, 900, 400);
        bgGrad.addColorStop(0, '#0a0a1a');
        bgGrad.addColorStop(0.4, '#141432');
        bgGrad.addColorStop(1, '#0d0d2b');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 900, 400, 20);
        ctx.fill();

        // Üst banner gradient şeridi
        const bannerGrad = ctx.createLinearGradient(0, 0, 900, 0);
        bannerGrad.addColorStop(0, '#667eea');
        bannerGrad.addColorStop(0.5, '#764ba2');
        bannerGrad.addColorStop(1, '#f093fb');
        ctx.fillStyle = bannerGrad;
        roundRect(ctx, 0, 0, 900, 120, 20);
        ctx.fill();
        // Alt köşeleri düzelt
        ctx.fillRect(0, 100, 900, 20);

        // Dekoratif noktalar
        for (let i = 0; i < 50; i++) {
            const px = Math.random() * 900;
            const py = Math.random() * 400;
            const pr = Math.random() * 1.5 + 0.3;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
            ctx.fill();
        }

        // Kenar çizgisi
        const borderGrad = ctx.createLinearGradient(0, 0, 900, 400);
        borderGrad.addColorStop(0, '#667eea');
        borderGrad.addColorStop(1, '#764ba2');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 3;
        roundRect(ctx, 2, 2, 896, 396, 18);
        ctx.stroke();

        // Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarBuffer = await fetchAvatar(avatarUrl);
        const avatar = await loadImage(avatarBuffer);

        drawPremiumAvatar(ctx, avatar, 100, 145, 62, { primary: '#667eea', secondary: '#f093fb', glow: '#667eea' });

        // Durum indikatörü (AFK ise turuncu, online ise yeşil)
        ctx.beginPath();
        ctx.arc(148, 193, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a1a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(148, 193, 7, 0, Math.PI * 2);
        ctx.fillStyle = data.isAfk ? '#f39c12' : '#2ecc71';
        ctx.fill();

        // Kullanıcı adı
        ctx.font = 'bold 28px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        const name = truncateText(ctx, member.user.globalName || member.user.username, 350);
        ctx.fillText(name, 185, 155);
        ctx.shadowBlur = 0;

        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#8888bb';
        ctx.fillText(`@${member.user.username}`, 185, 180);

        // AFK Badge (eğer AFK ise)
        if (data.isAfk) {
            const afkText = `AFK: ${data.afkReason || 'Belirtilmedi'}`;
            ctx.font = 'bold 12px Poppins Bold, sans-serif';
            const afkWidth = ctx.measureText(afkText).width + 20;
            roundRect(ctx, 185, 190, afkWidth, 24, 12);
            ctx.fillStyle = 'rgba(243, 156, 18, 0.2)';
            ctx.fill();
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 1;
            roundRect(ctx, 185, 190, afkWidth, 24, 12);
            ctx.stroke();
            ctx.fillStyle = '#f39c12';
            ctx.fillText(afkText, 195, 206);
        }

        // Rank Badge (sağ üst)
        ctx.font = 'bold 14px Poppins Bold, sans-serif';
        ctx.textAlign = 'right';
        const rankText = `SIRA #${data.rank || '?'}`;
        const rankWidth = ctx.measureText(rankText).width + 24;
        roundRect(ctx, 900 - rankWidth - 20, 15, rankWidth, 30, 15);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(rankText, 880 - 12, 35);

        // ─── İstatistik Kutuları ───
        const statsY = 250;
        const boxWidth = 190;
        const boxHeight = 80;
        const gap = 20;
        const startX = 30;

        const stats = [
            { label: 'COIN', value: (data.coins || 0).toLocaleString('tr-TR') },
            { label: 'MESAJ', value: (data.totalMessages || 0).toLocaleString('tr-TR') },
            { label: 'TİCKET', value: (data.totalTickets || 0).toLocaleString('tr-TR') },
            { label: 'SEVİYE', value: `${data.level || 0}` },
        ];

        for (let i = 0; i < stats.length; i++) {
            const x = startX + i * (boxWidth + gap);
            
            // Kutu arka planı
            roundRect(ctx, x, statsY, boxWidth, boxHeight, 12);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            roundRect(ctx, x, statsY, boxWidth, boxHeight, 12);
            ctx.stroke();

            // Label ve Değer
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px Poppins Bold, sans-serif';
            ctx.fillStyle = '#6666aa';
            ctx.fillText(stats[i].label, x + boxWidth / 2, statsY + 32);

            ctx.font = 'bold 20px Poppins Bold, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(stats[i].value, x + boxWidth / 2, statsY + 62);
        }

        // XP Progress Bar
        const barX = 30;
        const barY = 355;
        const barWidth = 840;
        const barHeight = 18;
        const xpPercent = data.xpNeeded > 0 ? Math.min(data.xp / data.xpNeeded, 1) : 0;

        // Bar arka planı
        roundRect(ctx, barX, barY, barWidth, barHeight, 9);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();

        // Bar dolumu
        if (xpPercent > 0) {
            const fillWidth = Math.max(barWidth * xpPercent, 18);
            const barGrad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
            barGrad.addColorStop(0, '#667eea');
            barGrad.addColorStop(1, '#f093fb');
            roundRect(ctx, barX, barY, fillWidth, barHeight, 9);
            ctx.fillStyle = barGrad;
            ctx.fill();
        }

        // XP metni
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${data.xp || 0} / ${data.xpNeeded || 100} XP`, barX + barWidth / 2, barY + 13);

        return canvas.toBuffer('image/png');
    }

    // ===================== RANK KARTI =====================
    static async createRankCard(member, data) {
        const canvas = createCanvas(900, 250);
        const ctx = canvas.getContext('2d');

        // data = { level, xp, xpNeeded, rank, totalMessages }

        // Arka plan
        const bgGrad = ctx.createLinearGradient(0, 0, 900, 250);
        bgGrad.addColorStop(0, '#0f0c29');
        bgGrad.addColorStop(0.5, '#1a1a3e');
        bgGrad.addColorStop(1, '#24243e');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 900, 250, 20);
        ctx.fill();

        // Dekoratif parçacıklar
        for (let i = 0; i < 30; i++) {
            const px = Math.random() * 900;
            const py = Math.random() * 250;
            const pr = Math.random() * 1.5 + 0.3;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
            ctx.fill();
        }

        // Kenar çizgisi
        const borderGrad = ctx.createLinearGradient(0, 0, 900, 250);
        borderGrad.addColorStop(0, '#667eea');
        borderGrad.addColorStop(1, '#764ba2');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 3;
        roundRect(ctx, 2, 2, 896, 246, 18);
        ctx.stroke();

        // Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarBuffer = await fetchAvatar(avatarUrl);
        const avatar = await loadImage(avatarBuffer);

        drawPremiumAvatar(ctx, avatar, 110, 125, 60, { primary: '#667eea', secondary: '#764ba2', glow: '#667eea' });

        // Kullanıcı adı
        ctx.font = 'bold 28px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        const displayName = truncateText(ctx, member.user.globalName || member.user.username, 350);
        ctx.fillText(displayName, 200, 80);

        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#8888bb';
        ctx.fillText(`@${member.user.username}`, 200, 105);

        // RANK ve LEVEL badges (sağ üst)
        ctx.textAlign = 'right';

        // Rank
        ctx.font = 'bold 12px Poppins Bold, sans-serif';
        ctx.fillStyle = '#8888bb';
        ctx.fillText('SIRA', 780, 55);
        ctx.font = 'bold 32px Poppins Bold, sans-serif';
        ctx.fillStyle = '#667eea';
        ctx.fillText(`#${data.rank || '?'}`, 780, 90);

        // Level
        ctx.font = 'bold 12px Poppins Bold, sans-serif';
        ctx.fillStyle = '#8888bb';
        ctx.fillText('SEVİYE', 870, 55);
        ctx.font = 'bold 32px Poppins Bold, sans-serif';
        ctx.fillStyle = '#f093fb';
        ctx.fillText(`${data.level || 0}`, 870, 90);

        // Mesaj sayısı
        ctx.textAlign = 'left';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#6666aa';
        ctx.fillText(`${(data.totalMessages || 0).toLocaleString('tr-TR')} mesaj`, 200, 135);

        // XP Progress Bar
        const barX = 200;
        const barY = 160;
        const barWidth = 660;
        const barHeight = 22;
        const xpPercent = data.xpNeeded > 0 ? Math.min(data.xp / data.xpNeeded, 1) : 0;

        // Bar arka planı
        roundRect(ctx, barX, barY, barWidth, barHeight, 11);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();

        // Bar dolumu
        if (xpPercent > 0) {
            const fillWidth = Math.max(barWidth * xpPercent, 22);
            const barGrad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
            barGrad.addColorStop(0, '#667eea');
            barGrad.addColorStop(0.5, '#764ba2');
            barGrad.addColorStop(1, '#f093fb');
            roundRect(ctx, barX, barY, fillWidth, barHeight, 11);
            ctx.fillStyle = barGrad;
            ctx.fill();
        }

        // XP metni bar üstünde
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${data.xp || 0} / ${data.xpNeeded || 100} XP`, barX + barWidth / 2, barY + 16);

        // Yüzde sağda
        ctx.textAlign = 'right';
        ctx.font = 'bold 14px Poppins Bold, sans-serif';
        ctx.fillStyle = '#aaaadd';
        ctx.fillText(`${Math.round(xpPercent * 100)}%`, barX + barWidth, barY - 8);

        // Alt bilgi
        ctx.textAlign = 'center';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#555577';
        ctx.fillText(`Sonraki seviyeye ${Math.max((data.xpNeeded || 100) - (data.xp || 0), 0)} XP kaldı`, barX + barWidth / 2, barY + 50);

        return canvas.toBuffer('image/png');
    }
    // ===================== TICKET AÇILIŞ KARTI =====================
    static async createTicketCard(member, type, reason) {
        const canvas = createCanvas(800, 250);
        const ctx = canvas.getContext('2d');

        // Arka plan gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 800, 250);
        bgGrad.addColorStop(0, '#111111');
        bgGrad.addColorStop(1, '#1e1e2e');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 800, 250, 20);
        ctx.fill();

        // Yan şerit (renkli)
        const stripeGrad = ctx.createLinearGradient(0, 0, 0, 250);
        stripeGrad.addColorStop(0, '#00b4db');
        stripeGrad.addColorStop(1, '#0083b0');
        ctx.fillStyle = stripeGrad;
        roundRect(ctx, 0, 0, 15, 250, 20);
        ctx.fill();
        ctx.fillRect(10, 0, 5, 250); // Köşeleri düzelt

        // Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatarBuffer = await fetchAvatar(avatarUrl);
        const avatar = await loadImage(avatarBuffer);
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, 40, 50, 90, 90, 18);
        ctx.clip();
        ctx.drawImage(avatar, 40, 50, 90, 90);
        ctx.restore();

        // Başlık
        ctx.font = 'bold 32px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`TICKET AÇILDI`, 150, 75);

        // Alt çizgi
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(150, 90, 600, 2);

        // Bilgiler
        ctx.font = '18px Inter, sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Kategori:`, 150, 130);
        ctx.fillStyle = '#00b4db';
        ctx.fillText(type, 240, 130);

        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Kullanıcı:`, 150, 165);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(member.user.tag, 240, 165);

        // Sebep (Kısaltılmış)
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Sebep:`, 150, 200);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 16px Poppins Italic, sans-serif';
        const shortReason = truncateText(ctx, reason, 500);
        ctx.fillText(`"${shortReason}"`, 240, 200);

        return canvas.toBuffer('image/png');
    }

    // ===================== GÖRSEL LEADERBOARD KARTI =====================
    static async createLeaderboardCard(topUsers, guildName) {
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');

        // Arka plan
        const bgGrad = ctx.createLinearGradient(0, 0, 800, 600);
        bgGrad.addColorStop(0, '#0f0c29');
        bgGrad.addColorStop(1, '#302b63');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 800, 600, 25);
        ctx.fill();

        // Başlık
        ctx.font = 'bold 40px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('SEVİYE SIRALAMASI', 400, 70);
        
        ctx.font = '20px Inter, sans-serif';
        ctx.fillStyle = '#aaaaff';
        ctx.fillText(guildName, 400, 100);

        // Alt çizgi
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(100, 120, 600, 2);

        // Kullanıcıları listele (En iyi 5)
        for (let i = 0; i < Math.min(topUsers.length, 5); i++) {
            const user = topUsers[i];
            const y = 160 + (i * 85);
            
            // Satır arka planı
            roundRect(ctx, 50, y, 700, 70, 15);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fill();

            // Sıralama
            ctx.font = 'bold 30px Poppins Bold, sans-serif';
            ctx.fillStyle = i === 0 ? '#ffd700' : (i === 1 ? '#c0c0c0' : (i === 2 ? '#cd7f32' : '#ffffff'));
            ctx.textAlign = 'left';
            ctx.fillText(`#${i + 1}`, 80, y + 45);

            // Avatar (Eğer varsa - yoksa çember çiz)
            try {
                const avatarUrl = user.avatarURL;
                if (avatarUrl) {
                    const avatarBuffer = await fetchAvatar(avatarUrl);
                    const avatar = await loadImage(avatarBuffer);
                    drawCircleImage(ctx, avatar, 140, y + 10, 25);
                } else {
                    ctx.beginPath();
                    ctx.arc(165, y + 35, 25, 0, Math.PI * 2);
                    ctx.fillStyle = '#444444';
                    ctx.fill();
                }
            } catch (e) {
                ctx.beginPath();
                ctx.arc(165, y + 35, 25, 0, Math.PI * 2);
                ctx.fillStyle = '#444444';
                ctx.fill();
            }

            // İsim
            ctx.font = 'bold 22px Poppins Bold, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(truncateText(ctx, user.tag, 300), 210, y + 45);

            // Seviye bilgisi (Sağa yaslı)
            ctx.textAlign = 'right';
            ctx.font = 'bold 20px Poppins Bold, sans-serif';
            ctx.fillStyle = '#f093fb';
            ctx.fillText(`LVL ${user.level}`, 720, y + 35);
            
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#8888bb';
            ctx.fillText(`${user.xp.toLocaleString()} XP`, 720, y + 55);
        }

        return canvas.toBuffer('image/png');
    }

    // ===================== EKONOMİ KARTI =====================
    static async createEconomyCard(member, data) {
        const canvas = createCanvas(600, 350);
        const ctx = canvas.getContext('2d');

        // Kredi kartı tarzı arka plan
        const bgGrad = ctx.createLinearGradient(0, 0, 600, 350);
        bgGrad.addColorStop(0, '#434343');
        bgGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 600, 350, 30);
        ctx.fill();

        // Dekoratif çemberler
        ctx.beginPath();
        ctx.arc(500, 100, 150, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();

        // Banka İsmi
        ctx.font = 'bold 24px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('LOS CUBOS BANK', 50, 60);
        
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('OFFICIAL MEMBER CARD', 50, 85);

        // Chip görseli (basit)
        roundRect(ctx, 50, 120, 70, 50, 10);
        ctx.fillStyle = '#ffd700';
        ctx.fill();

        // Bakiye Başlığı
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('TOPLAM BAKİYE', 50, 210);

        // Bakiye Değeri
        ctx.font = 'bold 42px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        const total = (data.coins || 0) + (data.bank || 0);
        ctx.fillText(`${total.toLocaleString('tr-TR')} ₺`, 50, 260);

        // Detaylar (Nakit / Banka)
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#888888';
        ctx.fillText(`NAKİT: ${data.coins.toLocaleString()} | BANKA: ${data.bank.toLocaleString()}`, 50, 290);

        // Kart Sahibi
        ctx.font = 'bold 18px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(member.user.username.toUpperCase(), 550, 310);

        return canvas.toBuffer('image/png');
    }

    // ===================== AFK GİRİŞ KARTI =====================
    static async createAfkSetCard(member, reason) {
        const canvas = createCanvas(900, 280);
        const ctx = canvas.getContext('2d');

        // Arka plan - koyu gece mavisi/mor gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 900, 280);
        bgGrad.addColorStop(0, '#0a0a2e');
        bgGrad.addColorStop(0.4, '#1a1145');
        bgGrad.addColorStop(0.8, '#0d1b3e');
        bgGrad.addColorStop(1, '#0a0a2e');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 900, 280, 20);
        ctx.fill();

        // Yıldız parçacıkları
        for (let i = 0; i < 60; i++) {
            const px = Math.random() * 900;
            const py = Math.random() * 280;
            const pr = Math.random() * 2 + 0.3;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 200, ${Math.random() * 0.4 + 0.1})`;
            ctx.fill();
        }

        // Ay ikonu - büyük dekoratif yarım ay (sağ üst köşe)
        ctx.save();
        ctx.beginPath();
        ctx.arc(800, 60, 80, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(800, 60, 50, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
        ctx.fill();
        ctx.restore();

        // Kenar çizgisi - gece mavisi gradient
        const borderGrad = ctx.createLinearGradient(0, 0, 900, 280);
        borderGrad.addColorStop(0, '#0f172a');
        borderGrad.addColorStop(0.5, '#1e3a8a');
        borderGrad.addColorStop(1, '#3b82f6');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 3;
        roundRect(ctx, 2, 2, 896, 276, 18);
        ctx.stroke();

        // Sol tarafta dikey şerit
        const stripeGrad = ctx.createLinearGradient(0, 0, 0, 280);
        stripeGrad.addColorStop(0, '#1e3a8a');
        stripeGrad.addColorStop(1, '#3b82f6');
        ctx.fillStyle = stripeGrad;
        roundRect(ctx, 0, 0, 8, 280, 20);
        ctx.fill();
        ctx.fillRect(4, 0, 4, 280);

        // Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarBuffer = await fetchAvatar(avatarUrl);
        const avatar = await loadImage(avatarBuffer);

        drawPremiumAvatar(ctx, avatar, 120, 140, 60, { primary: '#3b82f6', secondary: '#1e3a8a', glow: '#3b82f6' });

        // Zzz animasyon efekti (statik)
        ctx.font = 'bold 28px Poppins Bold, sans-serif';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.fillText('z', 160, 95);
        ctx.font = 'bold 22px Poppins Bold, sans-serif';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.fillText('z', 172, 78);
        ctx.font = 'bold 16px Poppins Bold, sans-serif';
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.fillText('z', 182, 65);

        // Başlık
        ctx.font = 'bold 14px Poppins Bold, sans-serif';
        ctx.fillStyle = '#3b82f6';
        ctx.textAlign = 'left';
        ctx.fillText('A F K   M O D U   A K T İ F', 220, 70);

        // Kullanıcı adı
        ctx.font = 'bold 32px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
        ctx.shadowBlur = 10;
        const displayName = truncateText(ctx, member.user.globalName || member.user.username, 450);
        ctx.fillText(displayName, 220, 115);
        ctx.shadowBlur = 0;

        // @username
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#8888bb';
        ctx.fillText(`@${member.user.username}`, 220, 142);

        // Sebep kutusu
        roundRect(ctx, 220, 160, 640, 45, 12);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        roundRect(ctx, 220, 160, 640, 45, 12);
        ctx.stroke();

        ctx.font = 'bold 12px Poppins Bold, sans-serif';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('SEBEP', 240, 178);

        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#ddddee';
        const truncReason = truncateText(ctx, reason || 'Sebep belirtilmedi', 580);
        ctx.fillText(truncReason, 240, 197);

        // Alt bilgi
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#555577';
        ctx.textAlign = 'center';
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        ctx.fillText(`${timeStr} • Mesaj atıldığında AFK otomatik kalkacaktır`, 450, 250);

        return canvas.toBuffer('image/png');
    }

    // ===================== AFK ÇIKIŞ KARTI =====================
    static async createAfkRemoveCard(member, afkResult) {
        const canvas = createCanvas(900, 250);
        const ctx = canvas.getContext('2d');

        // Arka plan - yeşilimsi koyu gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 900, 250);
        bgGrad.addColorStop(0, '#0a1a0a');
        bgGrad.addColorStop(0.4, '#0d2818');
        bgGrad.addColorStop(0.8, '#0a2010');
        bgGrad.addColorStop(1, '#081a0c');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 900, 250, 20);
        ctx.fill();

        // Parçacıklar
        for (let i = 0; i < 40; i++) {
            const px = Math.random() * 900;
            const py = Math.random() * 250;
            const pr = Math.random() * 2 + 0.3;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(46, 204, 113, ${Math.random() * 0.3 + 0.05})`;
            ctx.fill();
        }

        // Kenar çizgisi
        const borderGrad = ctx.createLinearGradient(0, 0, 900, 250);
        borderGrad.addColorStop(0, '#2ecc71');
        borderGrad.addColorStop(1, '#27ae60');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 3;
        roundRect(ctx, 2, 2, 896, 246, 18);
        ctx.stroke();

        // Sol şerit
        const stripeGrad = ctx.createLinearGradient(0, 0, 0, 250);
        stripeGrad.addColorStop(0, '#2ecc71');
        stripeGrad.addColorStop(1, '#27ae60');
        ctx.fillStyle = stripeGrad;
        roundRect(ctx, 0, 0, 8, 250, 20);
        ctx.fill();
        ctx.fillRect(4, 0, 4, 250);

        // Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarBuffer = await fetchAvatar(avatarUrl);
        const avatar = await loadImage(avatarBuffer);

        drawPremiumAvatar(ctx, avatar, 110, 125, 55, { primary: '#2ecc71', secondary: '#27ae60', glow: '#2ecc71' });

        // Durum noktası - yeşil (online)
        ctx.beginPath();
        ctx.arc(152, 168, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#0a1a0a';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(152, 168, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#2ecc71';
        ctx.fill();

        // Başlık
        ctx.font = 'bold 14px Poppins Bold, sans-serif';
        ctx.fillStyle = '#2ecc71';
        ctx.textAlign = 'left';
        ctx.fillText('A F K   M O D U N D A N   Ç I K I L D I', 200, 65);

        // Kullanıcı adı
        ctx.font = 'bold 30px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(46, 204, 113, 0.4)';
        ctx.shadowBlur = 10;
        const displayName = truncateText(ctx, member.user.globalName || member.user.username, 400);
        ctx.fillText(displayName, 200, 105);
        ctx.shadowBlur = 0;

        // @username
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#8888bb';
        ctx.fillText(`@${member.user.username}`, 200, 130);

        // Süre kutusu
        const durationText = afkResult.text || 'Süre hesaplanamadı.';


        roundRect(ctx, 200, 148, 660, 40, 10);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.3)';
        ctx.lineWidth = 1;
        roundRect(ctx, 200, 148, 660, 40, 10);
        ctx.stroke();

        ctx.font = 'bold 12px Poppins Bold, sans-serif';
        ctx.fillStyle = '#2ecc71';
        ctx.fillText('SÜRE', 218, 163);

        ctx.font = '15px Inter, sans-serif';
        ctx.fillStyle = '#ddddee';
        ctx.fillText(durationText, 218, 181);

        // Alt bilgi
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#446644';
        ctx.textAlign = 'center';
        ctx.fillText('Tekrar hoş geldin!', 450, 230);

        return canvas.toBuffer('image/png');
    }

    // ===================== AFK İSTATİSTİK KARTI =====================
    static async createAfkStatsCard(member, stats) {
        const canvas = createCanvas(900, 380);
        const ctx = canvas.getContext('2d');

        // stats = { totalCount, totalDuration, avgDuration, lastReason, lastAfkAt, totalDurationFormatted, avgDurationFormatted }

        // Arka plan
        const bgGrad = ctx.createLinearGradient(0, 0, 900, 380);
        bgGrad.addColorStop(0, '#0a0a1a');
        bgGrad.addColorStop(0.4, '#141432');
        bgGrad.addColorStop(1, '#0d0d2b');
        ctx.fillStyle = bgGrad;
        roundRect(ctx, 0, 0, 900, 380, 20);
        ctx.fill();

        // Üst banner
        const bannerGrad = ctx.createLinearGradient(0, 0, 900, 0);
        bannerGrad.addColorStop(0, '#0f172a');
        bannerGrad.addColorStop(0.5, '#1e3a8a');
        bannerGrad.addColorStop(1, '#3b82f6');
        ctx.fillStyle = bannerGrad;
        roundRect(ctx, 0, 0, 900, 110, 20);
        ctx.fill();
        ctx.fillRect(0, 90, 900, 20);

        // Yıldızlar
        for (let i = 0; i < 50; i++) {
            const px = Math.random() * 900;
            const py = Math.random() * 380;
            const pr = Math.random() * 1.5 + 0.3;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15})`;
            ctx.fill();
        }

        // Kenar çizgisi
        const borderGrad = ctx.createLinearGradient(0, 0, 900, 380);
        borderGrad.addColorStop(0, '#1e3a8a');
        borderGrad.addColorStop(1, '#3b82f6');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 3;
        roundRect(ctx, 2, 2, 896, 376, 18);
        ctx.stroke();

        // Avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatarBuffer = await fetchAvatar(avatarUrl);
        const avatar = await loadImage(avatarBuffer);

        drawPremiumAvatar(ctx, avatar, 100, 135, 56, { primary: '#3b82f6', secondary: '#1e3a8a', glow: '#3b82f6' });

        // Kullanıcı adı
        ctx.font = 'bold 26px Poppins Bold, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        const name = truncateText(ctx, member.user.globalName || member.user.username, 350);
        ctx.fillText(name, 180, 145);
        ctx.shadowBlur = 0;

        ctx.font = '15px Inter, sans-serif';
        ctx.fillStyle = '#8888bb';
        ctx.fillText(`@${member.user.username}`, 180, 170);

        // Başlık sağ üst
        ctx.font = 'bold 16px Poppins Bold, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.textAlign = 'right';
        ctx.fillText('AFK İSTATİSTİKLERİ', 870, 40);

        // ─── İstatistik Kutuları ───
        const statsY = 210;
        const boxWidth = 190;
        const boxHeight = 85;
        const gap = 20;
        const startX = 30;

        const statItems = [
            { label: 'TOPLAM AFK', value: `${stats.totalCount}`, sub: 'kez' },
            { label: 'TOPLAM SÜRE', value: stats.totalDurationFormatted, sub: '' },
            { label: 'ORTALAMA', value: stats.avgDurationFormatted, sub: '' },
            { label: 'SON SEBEP', value: truncateText(ctx, stats.lastReason, 140), sub: '' },
        ];

        for (let i = 0; i < statItems.length; i++) {
            const x = startX + i * (boxWidth + gap);

            // Kutu arka planı
            roundRect(ctx, x, statsY, boxWidth, boxHeight, 14);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
            ctx.lineWidth = 1;
            roundRect(ctx, x, statsY, boxWidth, boxHeight, 14);
            ctx.stroke();

            // Label
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px Poppins Bold, sans-serif';
            ctx.fillStyle = '#3b82f6';
            ctx.fillText(statItems[i].label, x + boxWidth / 2, statsY + 35);

            // Değer
            ctx.font = 'bold 16px Poppins Bold, sans-serif';
            ctx.fillStyle = '#ffffff';
            const val = truncateText(ctx, `${statItems[i].value}${statItems[i].sub ? ' ' + statItems[i].sub : ''}`, boxWidth - 20);
            ctx.fillText(val, x + boxWidth / 2, statsY + 65);
        }

        // Son AFK tarihi (alt bilgi)
        ctx.textAlign = 'center';
        ctx.font = '13px Inter, sans-serif';
        ctx.fillStyle = '#555577';
        if (stats.lastAfkAt > 0) {
            const lastDate = new Date(stats.lastAfkAt);
            ctx.fillText(`Son AFK: ${lastDate.toLocaleDateString('tr-TR')}`, 400, 370);
        }

        return canvas.toBuffer('image/png');
    }

    // ===================== TICKET KARTI =====================
    static async createTicketSetupCard(guild) {
        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Arka plan - SAF SIYAH
        ctx.fillStyle = '#000000';
        roundRect(ctx, 0, 0, 800, 400, 40);
        ctx.fill();

        // Kenar - Pembe
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 5;
        roundRect(ctx, 2, 2, 796, 396, 38);
        ctx.stroke();

        // Logo Yerlesimi
        const logoUrl = guild.iconURL({ extension: 'png', size: 512 });
        if (logoUrl) {
            try {
                const logoBuffer = await fetchAvatar(logoUrl);
                const logo = await loadImage(logoBuffer);
                
                ctx.save();
                ctx.shadowColor = '#ff69b4';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                roundRect(ctx, 60, 100, 200, 200, 30);
                ctx.clip();
                ctx.drawImage(logo, 60, 100, 200, 200);
                ctx.restore();

                ctx.strokeStyle = '#ff69b4';
                ctx.lineWidth = 4;
                ctx.beginPath();
                roundRect(ctx, 60, 100, 200, 200, 30);
                ctx.stroke();
            } catch (e) {}
        }

        // Baslik - BEYAZ ve PEMBE
        ctx.font = 'bold 30px Poppins Bold, sans-serif'; 
        ctx.fillStyle = '#ff69b4';
        ctx.textAlign = 'left';
        
        const guildName = guild.name.toUpperCase();
        ctx.fillText(guildName, 300, 95);
        
        ctx.font = '22px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('DESTEK MERKEZİ', 300, 130);

        // Icerik
        ctx.font = '17px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Kategorinizi seçerek talebinizi oluşturun.', 300, 175);

        // Ozellikler (Gorseldeki gibi sari cubuklu)
        const features = [
            'Deneyimli Yetkili Kadrosu',
            'Hızlı Dönüş Süresi',
            'Adil Çözüm Süreci'
        ];

        features.forEach((f, i) => {
            const y = 225 + (i * 40);
            // Pembe cubuk
            ctx.fillStyle = '#ff69b4';
            ctx.fillRect(300, y - 18, 4, 22);
            
            // Metin
            ctx.font = 'bold 17px Inter, sans-serif';
            ctx.fillStyle = '#ff69b4';
            ctx.fillText(f, 315, y);
        });

        // Alt Bilgi
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#555555';
        ctx.fillText(`${guild.name} • Destek Sistemi`, 300, 365);

        return canvas.toBuffer('image/png');
    }

    /**
     * Müşteri Unturned sunucuları için Canvas kartı çizer
     */
    static async createServerStatusCard(serverData, ownerUsername, ownerAvatarUrl) {
        const width = 800;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Arka plan rengi
        ctx.fillStyle = '#0a0a1a';
        roundRect(ctx, 0, 0, width, height, 30);
        ctx.fill();

        // Üst bölüm arkaplanı (Gradient)
        const headerGrad = ctx.createLinearGradient(0, 0, width, 0);
        headerGrad.addColorStop(0, '#2b5876');
        headerGrad.addColorStop(1, '#4e4376');
        ctx.fillStyle = headerGrad;
        
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(width - 30, 0);
        ctx.quadraticCurveTo(width, 0, width, 30);
        ctx.lineTo(width, 140);
        ctx.lineTo(0, 140);
        ctx.lineTo(0, 30);
        ctx.quadraticCurveTo(0, 0, 30, 0);
        ctx.fill();

        // Kenar Çizgisi (Glow efekti)
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 4;
        roundRect(ctx, 2, 2, width - 4, height - 4, 28);
        ctx.stroke();

        // Online durumu ve Ping etiketi
        const isOnline = serverData.isOnline;
        
        ctx.fillStyle = isOnline ? '#2ecc71' : '#e74c3c';
        roundRect(ctx, width - 180, 20, 150, 40, 20);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 18px ${FONT.heading}, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(isOnline ? '🟢 AKTİF' : '🔴 OFFLINE', width - 105, 47);

        // Sunucu İsmi
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = `bold 36px ${FONT.heading}, sans-serif`;
        
        let serverName = serverData.name || 'Bilinmeyen Sunucu';
        if (serverName.length > 30) serverName = serverName.substring(0, 27) + '...';
        ctx.fillText(serverName, 40, 65);

        // Sunucu IP Port (Alt başlık)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `18px ${FONT.medium}, sans-serif`;
        ctx.fillText(`IP: ${serverData.ip}:${serverData.port}`, 40, 100);

        // İstatistik Kutuları
        const drawStatBox = (x, y, icon, title, value, color) => {
            // Kutu arkaplanı
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            roundRect(ctx, x, y, 220, 140, 20);
            ctx.fill();

            // Kenarlık
            ctx.strokeStyle = `rgba(${hexToRgb(color)}, 0.3)`;
            ctx.lineWidth = 2;
            roundRect(ctx, x, y, 220, 140, 20);
            ctx.stroke();

            // İkon
            ctx.font = `40px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(icon, x + 110, y + 55);

            // Başlık
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = `14px ${FONT.medium}, sans-serif`;
            ctx.fillText(title, x + 110, y + 85);

            // Değer
            ctx.fillStyle = color;
            ctx.font = `bold 24px ${FONT.heading}, sans-serif`;
            ctx.fillText(value, x + 110, y + 115);
        };

        let playersText = serverData.isOnline ? `${serverData.players}/${serverData.maxPlayers}` : '- / -';
        let mapText = serverData.isOnline ? (serverData.map || 'Bilinmiyor') : 'Offline';
        let pingText = serverData.isOnline ? `${serverData.ping} ms` : '-';

        drawStatBox(40, 170, '👥', 'AKTİF OYUNCU', playersText, '#3498db');
        drawStatBox(290, 170, '🗺️', 'HARİTA', mapText, '#f1c40f');
        drawStatBox(540, 170, '⚡', 'GECİKME (PİNG)', pingText, '#2ecc71');

        // Alt Bilgi (Sahibi)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, height - 60, width, 60);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = `14px ${FONT.body}, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`Bu sunucu NeoPlugins müşterisi tarafından eklenmiştir.`, 40, height - 25);

        // Sahip Avatarı ve İsmi
        if (ownerAvatarUrl) {
            try {
                const buffer = await fetchAvatar(ownerAvatarUrl);
                const ownerImg = await loadImage(buffer);
                drawCircleImage(ctx, ownerImg, width - 200, height - 48, 18);
            } catch (e) {}
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 14px ${FONT.medium}, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(`Sahip: ${ownerUsername}`, width - 40, height - 25);

        return canvas.toBuffer('image/png');
    }
}

module.exports = CanvasBuilder;