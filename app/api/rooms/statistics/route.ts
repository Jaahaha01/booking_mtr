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
    
  // Query 1: Most booked rooms (all time)
    const mostBookedQuery = `
      SELECT 
  r.room_id,
        r.name,
        r.capacity,
  COUNT(b.booking_id) as booking_count,
        COUNT(DISTINCT b.user_id) as unique_users,
        AVG(TIMESTAMPDIFF(HOUR, b.start, b.end)) as avg_duration_hours,
        SUM(TIMESTAMPDIFF(HOUR, b.start, b.end)) as total_hours
    FROM rooms r
  LEFT JOIN bookings b ON r.room_id = b.room_id AND b.status = 'confirmed'
  GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
    `;
    
  // Query 2: Most booked rooms this month
    // Query 2.1: Most booked rooms this week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // วันอาทิตย์แรกของสัปดาห์นี้
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // วันเสาร์สุดท้ายของสัปดาห์นี้
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    const weeklyBookedQuery = `
      SELECT 
        r.room_id,
        r.name,
        r.capacity,
        COUNT(b.booking_id) as booking_count,
        COUNT(DISTINCT b.user_id) as unique_users,
        SUM(TIMESTAMPDIFF(HOUR, b.start, b.end)) as total_hours
      FROM rooms r
      LEFT JOIN bookings b ON r.room_id = b.room_id 
        AND DATE(b.start) BETWEEN ? AND ? AND b.status = 'confirmed'
      GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
    `;

    // Query 2.2: Most booked rooms today
    const todayStr = now.toISOString().slice(0, 10);
    const dailyBookedQuery = `
      SELECT 
        r.room_id,
        r.name,
        r.capacity,
        COUNT(b.booking_id) as booking_count,
        COUNT(DISTINCT b.user_id) as unique_users,
        SUM(TIMESTAMPDIFF(HOUR, b.start, b.end)) as total_hours
      FROM rooms r
      LEFT JOIN bookings b ON r.room_id = b.room_id 
        AND DATE(b.start) = ? AND b.status = 'confirmed'
      GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
    `;
    const monthlyBookedQuery = `
      SELECT 
  r.room_id,
        r.name,
        r.capacity,
  COUNT(b.booking_id) as booking_count,
        COUNT(DISTINCT b.user_id) as unique_users,
        AVG(TIMESTAMPDIFF(HOUR, b.start, b.end)) as avg_duration_hours,
        SUM(TIMESTAMPDIFF(HOUR, b.start, b.end)) as total_hours
      FROM rooms r
  LEFT JOIN bookings b ON r.room_id = b.room_id 
    AND MONTH(b.start) = ? 
    AND YEAR(b.start) = ?
    AND b.status = 'confirmed'
  GROUP BY r.room_id, r.name, r.capacity
      ORDER BY booking_count DESC
    `;
    
    // Query 3: Booking trends by day of week
    const dayOfWeekQuery = `
      SELECT 
        DAYNAME(b.start) as day_name,
        COUNT(*) as booking_count,
        AVG(TIMESTAMPDIFF(HOUR, b.start, b.end)) as avg_duration_hours
      FROM bookings b
      WHERE MONTH(b.start) = ? AND YEAR(b.start) = ? AND b.status = 'confirmed'
      GROUP BY DAYNAME(b.start)
      ORDER BY FIELD(DAYNAME(b.start), 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    `;
    
    // Query 4: Peak hours analysis
    const peakHoursQuery = `
      SELECT 
        HOUR(b.start) as hour,
        COUNT(*) as booking_count,
        COUNT(DISTINCT b.room_id) as rooms_used
      FROM bookings b
      WHERE MONTH(b.start) = ? AND YEAR(b.start) = ? AND b.status = 'confirmed'
      GROUP BY HOUR(b.start)
      ORDER BY hour
    `;
    
    // Query 5: Recent bookings (last 7 days)
    const recentBookingsQuery = `
      SELECT 
        r.name as room_name,
        b.title,
        b.start,
        b.end,
        u.username,
        TIMESTAMPDIFF(HOUR, b.start, b.end) as duration_hours
      FROM bookings b
  JOIN rooms r ON b.room_id = r.room_id
  JOIN users u ON b.user_id = u.user_id
      WHERE b.start >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY b.start DESC
      LIMIT 20
    `;
    
  // Execute all queries
  const [mostBookedRows] = await db.execute(mostBookedQuery);
  const [monthlyBookedRows] = await db.execute(monthlyBookedQuery, [currentMonth, currentYear]);
  const [weeklyBookedRows] = await db.execute(weeklyBookedQuery, [weekStartStr, weekEndStr]);
  const [dailyBookedRows] = await db.execute(dailyBookedQuery, [todayStr]);
  const [dayOfWeekRows] = await db.execute(dayOfWeekQuery, [currentMonth, currentYear]);
  const [peakHoursRows] = await db.execute(peakHoursQuery, [currentMonth, currentYear]);
  const [recentBookingsRows] = await db.execute(recentBookingsQuery);
    
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
