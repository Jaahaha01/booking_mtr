import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { setAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // 1. ดึงข้อมูลผู้ใช้จากฐานข้อมูล
  const rows = await db`SELECT * FROM users WHERE username = ${username}`;

  const user = rows[0];

  if (!user) {
    console.log("❌ ไม่พบบัญชีผู้ใช้นี้");
    return NextResponse.json({ message: "ไม่พบบัญชีผู้ใช้นี้" }, { status: 401 });
  }

  // 2. ตรวจสอบรหัสผ่าน
  console.log("🔑 Input password:", password);
  console.log("🔐 Hashed from DB:", user.password);

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  console.log("✅ Password match:", isPasswordCorrect);

  if (!isPasswordCorrect) {
    return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }



  // 4. สร้าง response และตั้งค่า cookie
  const response = NextResponse.json({
    message: "เข้าสู่ระบบสำเร็จ",
    user: {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      phone: user.phone,
      verification_status: user.verification_status,
      identity_card: user.identity_card,
      address: user.address,
      organization: user.organization,
    },
  });

  // ตั้งค่า cookie สำหรับ authentication
  await setAuth(user.user_id.toString());

  return response;
}
