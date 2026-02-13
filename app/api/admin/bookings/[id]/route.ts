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
    const existingBookings = await db`SELECT user_id, title, start, "end", room_id FROM bookings WHERE booking_id = ${bookingId}`;
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
            const startStr = new Date(booking.start).toLocaleString('th-TH');
            const message = `✅ การจองห้องประชุมได้รับการอนุมัติ\nหัวข้อ: ${booking.title}\nเวลา: ${startStr}`;
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
