import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const roomId = url.searchParams.get('room_id');

    // ถ้ามี room_id ให้กรองตามห้องนั้น
    let query = 'SELECT * FROM room_schedules';
    const params: any[] = [];
    if (roomId) {
      query += ' WHERE room_id = ?';
      params.push(roomId);
    }

    const [rows] = await db.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    let details = '';
    if (error instanceof Error) {
      details = error.message;
    } else if (typeof error === 'string') {
      details = error;
    } else {
      details = 'Unknown error';
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล', details }, { status: 500 });
  }
}
