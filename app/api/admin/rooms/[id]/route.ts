'use server';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

/* ============================================================
   PUT - อัปเดตห้องประชุม (เฉพาะแอดมิน)
   ============================================================ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ อ่าน cookies และตรวจสอบสิทธิ์
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ await params (Next.js 15)
    const { id } = await params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
    }

    // ✅ ตรวจสอบ role
    const userRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const user = userRows?.[0];
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ รับข้อมูลจาก body
    const { name, room_number, capacity, description } = await req.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !room_number || !capacity) {
      return NextResponse.json(
        { error: "กรุณากรอกชื่อห้อง เลขห้อง และความจุ" },
        { status: 400 }
      );
    }

    // ✅ ตรวจสอบชื่อ/เลขห้องซ้ำ (ยกเว้นห้องเดิม)
    const existingRoom = await db`
      SELECT room_id FROM rooms WHERE (name = ${name} OR room_number = ${room_number}) AND room_id != ${roomId}
    `;

    if (existingRoom.length > 0) {
      return NextResponse.json(
        { error: "มีชื่อห้องหรือเลขห้องนี้อยู่แล้ว" },
        { status: 409 }
      );
    }

    // ✅ อัปเดตข้อมูลห้อง
    await db`
      UPDATE rooms
      SET name = ${name}, room_number = ${room_number}, capacity = ${capacity}, description = ${description}, updated_at = NOW()
      WHERE room_id = ${roomId}
    `;

    return NextResponse.json({ message: "อัปเดตห้องประชุมสำเร็จ" });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตห้องประชุม" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE - ลบห้องประชุม (เฉพาะแอดมิน)
   ============================================================ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ อ่าน cookies และตรวจสอบสิทธิ์
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ await params (Next.js 15)
    const { id } = await params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid room id" }, { status: 400 });
    }

    // ✅ ตรวจสอบ role
    const userRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const user = userRows?.[0];
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ ตรวจสอบว่ามีการจองที่เกี่ยวข้องอยู่หรือไม่
    const bookings = await db`
      SELECT booking_id FROM bookings WHERE room_id = ${roomId} AND status != 'cancelled'
    `;

    if (bookings.length > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบห้องประชุมได้เนื่องจากมีการจองที่เกี่ยวข้อง" },
        { status: 400 }
      );
    }

    // ✅ ลบห้องประชุม
    await db`DELETE FROM rooms WHERE room_id = ${roomId}`;

    return NextResponse.json({ message: "ลบห้องประชุมสำเร็จ" });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบห้องประชุม" },
      { status: 500 }
    );
  }
}
