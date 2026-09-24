@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8080

echo.
echo  MONARCH BOUTIQUE
echo  http://localhost:%PORT%/
echo  Админка: http://localhost:%PORT%/vault.html
echo  Чтобы остановить — закройте это окно
echo.

where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/index.html"
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>&1
if %errorlevel%==0 (
  python -c "import http.server" >nul 2>&1
  if %errorlevel%==0 (
    start "" "http://localhost:%PORT%/index.html"
    python -m http.server %PORT%
    goto :eof
  )
)

start "" "http://localhost:%PORT%/index.html"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port %PORT%
