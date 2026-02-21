import { NextRequest, NextResponse } from 'next/server';
import { db, dbTransaction } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// ตรวจสอบสิทธิ์ admin
async function verifyAdmin() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) return null;

    const userRows = await db`SELECT role FROM users WHERE user_id = ${userId}`;
    const user = userRows?.[0];
    if (!user || user.role !== 'admin') return null;
    return userId;
}

// POST: กู้คืนข้อมูลจากไฟล์สำรอง (ใช้ Transaction — ถ้าล้มเหลวจะ rollback ทั้งหมด)
export async function POST(request: NextRequest) {
    const adminId = await verifyAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { backup, tables } = body;

        // ตรวจสอบโครงสร้างไฟล์สำรอง
        if (!backup || !backup.metadata) {
            return NextResponse.json({ error: 'ไฟล์สำรองไม่ถูกต้อง: ไม่พบ metadata' }, { status: 400 });
        }

        if (!backup.database) {
            return NextResponse.json({ error: 'ไฟล์สำรองไม่ถูกต้อง: ไม่พบข้อมูลฐานข้อมูล (database)' }, { status: 400 });
        }

        const dbData = backup.database;
        const results: any = { restored: [], skipped: [], errors: [] };

        // ลำดับการกู้คืน (ตาม foreign key dependencies)
        const restoreOrder = ['rooms', 'users', 'room_schedules', 'bookings', 'feedbacks'];

        // ===== ใช้ Transaction — ถ้าอะไรพังทั้งหมดจะ rollback กลับ =====
        await dbTransaction(async (txQuery) => {

            for (const table of restoreOrder) {
                // ข้ามถ้าไม่ได้เลือกตารางนี้
                if (tables && tables.length > 0 && !tables.includes(table)) {
                    results.skipped.push(table);
                    continue;
                }

                const data = dbData[table];
                if (!data || !Array.isArray(data) || data.length === 0) {
                    results.skipped.push(table);
                    continue;
                }

                if (table === 'rooms') {
                    await txQuery`DELETE FROM room_schedules`;
                    await txQuery`DELETE FROM feedbacks`;
                    await txQuery`DELETE FROM bookings`;
                    await txQuery`DELETE FROM rooms`;

                    for (const row of data) {
                        await txQuery`
                            INSERT INTO rooms (room_id, name, room_number, capacity, description, status, created_at, updated_at)
                            VALUES (${row.room_id}, ${row.name}, ${row.room_number}, ${row.capacity}, ${row.description || null}, ${row.status || 'active'}, ${row.created_at || new Date().toISOString()}, ${row.updated_at || new Date().toISOString()})
                            ON CONFLICT (room_id) DO UPDATE SET
                                name = EXCLUDED.name,
                                room_number = EXCLUDED.room_number,
                                capacity = EXCLUDED.capacity,
                                description = EXCLUDED.description,
                                status = EXCLUDED.status
                        `;
                    }
                    results.restored.push({ table: 'rooms', count: data.length });
                }

                if (table === 'users') {
                    // ดึงข้อมูล admin ปัจจุบัน เพื่อเช็ค username/email
                    const adminRows = await txQuery`SELECT user_id, username, email FROM users WHERE user_id = ${parseInt(adminId)}`;
                    const currentAdmin = adminRows?.[0];

                    // ลบ user ทั้งหมดยกเว้น admin ปัจจุบัน
                    await txQuery`DELETE FROM users WHERE user_id != ${parseInt(adminId)}`;

                    // placeholder password กรณีไฟล์ backup เก่าที่ไม่ได้เก็บ password
                    const placeholderPassword = '$2b$10$placeholder000000000000000000000000000000000000000';

                    let restoredCount = 0;
                    for (const row of data) {
                        // ข้าม admin ปัจจุบัน (เช็คทั้ง user_id, username, email)
                        if (String(row.user_id) === String(adminId)) continue;
                        if (currentAdmin && row.username === currentAdmin.username) continue;
                        if (currentAdmin && row.email === currentAdmin.email) continue;

                        const userPassword = row.password || placeholderPassword;
                        await txQuery`
                            INSERT INTO users (user_id, username, password, email, phone, fname, lname, identity_card, address, organization, verification_status, role, image, created_at, updated_at)
                            VALUES (${row.user_id}, ${row.username}, ${userPassword}, ${row.email}, ${row.phone || null}, ${row.fname}, ${row.lname}, ${row.identity_card || null}, ${row.address || null}, ${row.organization || null}, ${row.verification_status || null}, ${row.role || 'user'}, ${row.image || null}, ${row.created_at || new Date().toISOString()}, ${row.updated_at || new Date().toISOString()})
                            ON CONFLICT (user_id) DO UPDATE SET
                                username = EXCLUDED.username,
                                password = EXCLUDED.password,
                                email = EXCLUDED.email,
                                phone = EXCLUDED.phone,
                                fname = EXCLUDED.fname,
                                lname = EXCLUDED.lname,
                                role = EXCLUDED.role,
                                verification_status = EXCLUDED.verification_status,
                                image = EXCLUDED.image
                        `;
                        restoredCount++;
                    }
                    const hasPasswords = data.some((r: any) => r.password);
                    results.restored.push({ table: 'users', count: restoredCount, note: hasPasswords ? 'ไม่รวม admin ปัจจุบัน, กู้คืนรหัสผ่านแล้ว' : 'ไม่รวม admin ปัจจุบัน, ผู้ใช้ต้องตั้งรหัสผ่านใหม่' });
                }

                if (table === 'room_schedules') {
                    await txQuery`DELETE FROM room_schedules`;

                    for (const row of data) {
                        await txQuery`
                            INSERT INTO room_schedules (schedule_id, room_id, day_of_week, start_time, end_time, subject)
                            VALUES (${row.schedule_id}, ${row.room_id}, ${row.day_of_week || null}, ${row.start_time || null}, ${row.end_time || null}, ${row.subject || null})
                            ON CONFLICT (schedule_id) DO UPDATE SET
                                room_id = EXCLUDED.room_id,
                                day_of_week = EXCLUDED.day_of_week,
                                start_time = EXCLUDED.start_time,
                                end_time = EXCLUDED.end_time,
                                subject = EXCLUDED.subject
                        `;
                    }
                    results.restored.push({ table: 'room_schedules', count: data.length });
                }

                if (table === 'bookings') {
                    await txQuery`DELETE FROM feedbacks`;
                    await txQuery`DELETE FROM bookings`;

                    for (const row of data) {
                        await txQuery`
                            INSERT INTO bookings (booking_id, title, room_id, user_id, start, "end", status, confirmed_by, cancelled_by, attendees, notes, created_at, updated_at)
                            VALUES (${row.booking_id}, ${row.title}, ${row.room_id}, ${row.user_id}, ${row.start}, ${row.end}, ${row.status || 'confirmed'}, ${row.confirmed_by || null}, ${row.cancelled_by || null}, ${row.attendees || null}, ${row.notes || null}, ${row.created_at || new Date().toISOString()}, ${row.updated_at || new Date().toISOString()})
                            ON CONFLICT (booking_id) DO UPDATE SET
                                title = EXCLUDED.title,
                                room_id = EXCLUDED.room_id,
                                user_id = EXCLUDED.user_id,
                                start = EXCLUDED.start,
                                "end" = EXCLUDED."end",
                                status = EXCLUDED.status
                        `;
                    }
                    results.restored.push({ table: 'bookings', count: data.length });
                }

                if (table === 'feedbacks') {
                    await txQuery`DELETE FROM feedbacks`;

                    for (const row of data) {
                        await txQuery`
                            INSERT INTO feedbacks (feedback_id, booking_id, rating, comment, image_url, created_at)
                            VALUES (${row.feedback_id}, ${row.booking_id || null}, ${row.rating}, ${row.comment || null}, ${row.image_url || null}, ${row.created_at || new Date().toISOString()})
                            ON CONFLICT (feedback_id) DO UPDATE SET
                                rating = EXCLUDED.rating,
                                comment = EXCLUDED.comment
                        `;
                    }
                    results.restored.push({ table: 'feedbacks', count: data.length });
                }
            }
        });

        // บันทึก log (นอก transaction)
        try {
            const restoredTables = results.restored.map((r: any) => r.table).join(', ');
            await db`
                INSERT INTO backup_logs (file_name, file_size, file_url, status, created_by)
                VALUES (${'restore_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}, ${restoredTables}, ${''}, ${'restored'}, ${parseInt(adminId)})
            `;
        } catch { }

        return NextResponse.json({
            success: true,
            results,
        });
    } catch (error: any) {
        console.error('Error restoring backup:', error);

        // บันทึก log ที่ล้มเหลว
        try {
            await db`
                INSERT INTO backup_logs (file_name, file_size, file_url, status, created_by)
                VALUES (${'restore_failed_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}, ${'error'}, ${''}, ${'failed'}, ${parseInt(adminId)})
            `;
        } catch { }

        return NextResponse.json({
            error: 'การกู้คืนล้มเหลว ข้อมูลเดิมไม่ถูกเปลี่ยนแปลง (rollback แล้ว): ' + (error.message || 'Unknown error')
        }, { status: 500 });
    }
}
