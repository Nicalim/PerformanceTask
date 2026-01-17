@echo off
REM Serve current folder on localhost:8000 with Mongoose

SET ADDR=http://localhost:8000
SET DIR=.

echo =====================================
echo Starting Mongoose web server...
echo Serving directory: %CD%
echo Listening on %ADDR%
echo Press CTRL+C in this window to stop the server.
echo =====================================

REM Start Mongoose
start "" mongoose.exe -l %ADDR% -d %DIR%

REM Give server 2 seconds to start
timeout /t 2 /nobreak >nul

REM Open default browser
start %ADDR%
