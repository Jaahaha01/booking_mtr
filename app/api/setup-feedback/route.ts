import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Create feedbacks table
    await db`
      CREATE TABLE IF NOT EXISTS feedbacks (
        feedback_id SERIAL PRIMARY KEY,
        user_id INTEGER,
        booking_id INTEGER,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return NextResponse.json({ success: true, message: 'Feedback table created successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
