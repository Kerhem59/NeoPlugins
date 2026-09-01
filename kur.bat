@echo off
chcp 65001 >nul
color 0B
cls
title Neo Bots Kurulum Paneli

echo ======================================================
echo             NEO BOTS KURULUM PANELÄ°
echo ======================================================
echo.
echo Sistem kontrol ediliyor...
timeout /t 1 >nul

:: Node.js kontrolu
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js bulunamadi! Kurulum yapilabilmesi icin Node.js gereklidir.
    echo [i] Indirmek icin: https://nodejs.org/
    echo.
    pause
    exit
)

echo [âœ“] Node.js bulundu. Menuye geciliyor...
timeout /t 1 >nul

:menu
cls
echo ======================================================
echo             NEO BOTS KURULUM PANELÄ°
echo ======================================================
echo.
echo Lutfen yapmak istediginiz islemi secin:
echo.
echo [1] Temel Kurulum (Eksik Paketleri Yukler)
echo [2] Temiz Kurulum (Bozuk Paketleri Siler, Sifirdan Kurar)
echo [3] Bot Kontrol Paneline Don (baslat.bat)
echo [4] Cikis
echo.
set /p secim="Seciminiz (1-4): "

if "%secim%"=="1" goto temel_kurulum
if "%secim%"=="2" goto temiz_kurulum
if "%secim%"=="3" goto ana_menu
if "%secim%"=="4" goto cikis
echo Gecersiz secim! Lutfen tekrar deneyin.
timeout /t 2 >nul
goto menu

:temel_kurulum
cls
echo ======================================================
echo             TEMEL KURULUM BASLATILIYOR
echo ======================================================
echo.
echo Paketler kuruluyor lutfen bekleyin...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [!] Kurulum sirasinda bir hata olustu!
    pause
    goto menu
)
echo.
echo [âœ“] Kurulum basariyla tamamlandi!
pause
goto menu

:temiz_kurulum
cls
echo ======================================================
echo             TEMIZ KURULUM BASLATILIYOR
echo ======================================================
echo.
echo Eski 'node_modules' klasoru siliniyor...
if exist node_modules (
    rmdir /s /q node_modules
    echo [âœ“] node_modules silindi.
)

if exist package-lock.json (
    del package-lock.json
    echo [âœ“] package-lock.json silindi.
)
echo.
echo Paketler sifirdan kuruluyor lutfen bekleyin...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [!] Kurulum sirasinda bir hata olustu!
    pause
    goto menu
)
echo.
echo [âœ“] Temiz kurulum basariyla tamamlandi!
pause
goto menu

:ana_menu
if exist baslat.bat (
    call baslat.bat
) else (
    echo [!] baslat.bat bulunamadi!
    pause
    goto menu
)

:cikis
exit
