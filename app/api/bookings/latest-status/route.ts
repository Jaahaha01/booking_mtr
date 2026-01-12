import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ดึง booking ล่าสุดของ user ที่ status เป็น confirmed หรือ cancelled
    const rows = await db`
      SELECT booking_id, status, title, created_at FROM bookings WHERE user_id = ${userId} AND status IN ('confirmed', 'cancelled') ORDER BY created_at DESC LIMIT 1
    `;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ latest: null });
    }
    const latest = rows[0];
    return NextResponse.json({ latest });
  } catch (error) {
    console.error("Error fetching latest booking status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
