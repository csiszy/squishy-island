@echo off
rem Starts Squishy Island's server on this Windows computer and shows the address to type on the phone.
rem Needs Docker Desktop. Stop it again with stop-server.bat
cd /d "%~dp0"
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo Docker did not start the server. Is Docker Desktop running?
  pause
  exit /b 1
)
echo.
echo Squishy Island's server is running.
echo On the phone (test build): DEV - More... - Server... and type the IPv4 address below:
ipconfig | findstr /i "IPv4"
echo.
echo Accounts and saves (web page): http://localhost:7351  (admin / squishy-local)
pause
