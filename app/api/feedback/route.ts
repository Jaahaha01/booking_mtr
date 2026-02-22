import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('user_id')?.value;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { booking_id, rating, comment, image_url } = await req.json();

        if (!booking_id || !rating) {
            return NextResponse.json({ error: 'กรุณาระบุข้อมูลให้ครบถ้วน' }, { status: 400 });
        }

        // Check if feedback already exists for this booking
        const existing = await db`SELECT feedback_id FROM feedbacks WHERE booking_id = ${booking_id}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: 'คุณได้ให้คะแนนการจองนี้ไปแล้ว' }, { status: 400 });
        }

        // Reset sequence ป้องกัน duplicate key หลังจาก restore ข้อมูล
        await db`SELECT setval(pg_get_serial_sequence('feedbacks', 'feedback_id'), COALESCE((SELECT MAX(feedback_id) FROM feedbacks), 0) + 1, false)`;

        // Insert feedback
        await db`
      INSERT INTO feedbacks (booking_id, rating, comment, image_url)
      VALUES (${booking_id}, ${rating}, ${comment}, ${image_url})
    `;

        return NextResponse.json({ success: true, message: 'บันทึกความคิดเห็นสำเร็จ' });

    } catch (error) {
        console.error('Error submitting feedback:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
