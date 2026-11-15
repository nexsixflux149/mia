@echo off
chcp 65001 >nul
cd /d "%~dp0.."
echo 먼저 열려 있는 수정본 서버를 종료해 주세요.
echo 테스트 닉네임은 수정본테스터 입니다.
pause
node release/unlock-test.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
call "%~dp0수정본실행.bat"
