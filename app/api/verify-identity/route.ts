import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      );
    }

    const { identity_card, address, organization } = await req.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!identity_card || !address || !organization) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบรูปแบบบัตรประชาชน (13 หลัก)
    if (identity_card.length !== 13 || !/^\d+$/.test(identity_card)) {
      return NextResponse.json(
        { message: 'หมายเลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าบัตรประชาชนนี้ถูกใช้แล้วหรือไม่
    const [existingUser]: any = await db.query(
      "SELECT user_id FROM users WHERE identity_card = ? AND user_id != ?",
      [identity_card, userId]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: 'หมายเลขบัตรประชาชนนี้ถูกใช้แล้ว' },
        { status: 409 }
      );
    }

    // อัปเดตข้อมูลการยืนยันตัวตน (รอการอนุมัติจากแอดมิน)
    await db.query(
      `UPDATE users 
       SET identity_card = ?, address = ?, organization = ?, verification_status = 'pending', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [identity_card, address, organization, userId]
    );

    return NextResponse.json({
      message: 'ส่งข้อมูลการยืนยันตัวตนสำเร็จ กรุณารอการอนุมัติจากเจ้าหน้าที่',
      success: true
    });

  } catch (error) {
    console.error('Error verifying identity:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในการยืนยันตัวตน' },
      { status: 500 }
    );
  }
}
