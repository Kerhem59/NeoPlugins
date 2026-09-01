@echo off
chcp 65001 >nul
color 0B
title Neo Bots Kontrol Paneli

:menu
cls
echo ======================================================
echo             NEO BOTS KONTROL PANELÄ°
echo ======================================================
echo.
echo Lutfen yapmak istediginiz islemi secin:
echo.
echo [1] Botu Baslat (Otomatik Yeniden Baslatma Aktif)
echo [2] Sadece Bir Kere Baslat (Hata verirse kapanir)
echo [3] Kurulum Menusune Git (kur.bat)
echo [4] Cikis
echo.
set /p secim="Seciminiz (1-4): "

if "%secim%"=="1" goto oto_baslat
if "%secim%"=="2" goto tek_baslat
if "%secim%"=="3" goto kurulum
if "%secim%"=="4" goto cikis

echo Gecersiz secim!
timeout /t 2 >nul
goto menu

:oto_baslat
cls
echo ======================================================
echo         BOT BASLATILIYOR (OTO-YENIDEN BASLATMA)
echo ======================================================
:loop
node --dns-result-order=ipv4first --no-warnings ./src/Server.js
echo.
echo [!] Bot kapandi veya coktu. 5 saniye icinde yeniden baslatiliyor...
echo (Iptal etmek ve menuye donmek icin CTRL+C basabilirsiniz)
timeout /t 5
goto loop

:tek_baslat
cls
echo ======================================================
echo             BOT BASLATILIYOR (TEK SEFERLIK)
echo ======================================================
node --dns-result-order=ipv4first --no-warnings ./src/Server.js
echo.
echo [!] Bot kapandi. Ana menuye donuluyor...
pause
goto menu

:kurulum
if exist kur.bat (
    call kur.bat
) else (
    echo kur.bat bulunamadi!
    pause
)
goto menu

:cikis
exit

