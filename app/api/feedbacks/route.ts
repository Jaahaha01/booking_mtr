import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const feedbacks = await db`
      SELECT f.*, u.fname, u.lname, r.name as room_name, b.title as booking_title
      FROM feedbacks f
      LEFT JOIN bookings b ON f.booking_id = b.booking_id
      LEFT JOIN users u ON b.user_id = u.user_id
      LEFT JOIN rooms r ON b.room_id = r.room_id
      ORDER BY f.created_at DESC
    `;

        // Map to structure expected by frontend
        const formattedFeedbacks = feedbacks.map((f: any) => ({
            ...f,
            user: {
                fname: f.fname,
                lname: f.lname
            }
        }));

        return NextResponse.json({ success: true, feedbacks: formattedFeedbacks });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
