# คำแนะนำการตั้งค่า PlanetScale สำหรับ Vercel

## 1. สร้างบัญชี PlanetScale
- เข้าเว็บไซต์ https://planetscale.com
- สมัครสมาชิกฟรี

## 2. สร้าง Database
- คลิก "Create database"
- ตั้งชื่อ database (เช่น: booking_db)
- เลือก region ที่ใกล้เคียง (เช่น: AWS us-east-1)

## 3. เชื่อมต่อและตั้งค่า Schema
```bash
# ติดตั้ง PlanetScale CLI
npm install -g @planetscale/cli

# เข้าสู่ระบบ
pscale auth login

# สร้าง branch สำหรับ development
pscale branch create booking_db develop

# เชื่อมต่อกับ database
pscale connect booking_db develop --port 3309

# รัน SQL scripts
mysql -h 127.0.0.1 -P 3309 -u root booking_db_develop < database.sql
mysql -h 127.0.0.1 -P 3309 -u root booking_db_develop < add_room_schedules.sql
```

## 4. สร้าง Password สำหรับ Production
```bash
# สร้าง password สำหรับ production
pscale password create booking_db main app-prod
```

## 5. ตั้งค่า Environment Variables ใน Vercel
ใน Vercel Dashboard → Settings → Environment Variables:

```
DB_HOST=aws.connect.psdb.cloud
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=booking_db
DB_SSL_CA=/etc/ssl/certs/ca-certificates.crt
```

## 6. เพิ่ม SSL Config ใน lib/db.ts
```typescript
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: process.env.DB_SSL_CA
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
};
```</content>
<parameter name="filePath">d:\Learning\PJ1-CP\booking_meetingroom - Main\PLANETSCALE_SETUP.md