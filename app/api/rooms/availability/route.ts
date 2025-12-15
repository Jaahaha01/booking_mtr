// app/api/rooms/availability/route.ts
import { NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
    // 1) ห้องที่ active ทั้งหมด
    const [rooms]: any = await db.query(`
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
      WHERE status = 'active'
      ORDER BY name ASC
    `);

    // 2) ดึงการจองที่ status = 'confirmed' ที่เวลาซ้อนกับปัจจุบัน (ห้องไม่ว่าง)
    const [overlapped]: any = await db.query(`
      SELECT room_id, title, start, end, status
      FROM bookings
      WHERE status = 'confirmed'
        AND start <= NOW()
        AND end > NOW()
    `);

    // 3) ดึงการจองที่ status = 'confirmed' ทั้งหมด (สำหรับ currentBooking ในอนาคตด้วย)
    const [allConfirmed]: any = await db.query(`
      SELECT room_id, title, start, end, status
      FROM bookings
      WHERE status = 'confirmed'
    `);

    // ทำแผนที่ room_id -> booking ปัจจุบัน (ห้องไม่ว่าง)
    const currentMap = new Map<number, BookingRow>();
    (overlapped as BookingRow[]).forEach(b => {
      if (!currentMap.has(b.room_id)) currentMap.set(b.room_id, b);
    });

    // ทำแผนที่ room_id -> booking confirmed ล่าสุด (สำหรับ currentBooking)
    const confirmedMap = new Map<number, BookingRow>();
    (allConfirmed as BookingRow[]).forEach(b => {
      // ถ้าไม่มี หรืออันนี้ใหม่กว่า ให้ใช้
      const prev = confirmedMap.get(b.room_id);
      if (!prev || new Date(b.start) > new Date(prev.start)) confirmedMap.set(b.room_id, b);
    });

    // 4) จัดรูปข้อมูลให้ตรงกับหน้าตา UI (availability เป็น 'ว่าง' | 'ไม่ว่าง' + currentBooking เฉพาะ confirmed)
    const uiRooms = (rooms as RoomRow[]).map(r => {
      const cur = currentMap.get(r.room_id);
      const lastConfirmed = confirmedMap.get(r.room_id);
      return {
        room_id: r.room_id,
        name: r.name,
        room_number: r.room_number,
        capacity: r.capacity ?? "",
        equipment: r.equipment ?? "",
        description: r.description ?? "",
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

    // 4) ส่งรูปแบบ JSON ให้ตรงกับที่หน้า RoomAvailabilityPage ใช้
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
