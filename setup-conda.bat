@echo off
echo ===================================
echo StrumSense Setup Script (Conda)
echo ===================================
echo.

echo [1/5] Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node dependencies
    pause
    exit /b 1
)
echo ✓ Node.js dependencies installed
echo.

echo [2/5] Creating conda environment 'strumsense' with Python 3.11...
call conda create -n strumsense python=3.11 -y
if %errorlevel% neq 0 (
    echo ERROR: Failed to create conda environment
    echo Make sure Anaconda or Miniconda is installed
    pause
    exit /b 1
)
echo ✓ Conda environment created
echo.

echo [3/5] Installing Python audio analysis libraries...
call conda run -n strumsense pip install librosa numpy scipy
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo ✓ Python dependencies installed
echo.

echo [4/5] Creating necessary directories...
if not exist "uploads" mkdir uploads
if not exist "data" mkdir data
echo ✓ Directories created
echo.

echo [5/5] Testing Python environment...
call conda run -n strumsense python --version
echo.

echo ===================================
echo Setup Complete!
echo ===================================
echo.
echo Next Steps:
echo ===================================
echo 1. Add your OpenAI API key to .env.local
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo ===================================
echo.
echo The app will use the 'strumsense' conda environment
echo automatically for audio analysis.
echo.
pause
