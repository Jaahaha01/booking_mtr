import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const id = cookieStore.get('user_id')?.value;
  if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db`SELECT * FROM users WHERE user_id = ${id}`;
  const user = rows?.[0];
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // ส่งข้อมูลที่จำเป็นสำหรับ frontend
  return NextResponse.json({
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    fname: user.fname,
    lname: user.lname,
    name: `${user.fname} ${user.lname}`,
    identity_card: user.identity_card,
    address: user.address,
    organization: user.organization,
    verification_status: user.verification_status,
    role: user.role,
    image: user.image,
    created_at: user.created_at,
    updated_at: user.updated_at
  });
}

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const id = cookieStore.get('user_id')?.value;
  const body = await req.json();

  await db`
    UPDATE users SET
      full_name=${body.full_name}, email=${body.email}, phone=${body.phone}, department=${body.department}
      WHERE user_id=${id}
  `;

  if (body.passwordOld && body.passwordNew) {
    const user = await db`SELECT password FROM users WHERE user_id = ${id}`;
    if (user?.[0]?.password === body.passwordOld) {
      await db`UPDATE users SET password=${body.passwordNew} WHERE user_id=${id}`;
    } else {
      return NextResponse.json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
