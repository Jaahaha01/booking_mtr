import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// POST: รีเซ็ตรหัสผ่านผู้ใช้ (admin only)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('user_id')?.value;
    const { id: userId } = await params;

    if (!adminId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // ตรวจสอบสิทธิ์ admin หรือ staff
        const adminRows = await db`SELECT role FROM users WHERE user_id = ${adminId}`;
        const admin = adminRows?.[0];
        if (!admin || (admin.role !== 'admin' && admin.role !== 'staff')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ตรวจสอบว่า user เป้าหมายมีอยู่จริง
        const userRows = await db`SELECT user_id, username, fname, lname, role FROM users WHERE user_id = ${userId}`;
        const targetUser = userRows?.[0];
        if (!targetUser) {
            return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
        }

        // ป้องกัน reset admin
        if (targetUser.role === 'admin') {
            return NextResponse.json({ error: 'ไม่สามารถรีเซ็ตรหัสผ่านผู้ดูแลระบบได้' }, { status: 403 });
        }
        // staff ไม่สามารถ reset staff/admin
        if (admin.role === 'staff' && (targetUser.role === 'staff' || targetUser.role === 'admin')) {
            return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่านเจ้าหน้าที่หรือผู้ดูแลระบบ' }, { status: 403 });
        }

        const body = await req.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
        }

        // เข้ารหัสรหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // อัปเดตรหัสผ่าน
        await db`UPDATE users SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}`;

        return NextResponse.json({
            success: true,
            message: `รีเซ็ตรหัสผ่านของ ${targetUser.fname} ${targetUser.lname} สำเร็จ`,
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' }, { status: 500 });
    }
}
