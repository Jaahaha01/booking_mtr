# คำแนะนำการตั้งค่า Turso (SQLite Cloud) สำหรับ Vercel

## 1. สร้างบัญชี Turso
- เข้าเว็บไซต์ https://turso.tech
- สมัครสมาชิกฟรี

## 2. ติดตั้ง Turso CLI
```bash
npm install -g @tursodatabase/turso-cli
```

## 3. เข้าสู่ระบบและสร้าง Database
```bash
# เข้าสู่ระบบ
turso auth login

# สร้าง database
turso db create booking-db

# สร้าง token สำหรับ Vercel
turso db tokens create booking-db
```

## 4. นำเข้าข้อมูลจาก MySQL
```bash
# สร้างไฟล์ SQLite จาก MySQL dump
# (ต้องแปลง SQL syntax จาก MySQL เป็น SQLite)

# หรือสร้างตารางใหม่ใน Turso
turso db shell booking-db < create_tables.sql
```

## 5. ตั้งค่า Environment Variables ใน Vercel
```
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## 6. ทดสอบการเชื่อมต่อ
```bash
# ทดสอบใน local
npm run dev

# ดู logs ใน Vercel หลัง deploy
```

## ✅ ข้อดีของ Turso:
- **ฟรี**: 500 databases, 1GB storage
- **ง่าย**: ไม่ต้องจัดการ SSL หรือ connection ยากๆ
- **รวดเร็ว**: SQLite ที่ optimize สำหรับ cloud
- **เข้ากันได้**: ใช้ SQLite syntax เดิม

## 📝 หมายเหตุ:
- Turso ใช้ SQLite syntax ไม่ใช่ MySQL
- ต้องปรับ SQL queries เล็กน้อย (เช่น `AUTO_INCREMENT` → `AUTOINCREMENT`)
- Vercel จะ deploy ได้ทันทีหลังตั้งค่าเสร็จ</content>
<parameter name="filePath">d:\Learning\PJ1-CP\booking_meetingroom - Main\TURSO_SETUP.md