@echo off
REM start-dev.bat - Start both frontend and backend for local development on Windows

echo.
echo ========================================
echo CricSim Pro - Local Development Startup
echo ========================================
echo.

echo [*] Attempting to stop existing Node.js processes on ports 4000 and 5173/5174...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    if %%a neq "" taskkill /PID %%a /F >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    if %%a neq "" taskkill /PID %%a /F >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174') do (
    if %%a neq "" taskkill /PID %%a /F >nul 2>nul
)
echo [*] Previous processes stopped (if any).

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed. Please install it first.
    exit /b 1
)

echo [*] Installing dependencies...
echo.

REM Install frontend dependencies
echo [+] Frontend dependencies...
call npm install

REM Install server dependencies
echo [+] Backend dependencies...
cd server
call npm install
cd ..

echo.
echo [✓] Dependencies installed!
echo.
echo [*] Starting services...
echo.

REM Start backend in new window
echo [+] Starting backend server (port 4000)...
start "CricSim Pro Backend" cmd /k "cd server && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend in new window
echo [+] Starting frontend (port 5173)...
start "CricSim Pro Frontend" cmd /k "npm run dev"

echo.
echo [✓] All services started!
echo.
echo URLs:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:4000
echo.
echo Test multiplayer:
echo   1. Open http://localhost:5173 in first browser window
echo   2. Open http://localhost:5173 in second browser window
echo   3. Click "Play Online" in both windows
echo   4. Create room in first, join in second
echo   5. Select teams and start match
echo.
echo [!] Two new command windows have opened for frontend and backend
echo [!] Close those windows to stop the services
echo.
pause
