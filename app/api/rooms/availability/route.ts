// app/api/rooms/availability/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RoomRow = {
  room_id: number;
  name: string;
  room_number: string;
  capacity: string | null;
  equipment: string | null;
  description: string | null;
  status: "active" | "inactive" | "maintenance";
  created_at: Date;
  updated_at: Date;
};

type BookingRow = {
  room_id: number;
  title: string;
  start: Date | string;
  end: Date | string;
  status: "confirmed" | "pending" | "cancelled";
};

export async function GET() {
  try {
    // 1) ห้องที่ active ทั้งหมด พร้อมคะแนนเฉลี่ย
    const rooms = await db`
      SELECT 
        r.room_id, 
        r.name, 
        r.room_number,
        r.capacity, 
        r.description, 
        r.status,
        r.created_at,
        r.updated_at,
        COALESCE(AVG(f.rating), 0) as rating,
        COUNT(f.feedback_id) as review_count
      FROM rooms r
      LEFT JOIN bookings b ON r.room_id = b.room_id
      LEFT JOIN feedbacks f ON b.booking_id = f.booking_id
      WHERE r.status = 'active'
      GROUP BY r.room_id
      ORDER BY r.name ASC
    `;

    // 2) ดึงการจองที่ status = 'confirmed' ที่เวลาซ้อนกับปัจจุบัน (ห้องไม่ว่าง)
    const overlapped = await db`
      SELECT room_id, title, start, "end", status
      FROM bookings
      WHERE status = 'confirmed'
        AND start <= NOW()
        AND "end" > NOW()
    `;

    // 3) ดึงการจองที่ status = 'confirmed' ทั้งหมด (สำหรับ currentBooking ในอนาคตด้วย)
    const allConfirmed = await db`
      SELECT room_id, title, start, "end", status
      FROM bookings
      WHERE status = 'confirmed'
    `;

    // ทำแผนที่ room_id -> booking ปัจจุบัน (ห้องไม่ว่าง)
    const currentMap = new Map<number, BookingRow>();
    overlapped.forEach((b: any) => {
      if (!currentMap.has(b.room_id)) currentMap.set(b.room_id, b as BookingRow);
    });

    // ทำแผนที่ room_id -> booking confirmed ล่าสุด (สำหรับ currentBooking)
    const confirmedMap = new Map<number, BookingRow>();
    allConfirmed.forEach((b: any) => {
      // ถ้าไม่มี หรืออันนี้ใหม่กว่า ให้ใช้
      const prev = confirmedMap.get(b.room_id);
      if (!prev || new Date(b.start) > new Date(prev.start)) confirmedMap.set(b.room_id, b as BookingRow);
    });

    // 4) จัดรูปข้อมูลให้ตรงกับหน้าตา UI
    const uiRooms = rooms.map(r => {
      const cur = currentMap.get(r.room_id);
      const lastConfirmed = confirmedMap.get(r.room_id);

      // Mock images based on room name or id for "icon or picture" requirement
      // In a real app, this should come from DB or storage
      const roomImages = [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1517502886379-060d03db861c?auto=format&fit=crop&q=80&w=1000",
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000"
      ];
      const imageIndex = (r.room_id - 1) % roomImages.length;

      return {
        room_id: r.room_id,
        name: r.name,
        room_number: r.room_number,
        capacity: r.capacity ?? "",
        equipment: r.equipment ?? "",
        description: r.description ?? "",
        rating: parseFloat(r.rating).toFixed(1),
        review_count: parseInt(r.review_count),
        image: roomImages[imageIndex],
        availability: cur ? ("ไม่ว่าง" as const) : ("ว่าง" as const),
        ...(lastConfirmed
          ? {
            currentBooking: {
              title: lastConfirmed.title,
              start: new Date(lastConfirmed.start).toISOString(),
              end: new Date(lastConfirmed.end).toISOString(),
            },
          }
          : {}),
      };
    });

    const totalRooms = uiRooms.length;
    const occupiedRooms = uiRooms.filter(r => r.availability === "ไม่ว่าง").length;
    const availableRooms = totalRooms - occupiedRooms;

    return NextResponse.json({
      success: true,
      data: {
        checkedAt: new Date().toISOString(),
        totalRooms,
        availableRooms,
        occupiedRooms,
        rooms: uiRooms,
      },
    });
  } catch (error: any) {
    console.error("Error fetching rooms with availability:", error);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องประชุม" },
      { status: 500 }
    );
  }
}
