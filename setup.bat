@echo off
chcp 65001 >nul
echo 🚀 เริ่มการติดตั้งระบบจองห้องประชุม...

REM ตรวจสอบ Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ไม่พบ Node.js กรุณาติดตั้ง Node.js ก่อน
    pause
    exit /b 1
)

echo ✅ Node.js พบแล้ว

REM ตรวจสอบ npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ไม่พบ npm กรุณาติดตั้ง npm ก่อน
    pause
    exit /b 1
)

echo ✅ npm พบแล้ว

REM ตรวจสอบ MySQL
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ไม่พบ MySQL กรุณาติดตั้ง MySQL ก่อน
    pause
    exit /b 1
)

echo ✅ MySQL พบแล้ว

REM ติดตั้ง dependencies
echo 📦 ติดตั้ง dependencies...
npm install

REM สร้างไฟล์ .env.local ถ้ายังไม่มี
if not exist .env.local (
    echo 📝 สร้างไฟล์ .env.local...
    copy env.example .env.local
    echo ⚠️  กรุณาแก้ไขไฟล์ .env.local ให้ตรงกับการตั้งค่าฐานข้อมูลของคุณ
)

echo.
echo 🔍 กรุณาใส่ข้อมูลการเชื่อมต่อฐานข้อมูล:
set /p db_host="MySQL Host (default: localhost): "
if "%db_host%"=="" set db_host=localhost

set /p db_user="MySQL User (default: root): "
if "%db_user%"=="" set db_user=root

set /p db_password="MySQL Password: "

set /p db_name="Database Name (default: booking_db): "
if "%db_name%"=="" set db_name=booking_db

echo.
echo 🗄️  สร้างฐานข้อมูลและตาราง...
mysql -h "%db_host%" -u "%db_user%" -p"%db_password%" -e "CREATE DATABASE IF NOT EXISTS %db_name%;"
mysql -h "%db_host%" -u "%db_user%" -p"%db_password%" "%db_name%" < database.sql

echo ✅ สร้างฐานข้อมูลและตารางเรียบร้อย

echo.
echo 🎉 การติดตั้งเสร็จสิ้น!
echo.
echo 📋 ข้อมูลเข้าสู่ระบบ:
echo    ผู้ดูแลระบบ: admin / admin123
echo    ผู้ใช้ทั่วไป: user1 / user123 หรือ user2 / user123
echo.
echo 🚀 เริ่มใช้งาน:
echo    npm run dev
echo.
echo 🌐 เปิดเบราว์เซอร์ไปที่: http://localhost:3000
echo.
echo 📚 ดูเอกสารเพิ่มเติมได้ที่: README.md
echo.
pause
