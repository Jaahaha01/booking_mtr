import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('user_id')?.value;
  const { id: userId } = await params;
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ตรวจสอบสิทธิ์ admin หรือ staff
    const [adminRows] = await db.query(
      'SELECT role FROM users WHERE user_id = ?',
      [adminId]
    ) as any;
    const admin = adminRows?.[0];
    if (!admin || (admin.role !== 'admin' && admin.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { role, verification_status } = body;

    // อัปเดตข้อมูลผู้ใช้
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (verification_status !== undefined) {
      updateFields.push('verification_status = ?');
      updateValues.push(verification_status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updateSql = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
    updateValues.push(userId);
    await db.query(updateSql, updateValues);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('user_id')?.value;
  const { id: userId } = await params;
  
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const [adminRows] = await db.query(
      'SELECT role FROM users WHERE user_id = ?',
      [adminId]
    ) as any;
    const admin = adminRows?.[0];
    if (!admin || (admin.role !== 'admin' && admin.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ป้องกันการลบตัวเอง
    if (adminId === userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // ลบการจองทั้งหมดของผู้ใช้ก่อน
    await db.query('DELETE FROM bookings WHERE user_id = ?', [userId]);
    // ลบผู้ใช้
    await db.query('DELETE FROM users WHERE user_id = ?', [userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
