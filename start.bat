@echo off
echo Starting College Bus System...

start cmd /k "cd server && npm start"

echo.
echo Application is running! 
echo Open your browser to: http://localhost:5000
echo.
echo Use these credentials to login:
echo Admin: admin@college.edu / password123
