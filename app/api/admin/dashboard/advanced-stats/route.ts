import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Get Room Stats for Pie Chart (Bookings per room)
        const roomStats = await db`
        SELECT r.name, COUNT(b.booking_id) as value
        FROM rooms r
        LEFT JOIN bookings b ON r.room_id = b.room_id AND b.status = 'confirmed'
        GROUP BY r.room_id
    `;

        // 2. Get Booking Trends (Last 6 months)
        // Use Asia/Bangkok timezone
        const monthlyStats = await db`
        SELECT TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM') as name, COUNT(*) as bookings
        FROM bookings
        WHERE status = 'confirmed'
        GROUP BY TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')
        ORDER BY name DESC
        LIMIT 6
    `;

        // 3. Weekly Stats (Last 7 days)
        const weeklyStats = await db`
        SELECT TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'Dy') as name, COUNT(*) as bookings
        FROM bookings
        WHERE status = 'confirmed' AND start > NOW() - INTERVAL '7 days'
        GROUP BY TO_CHAR(start AT TIME ZONE 'Asia/Bangkok', 'Dy'), DATE(start AT TIME ZONE 'Asia/Bangkok')
        ORDER BY DATE(start AT TIME ZONE 'Asia/Bangkok')
    `;

        // 4. Daily Breakdown (Today's hours distribution)
        const dailyStats = await db`
        SELECT EXTRACT(HOUR FROM start AT TIME ZONE 'Asia/Bangkok') as hour, COUNT(*) as bookings
        FROM bookings
        WHERE status = 'confirmed' AND DATE(start AT TIME ZONE 'Asia/Bangkok') = DATE(NOW() AT TIME ZONE 'Asia/Bangkok')
        GROUP BY EXTRACT(HOUR FROM start AT TIME ZONE 'Asia/Bangkok')
        ORDER BY hour
    `;

        // 5. Feedback Stats
        // Check if table exists first to avoid error if user hasn't run setup
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

        // 6. General Counts
        const counts = await db`
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM bookings) as total_bookings,
            (SELECT COUNT(*) FROM users WHERE verification_status = 'pending') as pending_users,
            (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings
    `;

        return NextResponse.json({
            success: true,
            charts: {
                rooms: roomStats,
                monthly: monthlyStats.reverse(), // Show oldest first left to right
                weekly: weeklyStats,
                daily: dailyStats.map((d: any) => ({ name: `${d.hour}:00`, bookings: parseInt(d.bookings) }))
            },
            feedbacks: feedbackStats,
            counts: counts[0]
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
