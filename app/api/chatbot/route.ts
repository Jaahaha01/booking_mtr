import { NextResponse } from 'next/server';

export async function GET() {
	// ดึงข้อมูลห้องประชุมจาก API ห้องว่าง
		const res = await fetch('http://localhost:3000/api/rooms/availability', {
			cache: 'no-store'
		});
	const data = await res.json();
	let rooms = [];
	if (data?.success) {
		rooms = (data.data?.rooms || []).filter((r: any) => r.is_available || r.availability === 'ว่าง');
	} else if (Array.isArray(data)) {
		rooms = data.filter((r: any) => r.is_available || r.availability === 'ว่าง');
	}

	// สร้าง response รายชื่อ, จำนวน, รายละเอียด
	const availableRooms = rooms.map((r: any) => ({
		room_id: r.room_id ?? r.id,
		name: r.name,
		capacity: r.capacity,
		room_number: r.room_number ?? '',
		description: r.description ?? ''
	}));

	return NextResponse.json({
		count: availableRooms.length,
		rooms: availableRooms
	});
}
