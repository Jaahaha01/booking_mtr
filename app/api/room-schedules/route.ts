import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET(req: Request) {
  // กำหนดค่าการเชื่อมต่อฐานข้อมูล
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'booking_db',
  });

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

    const [rows] = await connection.execute(query, params);
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
  } finally {
    await connection.end();
  }
}
