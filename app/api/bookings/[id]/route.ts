import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Adjust the path below if your db file is elsewhere
import { db } from "@/lib/db";
import { cookies } from 'next/headers';

// GET - ดึงข้อมูลการจองเฉพาะ (await params version)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);
    const [rows]: any = await db.query(
      `
      SELECT 
        b.booking_id, 
        b.title, 
        b.start, 
        b.end, 
        b.status,
        b.attendees,
        b.notes,
        b.created_at,
        b.updated_at,
        r.room_id as room_id,
        r.name as room_name,
        r.capacity,
  u.user_id as user_id,
        u.username,
        u.fname,
        u.lname,
        u.email,
  (SELECT CONCAT(u2.fname, ' ', u2.lname) FROM users u2 WHERE u2.user_id = b.confirmed_by) as confirmed_name,
  (SELECT CONCAT(u3.fname, ' ', u3.lname) FROM users u3 WHERE u3.user_id = b.cancelled_by) as cancelled_name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
  JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ?
    `,
      [bookingId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลการจอง' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง' },
      { status: 500 }
    );
  }
}

// PUT - อัปเดตข้อมูลการจอง (await params version)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);
    const body = await req.json();
    const { title, attendees, notes } = body;
    await db.query(
      'UPDATE bookings SET title = ?, attendees = ?, notes = ? WHERE booking_id = ?',
      [title, attendees, notes, bookingId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตการจอง' },
      { status: 500 }
    );
  }
}

// DELETE - ลบการจอง (await params version)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = parseInt(id);
  await db.query('DELETE FROM bookings WHERE booking_id = ?', [bookingId]);
    return NextResponse.json({ message: 'ลบการจองสำเร็จ' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบการจอง' },
      { status: 500 }
    );
  }
}
