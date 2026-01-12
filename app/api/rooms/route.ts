import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - ดึงข้อมูลห้องประชุมทั้งหมด
export async function GET() {
  try {
    const rooms = await db`
      SELECT
        room_id,
        name,
        capacity,
        description,
        status,
        created_at,
        updated_at
      FROM rooms
      WHERE status = 'active'
      ORDER BY name ASC
    `;

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องประชุม' },
      { status: 500 }
    );
  }
}

// POST - สร้างห้องประชุมใหม่ (สำหรับ admin เท่านั้น)
export async function POST(req: NextRequest) {
  try {
    const {
      name,
      capacity,
      description
    } = await req.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !capacity) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อห้องและความจุ' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าชื่อห้องซ้ำหรือไม่
    const existingRoom = await db`
      SELECT room_id FROM rooms WHERE name = ${name}
    `;

    if (existingRoom.length > 0) {
      return NextResponse.json(
        { error: 'มีชื่อห้องนี้อยู่แล้ว' },
        { status: 409 }
      );
    }

    // สร้างห้องใหม่
    const result = await db`
      INSERT INTO rooms (name, capacity, description)
      VALUES (${name}, ${capacity}, ${description})
      RETURNING room_id
    `;

    // ดึงข้อมูลห้องที่เพิ่งสร้าง
    const newRoom = await db`
      SELECT room_id, name, capacity, description, status, created_at
      FROM rooms WHERE room_id = ${result[0].room_id}
    `;

    return NextResponse.json({
      message: 'สร้างห้องประชุมสำเร็จ',
      room: newRoom[0]
    });

  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างห้องประชุม' },
      { status: 500 }
    );
  }
}
