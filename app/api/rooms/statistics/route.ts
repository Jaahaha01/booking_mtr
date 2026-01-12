import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get current date for filtering
  const now = new Date();
  // รับ month/year จาก query string
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');
  const currentMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
  const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
    
  // Calculate date variables
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // วันอาทิตย์แรกของสัปดาห์นี้
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // วันเสาร์สุดท้ายของสัปดาห์นี้
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);
    
  // Execute all queries
  const mostBookedRows = await db`
SELECT 
  r.room_id,
        r.name,
        r.capacity,
  COUNT(b.booking_id) as booking_count,
        COUNT(DISTINCT b.user_id) as unique_users,
        AVG(EXTRACT(EPOCH FROM (b.end - b.start))/3600) as avg_duration_hours,
        SUM(EXTRACT(EPOCH FROM (b.end - b.start))/3600) as total_hours
    FROM rooms r
  LEFT JOIN bookings b ON r.room_id = b.room_id AND b.status = 'confirmed'
  GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
`;
    
  const monthlyBookedRows = await db`
      SELECT 
  r.room_id,
        r.name,
        r.capacity,
  COUNT(b.booking_id) as booking_count,
        COUNT(DISTINCT b.user_id) as unique_users,
        AVG(EXTRACT(EPOCH FROM (b.end - b.start))/3600) as avg_duration_hours,
        SUM(EXTRACT(EPOCH FROM (b.end - b.start))/3600) as total_hours
      FROM rooms r
  LEFT JOIN bookings b ON r.room_id = b.room_id 
    AND EXTRACT(MONTH FROM b.start) = ${currentMonth} 
    AND EXTRACT(YEAR FROM b.start) = ${currentYear}
    AND b.status = 'confirmed'
  GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
`;
    
  const weeklyBookedRows = await db`
      SELECT 
        r.room_id,
        r.name,
        r.capacity,
        COUNT(b.booking_id) as booking_count,
        COUNT(DISTINCT b.user_id) as unique_users,
        SUM(EXTRACT(EPOCH FROM (b.end - b.start))/3600) as total_hours
      FROM rooms r
      LEFT JOIN bookings b ON r.room_id = b.room_id 
        AND b.start::date BETWEEN ${weekStartStr} AND ${weekEndStr} AND b.status = 'confirmed'
      GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
`;

    const dailyBookedRows = await db`
      SELECT 
        r.room_id,
        r.name,
        r.capacity,
        COUNT(b.booking_id) as booking_count,
        COUNT(DISTINCT b.user_id) as unique_users,
        SUM(EXTRACT(EPOCH FROM (b.end - b.start))/3600) as total_hours
      FROM rooms r
      LEFT JOIN bookings b ON r.room_id = b.room_id 
        AND b.start::date = ${todayStr} AND b.status = 'confirmed'
      GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
`;
    const dayOfWeekRows = await db`
      SELECT 
        to_char(b.start, 'Day') as day_name,
        COUNT(*) as booking_count,
        AVG(EXTRACT(EPOCH FROM (b.end - b.start))/3600) as avg_duration_hours
      FROM bookings b
      WHERE EXTRACT(MONTH FROM b.start) = ${currentMonth} AND EXTRACT(YEAR FROM b.start) = ${currentYear} AND b.status = 'confirmed'
      GROUP BY to_char(b.start, 'Day')
      ORDER BY CASE to_char(b.start, 'Day')
        WHEN 'Monday   ' THEN 1
        WHEN 'Tuesday  ' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday ' THEN 4
        WHEN 'Friday   ' THEN 5
        WHEN 'Saturday ' THEN 6
        WHEN 'Sunday   ' THEN 7
      END
`;
    
    const peakHoursRows = await db`
      SELECT 
        EXTRACT(HOUR FROM b.start) as hour,
        COUNT(*) as booking_count,
        COUNT(DISTINCT b.room_id) as rooms_used
      FROM bookings b
      WHERE EXTRACT(MONTH FROM b.start) = ${currentMonth} AND EXTRACT(YEAR FROM b.start) = ${currentYear} AND b.status = 'confirmed'
      GROUP BY EXTRACT(HOUR FROM b.start)
      ORDER BY hour
`;
    
    const recentBookingsRows = await db`
      SELECT 
        r.name as room_name,
        b.title,
        b.start,
        b.end,
        u.username,
        EXTRACT(EPOCH FROM (b.end - b.start))/3600 as duration_hours
      FROM bookings b
  JOIN rooms r ON b.room_id = r.room_id
  JOIN users u ON b.user_id = u.user_id
      WHERE b.start >= NOW() - INTERVAL '7 days'
      ORDER BY b.start DESC
      LIMIT 20
`;
    
    // Process results
    const statistics = {
      mostBookedRooms: mostBookedRows,
      monthlyBookedRooms: monthlyBookedRows,
      weeklyBookedRooms: weeklyBookedRows,
      dailyBookedRooms: dailyBookedRows,
      dayOfWeekTrends: dayOfWeekRows,
      peakHours: peakHoursRows,
      recentBookings: recentBookingsRows,
      generatedAt: now.toISOString(),
      currentMonth,
      currentYear
    };
    
    return NextResponse.json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    console.error('Error fetching room statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ' 
      },
      { status: 500 }
    );
  }
} 
