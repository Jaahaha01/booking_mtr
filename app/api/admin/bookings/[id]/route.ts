import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const bookingId = Number(id);
  if (!id || isNaN(bookingId) || bookingId <= 0) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  const body = await req.json();
  const { status } = body;

  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ตรวจสอบสิทธิ์ admin หรือ staff
    const userRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const user = userRows[0];

    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ตรวจสอบสถานะ
    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // ดึงข้อมูลการจองเพื่อส่งแจ้งเตือน
    // ดึงข้อมูลการจองเพื่อส่งแจ้งเตือน (เพิ่ม room_name, user details)
    const existingBookings = await db`
      SELECT 
        b.booking_id, b.user_id, b.title, b.start, b."end", b.room_id,
        r.name as room_name,
        u.fname, u.lname
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ${bookingId}
    `;
    const booking = existingBookings[0];

    // อัปเดตสถานะและ admin/staff ที่ยืนยันหรือยกเลิก
    if (status === "confirmed") {
      await db`
        UPDATE bookings SET status = ${status}, confirmed_by = ${userId} WHERE booking_id = ${bookingId}
      `;
      // Send Notification
      if (booking) {
        // Dynamic import to avoid circular dependency or just standard usage
        try {
          // Check if user has line_user_id
          const userRes = await db`SELECT line_user_id FROM users WHERE user_id = ${booking.user_id}`;
          if (userRes[0]?.line_user_id) {
            const { sendPushMessage } = await import('@/lib/line');
            // Start is likely a Date object or timestamp from DB. Ensure it's treated as UTC then converted to BKK if needed, 
            // OR if it's already a timestamptz, just force formatting.
            // Format Start Time
            const dStart = new Date(booking.start);
            const day = dStart.getUTCDate();
            const month = dStart.getUTCMonth();
            const year = dStart.getUTCFullYear();
            const hour = dStart.getUTCHours();
            const minute = dStart.getUTCMinutes();

            // Format End Time
            const dEnd = new Date(booking.end);
            const endHour = dEnd.getUTCHours();
            const endMinute = dEnd.getUTCMinutes();

            const thaiMonths = [
              'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
              'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ];

            const dateStr = `${day} ${thaiMonths[month]} ${year + 543}`;
            const timeRange = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

            const message = `✅ การจองห้องประชุมได้รับการอนุมัติ\n` +
              `ห้อง: ${booking.room_name}\n` +
              `หัวข้อ: ${booking.title}\n` +
              `ผู้จอง: ${booking.fname} ${booking.lname}\n` +
              `ยืนยันโดย: ${user.fname} ${user.lname} (ID: ${userId})\n` +
              `เวลา: ${dateStr} เวลา ${timeRange}`;

            sendPushMessage(userRes[0].line_user_id, message).catch(console.error);
          }
        } catch (e) { console.error('Error sending line msg', e) }
      }
    } else if (status === "cancelled") {
      await db`
        UPDATE bookings SET status = ${status}, cancelled_by = ${userId} WHERE booking_id = ${bookingId}
      `;
      // Send Notification
      if (booking) {
        try {
          const userRes = await db`SELECT line_user_id FROM users WHERE user_id = ${booking.user_id}`;
          if (userRes[0]?.line_user_id) {
            const { sendPushMessage } = await import('@/lib/line');
            const message = `❌ การจองห้องประชุมถูกปฏิเสธ/ยกเลิก\nหัวข้อ: ${booking.title}`;
            sendPushMessage(userRes[0].line_user_id, message).catch(console.error);
          }
        } catch (e) { console.error('Error sending line msg', e) }
      }
    } else if (status === "pending") {
      await db`
        UPDATE bookings SET status = ${status}, confirmed_by = NULL, cancelled_by = NULL WHERE booking_id = ${bookingId}
      `;
    }

    return NextResponse.json({ success: true, confirmed_name: user.fname, cancelled_name: user.fname });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const bookingId = Number(id);
  if (!id || isNaN(bookingId) || bookingId <= 0) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  // ลบ booking และแจ้งเตือน
  try {
    const brows = await db`SELECT user_id FROM bookings WHERE booking_id = ${bookingId}`;
    const booking = brows?.[0];
    await db`DELETE FROM bookings WHERE booking_id = ${bookingId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบ booking" }, { status: 500 });
  }
}
