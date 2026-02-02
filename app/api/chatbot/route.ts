import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		const { message } = await req.json();
		const lcMessage = message.toLowerCase();

		// 1. Fetch real-time room availability logic
		if (lcMessage.includes('ว่าง') || lcMessage.includes('available')) {
			// Get all active rooms
			const rooms = await db`SELECT * FROM rooms WHERE is_active = true`;

			// Check busy rooms NOW
			const busy = await db`
        SELECT DISTINCT room_id FROM bookings 
        WHERE status = 'confirmed' 
        AND NOW() BETWEEN start AND "end"
      `;
			const busyIds = new Set(busy.map((b: any) => b.room_id));

			const availableRooms = rooms.filter((r: any) => !busyIds.has(r.room_id));

			if (availableRooms.length > 0) {
				return NextResponse.json({
					reply: `ขณะนี้มีห้องว่าง ${availableRooms.length} ห้องครับ:\n` +
						availableRooms.map((r: any) => `• ${r.name} (รองรับ ${r.capacity} คน)`).join('\n')
				});
			} else {
				return NextResponse.json({
					reply: `ขออภัยครับ ขณะนี้ไม่มีห้องว่างเลยครับ`
				});
			}
		}

		// 2. Room recommendation based on capacity (e.g. "เหมาะกับ 30 คน")
		const capacityMatch = lcMessage.match(/(\d+)\s*คน/);
		if (capacityMatch && (lcMessage.includes('เหมาะ') || lcMessage.includes('คน'))) {
			const requiredCapacity = parseInt(capacityMatch[1]);

			// Find rooms with capacity >= required
			const rooms = await db`
            SELECT * FROM rooms 
            WHERE is_active = true AND capacity >= ${requiredCapacity}
            ORDER BY capacity ASC
            LIMIT 3
        `;

			if (rooms.length > 0) {
				const bestRoom = rooms[0];
				return NextResponse.json({
					reply: `สำหรับ ${requiredCapacity} ท่าน ขอแนะนำ "${bestRoom.name}" ครับ (รองรับได้สูงสุด ${bestRoom.capacity} คน)\n\n` +
						`อุปกรณ์: ${bestRoom.equipment || 'โปรเจคเตอร์, ไวท์บอร์ด'}`
				});
			} else {
				return NextResponse.json({
					reply: `ขออภัยครับ ทางเราไม่มีห้องที่รองรับจำนวน ${requiredCapacity} ท่านได้ (ห้องใหญ่สุดรองรับได้สูงสุด 50 คน)`
				});
			}
		}

		// 3. General FAQ fallback
		if (lcMessage.includes('จอง')) {
			return NextResponse.json({ reply: 'คุณสามารถจองห้องได้ที่เมนู "จองห้องประชุม" ด้านบน หรือกดปุ่ม "จองห้องประชุม" ในหน้าแรกได้เลยครับ' });
		}
		if (lcMessage.includes('ประวัติ') || lcMessage.includes('สถานะ')) {
			return NextResponse.json({ reply: 'ตรวจสอบสถานะและประวัติการจองได้ที่เมนู "สถานะการจอง" ครับ' });
		}
		if (lcMessage.includes('สวัสดี') || lcMessage.includes('hi')) {
			return NextResponse.json({ reply: 'สวัสดีครับ! มีอะไรให้ผมช่วยไหมครับ? สอบถามเรื่องห้องว่างหรือแนะนำห้องประชุมได้นะ' });
		}

		// Default response
		return NextResponse.json({
			reply: 'ขออภัยครับ ผมยังไม่เข้าใจคำถาม ลองถามว่า "ห้องไหนว่างบ้าง" หรือ "ห้องสำหรับ 20 คน" ดูไหมครับ?'
		});

	} catch (error) {
		console.error('Chatbot API Error:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

// Keep GET for compatibility if needed, but return empty or instructions
export async function GET() {
	return NextResponse.json({ message: 'Please use POST method for chat.' });
}
