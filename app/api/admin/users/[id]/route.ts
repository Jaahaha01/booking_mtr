import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function PUT(
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

    // ตรวจสอบสิทธิ์การแก้ไขตาม role ของ target user
    const targetRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const target = targetRows?.[0];
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // ไม่อนุญาตแก้ไข admin
    if (target.role === 'admin') {
      return NextResponse.json({ error: 'ไม่สามารถแก้ไขข้อมูลผู้ดูแลระบบได้' }, { status: 403 });
    }
    // staff ไม่สามารถแก้ไข staff หรือ admin
    if (admin.role === 'staff' && (target.role === 'staff' || target.role === 'admin')) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ในการแก้ไขเจ้าหน้าที่หรือผู้ดูแลระบบ' }, { status: 403 });
    }

    const body = await req.json();
    const { role, verification_status } = body;

    // อัปเดตข้อมูลผู้ใช้
    if (role !== undefined && verification_status !== undefined) {
      await db`
        UPDATE users SET role = ${role}, verification_status = ${verification_status}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}
      `;
    } else if (role !== undefined) {
      await db`
        UPDATE users SET role = ${role}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}
      `;
    } else if (verification_status !== undefined) {
      await db`
        UPDATE users SET verification_status = ${verification_status}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${userId}
      `;
    } else {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    const adminRows = await db`SELECT role FROM users WHERE user_id = ${adminId}`;
    const admin = adminRows?.[0];
    if (!admin || (admin.role !== 'admin' && admin.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ป้องกันการลบตัวเอง
    if (adminId === userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // ตรวจสอบสิทธิ์การลบตาม role ของ target user
    const targetRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const target = targetRows?.[0];
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // ไม่อนุญาตลบ admin
    if (target.role === 'admin') {
      return NextResponse.json({ error: 'ไม่สามารถลบผู้ดูแลระบบได้' }, { status: 403 });
    }
    // staff ไม่สามารถลบ staff หรือ admin
    if (admin.role === 'staff' && (target.role === 'staff' || target.role === 'admin')) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์ในการลบเจ้าหน้าที่หรือผู้ดูแลระบบ' }, { status: 403 });
    }

    // ลบการจองทั้งหมดของผู้ใช้ก่อน
    await db`DELETE FROM bookings WHERE user_id = ${userId}`;
    // ลบผู้ใช้
    await db`DELETE FROM users WHERE user_id = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
