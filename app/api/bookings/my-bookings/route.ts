'use server';

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน' },
        { status: 401 }
      );
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
        (SELECT u2.fname || ' ' || u2.lname FROM users u2 WHERE u2.user_id = b.confirmed_by) as confirmed_name,
        (SELECT u3.fname || ' ' || u3.lname FROM users u3 WHERE u3.user_id = b.cancelled_by) as cancelled_name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง' },
      { status: 500 }
    );
  }
}
