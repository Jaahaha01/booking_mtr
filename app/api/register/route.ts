import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const {
    username,
    password,
    email,
    phone,
    fname,
    lname,
  } = await req.json();

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!username || !password || !email || !phone || !fname || !lname) {
    return NextResponse.json(
      { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
      { status: 400 }
    );
  }

  // ตรวจสอบความยาวรหัสผ่าน
  if (password.length < 6) {
    return NextResponse.json(
      { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
      { status: 400 }
    );
  }

  // ตรวจสอบรูปแบบอีเมล
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { message: "รูปแบบอีเมลไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  // ตรวจสอบรูปแบบเบอร์โทร
  const phoneRegex = /^[0-9-+\s()]+$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json(
      { message: "รูปแบบเบอร์โทรไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  try {
    // เช็ก username หรือ email ซ้ำ
    const [check]: any = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    
    if (check.length > 0) {
      return NextResponse.json(
        { message: "มีชื่อผู้ใช้หรืออีเมลนี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // เพิ่มข้อมูลลงฐานข้อมูล โดยยังไม่ยืนยันตัวตน
    await db.query(
      `INSERT INTO users 
      (username, password, email, phone, fname, lname, role)
      VALUES (?, ?, ?, ?, ?, ?, 'user')`,
      [
        username,
        hashedPassword,
        email,
        phone,
        fname,
        lname
      ]
    );

    return NextResponse.json({ 
      message: "สมัครสมาชิกเรียบร้อย กรุณายืนยันตัวตนเพื่อเริ่มใช้งาน" 
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 }
    );
  }
}
