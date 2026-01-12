'use server';

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from 'next/headers';

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
        b.booking_id,
        b.title,
        b.start,
        b.end,
        b.status,
        b.attendees,
        b.notes,
        b.created_at,
        r.name as room_name,
        r.capacity as room_capacity,
        (u.fname || ' ' || u.lname) as user_name,
        u.email as user_email,
        (SELECT (u2.fname || ' ' || u2.lname) FROM users u2 WHERE u2.user_id = b.confirmed_by) as confirmed_name,
        (SELECT (u3.fname || ' ' || u3.lname) FROM users u3 WHERE u3.user_id = b.cancelled_by) as cancelled_name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      JOIN users u ON b.user_id = u.user_id
      ORDER BY b.created_at DESC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง' },
      { status: 500 }
    );
  }
}
