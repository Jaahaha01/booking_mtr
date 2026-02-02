import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		const { message } = await req.json();
		const lcMessage = message.toLowerCase();

		// 1. Fetch real-time room availability logic
		if (lcMessage.includes('ว่าง') || lcMessage.includes('available')) {
			// Get all active rooms - Handle both schema possibilities safely or fetch all and filter in JS
			// To be safe across schemas safely, let's fetch all rooms and filter in JS
			const rooms = await db`SELECT * FROM rooms`;
			const activeRooms = rooms.filter((r: any) => r.status === 'active' || r.is_active === true || r.is_active === 1);

			// Check busy rooms NOW
			const busy = await db`
        SELECT DISTINCT room_id FROM bookings 
        WHERE status = 'confirmed' 
        AND NOW() BETWEEN start AND "end"
      `;
			const busyIds = new Set(busy.map((b: any) => b.room_id));

			const availableRooms = activeRooms.filter((r: any) => !busyIds.has(r.room_id));

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

		// 2. Room recommendation based on capacity
		const capacityMatch = lcMessage.match(/(\d+)\s*คน/);
		if (capacityMatch && (lcMessage.includes('เหมาะ') || lcMessage.includes('คน'))) {
			const requiredCapacity = parseInt(capacityMatch[1]);

			// Fetch all rooms and filter in JS to handle "50 คน" (string) vs 50 (int)
			const rooms = await db`SELECT * FROM rooms`;

			const matchingRooms = rooms.filter((r: any) => {
				const isActive = r.status === 'active' || r.is_active === true || r.is_active === 1;
				if (!isActive) return false;

				// Parse capacity
				let cap = 0;
				if (typeof r.capacity === 'number') {
					cap = r.capacity;
				} else if (typeof r.capacity === 'string') {
					// Extract number from string like "50 คน"
					const match = r.capacity.match(/(\d+)/);
					cap = match ? parseInt(match[1]) : 0;
				}
				return cap >= requiredCapacity;
			}).sort((a: any, b: any) => {
				// Sort by capacity ASC
				const getCap = (r: any) => typeof r.capacity === 'number' ? r.capacity : parseInt(r.capacity?.toString().match(/(\d+)/)?.[1] || '0');
				return getCap(a) - getCap(b);
			}).slice(0, 3);

			if (matchingRooms.length > 0) {
				const bestRoom = matchingRooms[0];
				return NextResponse.json({
					reply: `สำหรับ ${requiredCapacity} ท่าน ขอแนะนำ "${bestRoom.name}" ครับ (รองรับได้สูงสุด ${bestRoom.capacity} คน)\n\n` +
						`อุปกรณ์: ${bestRoom.equipment || bestRoom.description || 'โปรเจคเตอร์, ไวท์บอร์ด'}`
				});
			} else {
				return NextResponse.json({
					reply: `ขออภัยครับ ทางเราไม่มีห้องที่รองรับจำนวน ${requiredCapacity} ท่านได้`
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
