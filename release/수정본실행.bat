@echo off
chcp 65001 >nul
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 LTS 이상을 설치해 주세요.
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
echo 전체 수정본: http://localhost:3200
call npm run remaster
pause
