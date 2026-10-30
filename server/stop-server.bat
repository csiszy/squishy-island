@echo off
rem Stops Squishy Island's server (its saved data stays for next time).
cd /d "%~dp0"
docker compose down
pause
