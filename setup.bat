@echo off
echo ===================================
echo StrumSense Setup Script
echo ===================================
echo.

echo [1/4] Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node dependencies
    pause
    exit /b 1
)
echo ✓ Node.js dependencies installed
echo.

echo [2/4] Installing Python dependencies...
pip install librosa numpy scipy
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    echo Make sure Python 3.8+ is installed and in your PATH
    pause
    exit /b 1
)
echo ✓ Python dependencies installed
echo.

echo [3/4] Creating necessary directories...
if not exist "uploads" mkdir uploads
if not exist "data" mkdir data
echo ✓ Directories created
echo.

echo [4/4] Setup complete!
echo.
echo ===================================
echo Next Steps:
echo ===================================
echo 1. Add your OpenAI API key to .env.local
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo ===================================
echo.
pause
