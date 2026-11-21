@echo off
chcp 65001 > nul
echo ========================================================
echo   🚀 اجرای کامل سامانه دیجیتال مارکتینگ گپجی + تونل
echo ========================================================
echo.
echo 1. در حال اجرای سرورهای بک‌اند و فرانت‌اند...
start "Gapji - Backend & Frontend" cmd /k "pnpm dev"
timeout /t 6 > nul

echo 2. در حال راه‌اندازی تونل دسترسی اینترنتی (Cloudflare)...
start "Gapji - Cloudflare Tunnel" cmd /k "run-tunnel.bat"

echo.
echo ========================================================
echo   ✅ سامانه‌ها با موفقیت در پنجره‌های مجزا آغاز به کار کردند
echo   - فرانت‌اند: http://localhost:3000
echo   - بک‌اند API: http://localhost:3001
echo   - لینک اینترنتی: در پنجره Cloudflare Tunnel نمایش داده شده است
echo ========================================================
echo.
