import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get Room Stats for Pie Chart (Bookings per room) - use name as label
        const roomStats = await db`
        SELECT r.name, COUNT(b.booking_id)::int as value
        FROM rooms r
        LEFT JOIN bookings b ON r.room_id = b.room_id AND b.status = 'confirmed'
        GROUP BY r.room_id, r.name
        ORDER BY value DESC
    `;

        // 2. Monthly Stats: bookings per month (current month)
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const monthlyBookings = await db`
        SELECT COUNT(*)::int as bookings
        FROM bookings
        WHERE status = 'confirmed'
        AND start AT TIME ZONE 'Asia/Bangkok' >= ${monthStart.toISOString()}::timestamp
        AND start AT TIME ZONE 'Asia/Bangkok' <= ${monthEnd.toISOString()}::timestamp
    `;

        const monthlyUsers = await db`
        SELECT COUNT(DISTINCT user_id)::int as users
        FROM bookings
        WHERE status = 'confirmed'
        AND start AT TIME ZONE 'Asia/Bangkok' >= ${monthStart.toISOString()}::timestamp
        AND start AT TIME ZONE 'Asia/Bangkok' <= ${monthEnd.toISOString()}::timestamp
    `;

        // 3. Weekly Stats: bookings this week (Mon-Sun, Thai time)
        // Get the Monday of the current week in Thai time
        const weeklyBookings = await db`
        SELECT COUNT(*)::int as bookings
        FROM bookings
        WHERE status = 'confirmed'
        AND DATE(start AT TIME ZONE 'Asia/Bangkok') >= DATE(date_trunc('week', NOW() AT TIME ZONE 'Asia/Bangkok'))
        AND DATE(start AT TIME ZONE 'Asia/Bangkok') <= DATE(NOW() AT TIME ZONE 'Asia/Bangkok')
    `;

        const weeklyUsers = await db`
        SELECT COUNT(DISTINCT user_id)::int as users
        FROM bookings
        WHERE status = 'confirmed'
        AND DATE(start AT TIME ZONE 'Asia/Bangkok') >= DATE(date_trunc('week', NOW() AT TIME ZONE 'Asia/Bangkok'))
        AND DATE(start AT TIME ZONE 'Asia/Bangkok') <= DATE(NOW() AT TIME ZONE 'Asia/Bangkok')
    `;

        // Weekly daily breakdown
        const weeklyDaily = await db`
        SELECT TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'Dy') as name,
               DATE(start AT TIME ZONE 'Asia/Bangkok') as date,
               COUNT(*)::int as bookings
        FROM bookings
        WHERE status = 'confirmed'
        AND DATE(start AT TIME ZONE 'Asia/Bangkok') >= DATE(date_trunc('week', NOW() AT TIME ZONE 'Asia/Bangkok'))
        AND DATE(start AT TIME ZONE 'Asia/Bangkok') <= DATE((date_trunc('week', NOW() AT TIME ZONE 'Asia/Bangkok') + INTERVAL '6 days'))
        GROUP BY TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'Dy'), DATE(start AT TIME ZONE 'Asia/Bangkok')
        ORDER BY DATE(start AT TIME ZONE 'Asia/Bangkok')
    `;

        // 4. Daily Stats: bookings today (Thai time) - hourly breakdown
        const dailyBookings = await db`
        SELECT COUNT(*)::int as bookings
        FROM bookings
        WHERE status = 'confirmed'
        AND DATE(start AT TIME ZONE 'Asia/Bangkok') = DATE(NOW() AT TIME ZONE 'Asia/Bangkok')
    `;

        const dailyUsers = await db`
        SELECT COUNT(DISTINCT user_id)::int as users
        FROM bookings
        WHERE status = 'confirmed'
        AND DATE(start AT TIME ZONE 'Asia/Bangkok') = DATE(NOW() AT TIME ZONE 'Asia/Bangkok')
    `;

        const dailyHourly = await db`
        SELECT EXTRACT(HOUR FROM start AT TIME ZONE 'Asia/Bangkok')::int as hour, COUNT(*)::int as bookings
        FROM bookings
        WHERE status = 'confirmed' AND DATE(start AT TIME ZONE 'Asia/Bangkok') = DATE(NOW() AT TIME ZONE 'Asia/Bangkok')
        GROUP BY EXTRACT(HOUR FROM start AT TIME ZONE 'Asia/Bangkok')
        ORDER BY hour
    `;

        // 5. Monthly chart breakdown (days of the current month)
        const monthlyDaily = await db`
        SELECT EXTRACT(DAY FROM start AT TIME ZONE 'Asia/Bangkok')::int as day, COUNT(*)::int as bookings
        FROM bookings
        WHERE status = 'confirmed'
        AND EXTRACT(YEAR FROM start AT TIME ZONE 'Asia/Bangkok') = EXTRACT(YEAR FROM NOW() AT TIME ZONE 'Asia/Bangkok')
        AND EXTRACT(MONTH FROM start AT TIME ZONE 'Asia/Bangkok') = EXTRACT(MONTH FROM NOW() AT TIME ZONE 'Asia/Bangkok')
        GROUP BY EXTRACT(DAY FROM start AT TIME ZONE 'Asia/Bangkok')
        ORDER BY day
    `;

        // 6. Feedback Stats
        let feedbackStats = { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
        try {
            const fb = await db`SELECT rating FROM feedbacks`;
            if (fb.length > 0) {
                const sum = fb.reduce((a: any, b: any) => a + b.rating, 0);
                const avg = sum / fb.length;
                const dist = [0, 0, 0, 0, 0];
                fb.forEach((f: any) => {
                    if (f.rating >= 1 && f.rating <= 5) dist[f.rating - 1]++;
                });
                feedbackStats = { average: parseFloat(avg.toFixed(1)), total: fb.length, distribution: dist };
            }
        } catch (e) {
            // Table probably doesn't exist, ignore
        }

        // 7. General Counts
        const counts = await db`
        SELECT 
            (SELECT COUNT(*)::int FROM users) as total_users,
            (SELECT COUNT(*)::int FROM bookings) as total_bookings,
            (SELECT COUNT(*)::int FROM users WHERE verification_status = 'pending') as pending_users,
            (SELECT COUNT(*)::int FROM bookings WHERE status = 'pending') as pending_bookings
    `;

        // 8. Historical Monthly Stats (last 12 months, for the bottom section)
        const historicalMonthly = await db`
        SELECT 
            TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM') as month,
            TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'Mon YYYY') as label,
            COUNT(*)::int as bookings,
            COUNT(DISTINCT user_id)::int as unique_users
        FROM bookings
        WHERE status = 'confirmed'
        AND start AT TIME ZONE 'Asia/Bangkok' >= (NOW() AT TIME ZONE 'Asia/Bangkok' - INTERVAL '12 months')
        GROUP BY TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM'),
                 TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'Mon YYYY')
        ORDER BY month ASC
    `;

        // 9. Historical Monthly Stats per Room (last 12 months)
        const historicalByRoom = await db`
        SELECT 
            TO_CHAR(b.start AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM') as month,
            r.name as room_name,
            COUNT(*)::int as bookings
        FROM bookings b
        JOIN rooms r ON b.room_id = r.room_id
        WHERE b.status = 'confirmed'
        AND b.start AT TIME ZONE 'Asia/Bangkok' >= (NOW() AT TIME ZONE 'Asia/Bangkok' - INTERVAL '12 months')
        GROUP BY TO_CHAR(b.start AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM'), r.name
        ORDER BY month ASC
    `;

        return NextResponse.json({
            success: true,
            // Per-period stats
            monthly: {
                bookings: monthlyBookings[0]?.bookings || 0,
                users: monthlyUsers[0]?.users || 0,
                chart: monthlyDaily.map((d: any) => ({ name: `${d.day}`, bookings: d.bookings }))
            },
            weekly: {
                bookings: weeklyBookings[0]?.bookings || 0,
                users: weeklyUsers[0]?.users || 0,
                chart: weeklyDaily.map((d: any) => ({ name: d.name, bookings: d.bookings }))
            },
            daily: {
                bookings: dailyBookings[0]?.bookings || 0,
                users: dailyUsers[0]?.users || 0,
                chart: dailyHourly.map((d: any) => ({ name: `${d.hour}:00`, bookings: d.bookings }))
            },
            charts: {
                rooms: roomStats,
            },
            feedbacks: feedbackStats,
            counts: counts[0],
            // Historical section (independent from top filters)
            historical: {
                monthly: historicalMonthly,
                byRoom: historicalByRoom
            }
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
