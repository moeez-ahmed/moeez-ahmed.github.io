@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py serve.py
  goto end
)
python --version >nul 2>nul
if %errorlevel%==0 (
  python serve.py
  goto end
)
echo Python was not found.
echo Install it from https://www.python.org/downloads/ and tick
echo "Add python.exe to PATH" on the first screen of the installer.
echo Or open this folder in VS Code and use the Live Server extension.
:end
pause
