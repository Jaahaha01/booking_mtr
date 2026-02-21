import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. User Booking Stats
        const refinedStatsRows = await db`
      SELECT
        status,
        cancelled_by,
        COUNT(*)::text as count
      FROM bookings
      WHERE user_id = ${userId}
      GROUP BY status, cancelled_by
    `;

        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        let cancelled = 0;

        refinedStatsRows.forEach((row: any) => {
            const count = parseInt(row.count);
            total += count;
            if (row.status === 'pending') pending += count;
            if (row.status === 'confirmed') approved += count;
            if (row.status === 'cancelled') {
                if (String(row.cancelled_by) === String(userId)) {
                    cancelled += count;
                } else {
                    rejected += count;
                }
            }
        });

        // 2. Real-time Room Availability
        // Get all active rooms
        const rooms = await db`SELECT room_id, name, capacity, status FROM rooms WHERE status = 'active' ORDER BY room_id ASC`;

        // Check if booked NOW
        const busyRoomsRows = await db`
      SELECT DISTINCT room_id
      FROM bookings
      WHERE status = 'confirmed'
      AND NOW() >= start AND NOW() <= "end"
    `;
        const busyRoomIds = new Set(busyRoomsRows.map((r: any) => r.room_id));

        const roomStatus = rooms.map((r: any) => ({
            room_id: r.room_id,
            name: r.name,
            capacity: r.capacity,
            is_available: !busyRoomIds.has(r.room_id)
        }));

        // 3. Recent Bookings (Limit 5)
        // Only fetch necessary fields
        const recentBookings = await db`
      SELECT
        b.booking_id,
        b.title,
        b.start,
        b.end,
        b.status,
        b.cancelled_by,
        r.name as room_name
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
      LIMIT 5
    `;

        // 4. User's Most Frequently Booked Rooms (Top 3)
        const frequentRooms = await db`
      SELECT 
        r.room_id,
        r.name,
        r.capacity,
        COUNT(*)::int as booking_count
      FROM bookings b
      JOIN rooms r ON b.room_id = r.room_id
      WHERE b.user_id = ${userId}
      AND b.status IN ('confirmed', 'pending')
      GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
      LIMIT 3
    `;

        return NextResponse.json({
            stats: { total, pending, approved, rejected, cancelled },
            rooms: roomStatus,
            recentBookings: recentBookings.map((b: any) => ({
                booking_id: b.booking_id,
                title: b.title,
                start: b.start,
                end: b.end,
                status: b.status,
                room_name: b.room_name,
                cancelled_by: b.cancelled_by
            })),
            frequentRooms: frequentRooms.map((r: any) => ({
                room_id: r.room_id,
                name: r.name,
                capacity: r.capacity,
                booking_count: r.booking_count
            }))
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
