@echo off
chcp 65001 >nul
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 LTS 이상을 먼저 설치하세요.
  pause
  exit /b 1
)
if not exist node_modules\three\package.json (
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo 브라우저에서 http://localhost:3100 을 여세요. 종료: Ctrl+C
call npm run preview
pause
