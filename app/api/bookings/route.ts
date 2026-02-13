import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from 'next/headers';
import { sendPushMessage } from "@/lib/line";

export const dynamic = 'force-dynamic';

// GET - ดึงข้อมูลการจองทั้งหมด
export async function GET() {
  try {
    const rows = await db`
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
    `;

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
    await db`
      UPDATE bookings SET status = 'cancelled', cancelled_by = ${userId}, notes = CONCAT(COALESCE(notes, ''), '\n[Auto-cancelled: หมดเวลาจอง]')
      WHERE user_id = ${userId} AND status = 'pending' AND "end" < NOW()
    `;
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
    // ใช้เพื่อแสดงใน LINE (แต่ข้อมูลจริงใน DB เก็บยังไงขึ้นอยู่กับ setup)
    // ตรงนี้น่าจะรับค่ามาเป็น string แบบ local time อยู่แล้ว (จาก Frontend)
    // เช่น "2026-02-15T13:00" -> "2026-02-15 13:00:00"
    const start = toDateTimeString(rawStart);
    const end = toDateTimeString(rawEnd);

    // Helper for beautiful Thai date in notification
    // Assuming 'dateStr' comes in as 'YYYY-MM-DD HH:mm:ss' (local time) OR 'YYYY-MM-DDTHH:mm...'
    // If it is 'YYYY-MM-DD HH:mm:ss', new Date() might treat it as local time or UTC depending on environment.
    // Given the previous code manually stripped 'T', let's be careful.
    const formatThaiDate = (dateStr: string) => {
      // If dateStr is "2026-02-14 08:00:00", new Date() in Node might interpret as local system time.
      // But Vercel server time is UTC. So 08:00 becomes 08:00 UTC.
      // Then .toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) converts 08:00 UTC -> 15:00 BKK (+7).
      // ERROR: The user input "08:00" IS ALREADY BKK TIME (conceptually).

      // FIX: We must tell Date that this string IS ALREADY offset +07:00 if it lacks offset.
      // OR better, since we know dateStr is the raw input from frontend (likely with T),
      // let's look at rawStart/rawEnd again.

      let d = new Date(dateStr);
      // Check if d is valid
      if (isNaN(d.getTime())) return dateStr;

      // If the input was "2026-02-14T08:00", Vercel (UTCEnv) sees 08:00 UTC.
      // Displaying this as BKK (+7) makes it 15:00. This is WRONG if user meant 08:00 BKK.

      // If frontend sends "2026-02-14T08:00" measuring Local Time... 
      // We should treat "08:00" as the intended display time.

      // Quick Fix: Format the date using the UTC components directly to avoid timezone shifting,
      // effectively treating the input date as "Neutral/Floating" time which is what we want to display.

      const year = d.getFullYear(); // e.g. 2026
      const month = d.getMonth(); // 0-11
      const day = d.getDate();
      const hour = d.getHours();
      const minute = d.getMinutes();

      // This Date object 'd' is created from input. If input was '...T08:00', 
      // d.getHours() is 8 (in local env) or 8 (in UTC env if ISO string).
      // Wait, if environment is UTC, new Date('...T08:00') -> 08:00 UTC.

      // We want to format it as Thai Date strings manually to preserve the numbers.
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];

      // Add 543 for Thai year
      return `${day} ${thaiMonths[month]} ${year + 543} เวลา ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };
    console.log('DEBUG booking overlap check:', { start, end });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!title || !room_id || !start || !end) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าผู้ใช้ยืนยันตัวตนแล้วหรือไม่
    const userData = await db`
      SELECT verification_status FROM users WHERE user_id = ${userId}
    `;

    if (userData[0]?.verification_status !== 'approved') {
      return NextResponse.json(
        { error: 'คุณต้องยืนยันตัวตนก่อนจึงจะสามารถจองห้องประชุมได้' },
        { status: 403 }
      );
    }


    // ตรวจสอบว่าผู้ใช้จองห้องนี้ในช่วงเวลาซ้อนทับหรือไม่ (pending/confirmed เท่านั้น)
    const overlapBookings = await db`
      SELECT booking_id, status FROM bookings
      WHERE user_id = ${userId} AND room_id = ${room_id}
        AND status IN ('pending', 'confirmed')
        AND (
          (start < ${end} AND "end" > ${start}) OR
          (start < ${start} AND "end" > ${end}) OR
          (start >= ${start} AND "end" <= ${end})
        )
    `;

    if (overlapBookings.length > 0) {
      return NextResponse.json(
        { error: 'คุณมีการจองห้องนี้ในช่วงเวลาซ้อนทับ กรุณาตรวจสอบสถานะการจองของคุณ' },
        { status: 409 }
      );
    }


    // ตรวจสอบว่าห้องว่างในช่วงเวลาที่ต้องการจองหรือไม่ (pending หรือ confirmed ห้ามจองซ้ำ)
    const conflictingBookings = await db`
      SELECT booking_id FROM bookings
      WHERE room_id = ${room_id}
        AND status IN ('pending', 'confirmed')
        AND (
          (start < ${end} AND "end" > ${start}) OR
          (start < ${start} AND "end" > ${end}) OR
          (start >= ${start} AND "end" <= ${end})
        )
    `;

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: 'ห้องประชุมนี้มีคำขอจองในช่วงเวลานั้นแล้ว กรุณาเลือกเวลาอื่น' },
        { status: 409 }
      );
    }

    // ตรวจสอบการจองซ้อนกับตารางเรียน
    // แปลง start/end เป็นวันและเวลา
    const bookingDate = new Date(start);
    const daysOfWeek = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const bookingDay = daysOfWeek[bookingDate.getDay()];
    let bookingStartTime = start.substring(11, 19); // "HH:mm:ss"
    let bookingEndTime = end.substring(11, 19);
    // ปรับรูปแบบเวลาให้เป็น HH:mm:ss เสมอ
    if (bookingStartTime.length === 5) bookingStartTime += ':00';
    if (bookingEndTime.length === 5) bookingEndTime += ':00';
    console.log('DEBUG schedule overlap check:', { bookingDay, bookingStartTime, bookingEndTime });

    // ตรวจสอบกับ room_schedules (logic ทับซ้อนแบบเดียวกับ booking)
    const conflictingSchedules = await db`
      SELECT * FROM room_schedules
      WHERE room_id = ${room_id} AND day_of_week = ${bookingDate.getDay()}
        AND (
          start_time < ${bookingEndTime} AND end_time > ${bookingStartTime}
        )
    `;

    if (conflictingSchedules.length > 0) {
      return NextResponse.json(
        { error: 'ห้องนี้มีการเรียนการสอนในช่วงเวลานี้ กรุณาเลือกวัน/เวลาอื่นหรือห้องอื่น' },
        { status: 409 }
      );
    }

    // สร้างการจองใหม่ (สถานะ pending)
    // Add +07 offset for Thailand time when saving to DB to ensure TIMESTAMPTZ is correct
    const dbStart = `${start}+07`;
    const dbEnd = `${end}+07`;

    const result = await db`
      INSERT INTO bookings (title, room_id, user_id, start, "end", status, attendees, notes)
      VALUES (${title}, ${room_id}, ${userId}, ${dbStart}, ${dbEnd}, 'pending', ${attendees}, ${notes})
      RETURNING booking_id
    `;

    // ดึงข้อมูลการจองที่เพิ่งสร้าง
    const newBooking = await db`
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
        u.lname,
        u.line_user_id
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ${result[0].booking_id}
    `;

    const response = NextResponse.json({
      message: 'ส่งคำขอจองห้องประชุมสำเร็จ กรุณารอการอนุมัติจากเจ้าหน้าที่',
      booking: newBooking[0]
    });

    // Send LINE Notification
    if (newBooking[0]?.line_user_id) {
      const bookingInfo = newBooking[0];
      const message = `แจ้งเตือนการจองห้องประชุม\n\n` +
        `คุณได้ส่งคำขอจองห้อง: ${bookingInfo.room_name}\n` +
        `หัวข้อ: ${bookingInfo.title}\n` +
        `เวลา: ${formatThaiDate(rawStart)} - ${formatThaiDate(rawEnd)}\n\n` +
        `สถานะ: 🟡 รออนุมัติ\n` +
        `กรุณารอการตรวจสอบจากเจ้าหน้าที่`;

      // Don't await this, let it run in background
      // Use setImmediate or just fire and forget but ensure import is valid
      sendPushMessage(bookingInfo.line_user_id, message).catch(console.error);
    }

    return response;

  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการจองห้องประชุม' },
      { status: 500 }
    );
  }
}
