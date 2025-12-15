import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import { cookies } from 'next/headers';

// GET - ดึงข้อมูลการจองทั้งหมด
export async function GET() {
  try {
    const [rows]: any = await db.query(`
      SELECT 
        b.booking_id, 
        b.title, 
        b.start, 
        b.end, 
        b.status,
        b.attendees,
        b.notes,
        b.confirmed_by,
        b.cancelled_by,
        r.name as room_name,
        r.room_number,
        r.capacity,
        u.username,
        u.fname,
        u.lname,
        uc.fname AS confirmed_fname,
        uc.lname AS confirmed_lname,
        ucan.fname AS cancelled_fname,
        ucan.lname AS cancelled_lname
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN users uc ON b.confirmed_by = uc.user_id
      LEFT JOIN users ucan ON b.cancelled_by = ucan.user_id
      ORDER BY b.start ASC
    `);

    const events = rows.map((b: any) => ({
  booking_id: b.booking_id,
      title: b.title,
      start: b.start,
      end: b.end,
      status: b.status,
      attendees: b.attendees,
      notes: b.notes,
  room_name: b.room_name,
  room_number: b.room_number,
  room_capacity: b.capacity,
      user: {
        username: b.username,
        firstname: b.fname,
        lastname: b.lname
      },
      confirmed_by: b.confirmed_by,
      confirmed_name: b.confirmed_fname ? `${b.confirmed_fname} ${b.confirmed_lname}` : null,
      cancelled_by: b.cancelled_by,
      cancelled_name: b.cancelled_fname ? `${b.cancelled_fname} ${b.cancelled_lname}` : null
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง' },
      { status: 500 }
    );
  }
}

// POST - สร้างการจองใหม่
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    // ป้องกัน user_id = 0
    if (!userId || userId === '0') {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน (user_id ไม่ถูกต้อง)' },
        { status: 401 }
      );
    }

    // Auto-reject booking ที่ pending และหมดเวลา (end < NOW())
    await db.query(`
      UPDATE bookings SET status = 'cancelled', cancelled_by = ?, notes = CONCAT(IFNULL(notes, ''), '\n[Auto-cancelled: หมดเวลาจอง]')
      WHERE user_id = ? AND status = 'pending' AND end < NOW()
    `, [userId, userId]);
    // ป้องกัน user_id = 0
    if (!userId || userId === '0') {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบก่อน (user_id ไม่ถูกต้อง)' },
        { status: 401 }
      );
    }


    const {
      title,
      room_id,
      start: rawStart,
      end: rawEnd,
      attendees,
      notes
    } = await req.json();

    // แปลง start/end เป็น YYYY-MM-DD HH:mm:ss
    function toDateTimeString(val: string) {
      if (!val) return '';
      // รองรับ T08:00 หรือ T13:00
      let d = val.replace('T', ' ');
      if (d.length === 16) d += ':00';
      return d;
    }
    const start = toDateTimeString(rawStart);
    const end = toDateTimeString(rawEnd);
    console.log('DEBUG booking overlap check:', { start, end });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title || !room_id || !start || !end) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้ยืนยันตัวตนแล้วหรือไม่
    const [userData]: any = await db.query(
  'SELECT verification_status FROM users WHERE user_id = ?',
  [userId]
    );

    if (userData[0]?.verification_status !== 'approved') {
      return NextResponse.json(
        { error: 'คุณต้องยืนยันตัวตนก่อนจึงจะสามารถจองห้องประชุมได้' },
        { status: 403 }
      );
    }


    // ตรวจสอบว่าผู้ใช้จองห้องนี้ในช่วงเวลาซ้อนทับหรือไม่ (pending/confirmed เท่านั้น)
    const [overlapBookings]: any = await db.query(`
      SELECT booking_id, status FROM bookings 
      WHERE user_id = ? AND room_id = ? 
        AND status IN ('pending', 'confirmed')
        AND (
          (start < ? AND end > ?) OR
          (start < ? AND end > ?) OR
          (start >= ? AND end <= ?)
        )
    `, [userId, room_id, end, start, start, end, start, end]);

    if (overlapBookings.length > 0) {
      return NextResponse.json(
        { error: 'คุณมีการจองห้องนี้ในช่วงเวลาซ้อนทับ กรุณาตรวจสอบสถานะการจองของคุณ' },
        { status: 409 }
      );
    }


    // ตรวจสอบว่าห้องว่างในช่วงเวลาที่ต้องการจองหรือไม่ (pending หรือ confirmed ห้ามจองซ้ำ)
    const [conflictingBookings]: any = await db.query(`
      SELECT booking_id FROM bookings 
      WHERE room_id = ? 
        AND status IN ('pending', 'confirmed')
        AND (
          (start < ? AND end > ?) OR
          (start < ? AND end > ?) OR
          (start >= ? AND end <= ?)
        )
    `, [room_id, end, start, start, end, start, end]);

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: 'ห้องประชุมนี้มีคำขอจองในช่วงเวลานั้นแล้ว กรุณาเลือกเวลาอื่น' },
        { status: 409 }
      );
    }

    // ตรวจสอบการจองซ้อนกับตารางเรียน
    // แปลง start/end เป็นวันและเวลา
    const bookingDate = new Date(start);
    const daysOfWeek = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
    const bookingDay = daysOfWeek[bookingDate.getDay()];
    let bookingStartTime = start.substring(11, 19); // "HH:mm:ss"
    let bookingEndTime = end.substring(11, 19);
    // ปรับรูปแบบเวลาให้เป็น HH:mm:ss เสมอ
    if (bookingStartTime.length === 5) bookingStartTime += ':00';
    if (bookingEndTime.length === 5) bookingEndTime += ':00';
    console.log('DEBUG schedule overlap check:', { bookingDay, bookingStartTime, bookingEndTime });

    // ตรวจสอบกับ room_schedules (logic ทับซ้อนแบบเดียวกับ booking)
    const [conflictingSchedules]: any = await db.query(`
      SELECT * FROM room_schedules
      WHERE room_id = ? AND day_of_week = ?
        AND (
          start_time < ? AND end_time > ?
        )
    `, [room_id, bookingDay, bookingEndTime, bookingStartTime]);

    if (conflictingSchedules.length > 0) {
      return NextResponse.json(
        { error: 'ห้องนี้มีการเรียนการสอนในช่วงเวลานี้ กรุณาเลือกวัน/เวลาอื่นหรือห้องอื่น' },
        { status: 409 }
      );
    }

    // สร้างการจองใหม่ (สถานะ pending)
    const [result]: any = await db.query(`
      INSERT INTO bookings (title, room_id, user_id, start, end, status, attendees, notes)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [title, room_id, userId, start, end, attendees, notes]);

    // ดึงข้อมูลการจองที่เพิ่งสร้าง
    const [newBooking]: any = await db.query(`
      SELECT 
        b.booking_id, 
        b.title, 
        b.start, 
        b.end, 
        b.status,
        b.attendees,
        b.notes,
        r.name as room_name,
        r.capacity,
        u.username,
        u.fname,
        u.lname
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ?
    `, [result.insertId]);

    return NextResponse.json({
      message: 'ส่งคำขอจองห้องประชุมสำเร็จ กรุณารอการอนุมัติจากเจ้าหน้าที่',
      booking: newBooking[0]
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการจองห้องประชุม' },
      { status: 500 }
    );
  }
}
