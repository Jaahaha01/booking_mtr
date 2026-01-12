import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ตรวจสอบสิทธิ์ admin หรือ staff
    const userRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const user = userRows?.[0];
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ดึงสถิติต่างๆ
    const [
      totalUsersResult,
      totalBookingsResult,
      totalRoomsResult,
      pendingVerificationsResult,
      approvedUsersResult,
      pendingBookingsResult,
      confirmedBookingsResult
    ] = await Promise.all([
      db`SELECT COUNT(*) as count FROM users`,
      db`SELECT COUNT(*) as count FROM bookings`,
      db`SELECT COUNT(*) as count FROM rooms`,
      db`SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'`,
      db`SELECT COUNT(*) as count FROM users WHERE verification_status = 'approved'`,
      db`SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`,
      db`SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'`
    ]);

    const stats = {
      totalUsers: totalUsersResult[0].count,
      totalBookings: totalBookingsResult[0].count,
      totalRooms: totalRoomsResult[0].count,
      pendingVerifications: pendingVerificationsResult[0].count,
      approvedUsers: approvedUsersResult[0].count,
      pendingBookings: pendingBookingsResult[0].count,
      confirmedBookings: confirmedBookingsResult[0].count
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
