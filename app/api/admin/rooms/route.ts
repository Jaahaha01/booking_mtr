import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from 'next/headers';

// GET - ดึงข้อมูลห้องประชุมทั้งหมด
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ตรวจสอบว่าเป็น admin หรือ staff
    const userRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const user = userRows?.[0];

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await db`
      SELECT
        room_id,
        name,
        room_number,
        capacity,
        description,
        status,
        created_at,
        updated_at
      FROM rooms
      ORDER BY name ASC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching admin rooms:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องประชุม' },
      { status: 500 }
    );
  }
}

// POST - สร้างห้องประชุมใหม่
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ตรวจสอบว่าเป็น admin หรือ staff
    const userRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const user = userRows?.[0];

    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      name,
      room_number,
      capacity,
      description
    } = await req.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !room_number || !capacity) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อห้อง เลขห้อง และความจุ' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าชื่อห้องหรือเลขห้องซ้ำหรือไม่
    const existingRoom = await db`
      SELECT room_id FROM rooms WHERE name = ${name} OR room_number = ${room_number}
    `;

    if (existingRoom.length > 0) {
      return NextResponse.json(
        { error: 'มีชื่อห้องหรือเลขห้องนี้อยู่แล้ว' },
        { status: 409 }
      );
    }

    // สร้างห้องใหม่
    const result = await db`
      INSERT INTO rooms (name, room_number, capacity, description, status)
      VALUES (${name}, ${room_number}, ${capacity}, ${description}, 'active')
      RETURNING room_id
    `;

    // ดึงข้อมูลห้องที่เพิ่งสร้าง
    const newRoom = await db`
      SELECT room_id, name, room_number, capacity, description, status, created_at
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
