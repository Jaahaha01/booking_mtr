import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

// GET: ดึงข้อมูลสรุป + ประวัติการสำรอง / ดาวน์โหลด backup เก่า (?id=)
export async function GET(request: NextRequest) {
    const adminId = await verifyAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    try {
        // ถ้ามี ?id= ให้ดึงข้อมูล backup เก่าสำหรับดาวน์โหลด
        const { searchParams } = new URL(request.url);
        const backupId = searchParams.get('id');

        if (backupId) {
            const rows = await db`SELECT file_name, file_url FROM backup_logs WHERE backup_id = ${parseInt(backupId)}`;
            if (!rows || rows.length === 0) {
                return NextResponse.json({ error: 'ไม่พบข้อมูลสำรองที่ระบุ' }, { status: 404 });
            }
            if (!rows[0].file_url) {
                return NextResponse.json({ error: 'ไม่พบเนื้อหาสำรอง (file_url ว่างเปล่า)' }, { status: 404 });
            }
            try {
                const backupContent = JSON.parse(rows[0].file_url);
                return NextResponse.json({ success: true, backup: backupContent, fileName: rows[0].file_name });
            } catch (parseError) {
                console.error('Error parsing backup data:', parseError, 'Data length:', rows[0].file_url?.length, 'First 200 chars:', rows[0].file_url?.substring(0, 200));
                return NextResponse.json({ error: 'ข้อมูลสำรองเสียหาย (อาจเกิดจากข้อมูลถูกตัดเนื่องจาก column ขนาดเล็กเกินไป) กรุณาลบข้อมูลเก่าและสำรองใหม่' }, { status: 500 });
            }
        }

        // นับจำนวนข้อมูลในแต่ละตาราง
        const [usersCount, bookingsCount, roomsCount, schedulesCount, feedbacksCount] = await Promise.all([
            db`SELECT COUNT(*)::int as count FROM users`,
            db`SELECT COUNT(*)::int as count FROM bookings`,
            db`SELECT COUNT(*)::int as count FROM rooms`,
            db`SELECT COUNT(*)::int as count FROM room_schedules`,
            db`SELECT COUNT(*)::int as count FROM feedbacks`.catch(() => [{ count: 0 }]),
        ]);

        // ดึงประวัติการสำรองข้อมูลล่าสุด (ไม่รวม file_url เพราะข้อมูลใหญ่)
        const backupLogs = await db`
            SELECT bl.backup_id, bl.file_name, bl.file_size, bl.status, bl.created_by, bl.created_at,
                   u.fname, u.lname,
                   (bl.file_url IS NOT NULL AND bl.file_url != '')::boolean as has_data
            FROM backup_logs bl
            LEFT JOIN users u ON bl.created_by = u.user_id
            ORDER BY bl.created_at DESC 
            LIMIT 20
        `.catch(() => []);

        return NextResponse.json({
            success: true,
            summary: {
                users: usersCount[0]?.count || 0,
                bookings: bookingsCount[0]?.count || 0,
                rooms: roomsCount[0]?.count || 0,
                room_schedules: schedulesCount[0]?.count || 0,
                feedbacks: feedbacksCount[0]?.count || 0,
            },
            backupLogs,
            lastChecked: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching backup summary:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: สร้างไฟล์สำรองข้อมูล
export async function POST(request: NextRequest) {
    const adminId = await verifyAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { type } = body; // 'database', 'system', 'full'

        const typeLabels: Record<string, string> = {
            database: 'สำรองฐานข้อมูล',
            system: 'สำรองระบบ',
            full: 'สำรองข้อมูลทั้งหมด',
        };

        const backupData: any = {
            metadata: {
                type,
                created_at: new Date().toISOString(),
                created_by: adminId,
                version: '1.0',
                app_name: 'Meeting Room Booking System',
            },
        };

        if (type === 'database' || type === 'full') {
            // สำรองข้อมูลทุกตาราง
            const [users, bookings, rooms, schedules, feedbacks] = await Promise.all([
                db`SELECT * FROM users ORDER BY user_id`,
                db`SELECT * FROM bookings ORDER BY booking_id`,
                db`SELECT * FROM rooms ORDER BY room_id`,
                db`SELECT * FROM room_schedules ORDER BY schedule_id`,
                db`SELECT * FROM feedbacks ORDER BY feedback_id`.catch(() => []),
            ]);

            backupData.database = {
                users,
                bookings,
                rooms,
                room_schedules: schedules,
                feedbacks,
                record_counts: {
                    users: users.length,
                    bookings: bookings.length,
                    rooms: rooms.length,
                    room_schedules: schedules.length,
                    feedbacks: feedbacks.length,
                },
            };
        }

        if (type === 'system' || type === 'full') {
            // สำรองข้อมูลระบบ (การตั้งค่า, สถิติ)
            const [totalBookings, confirmedBookings, pendingBookings, cancelledBookings] = await Promise.all([
                db`SELECT COUNT(*)::int as count FROM bookings`,
                db`SELECT COUNT(*)::int as count FROM bookings WHERE status = 'confirmed'`,
                db`SELECT COUNT(*)::int as count FROM bookings WHERE status = 'pending'`,
                db`SELECT COUNT(*)::int as count FROM bookings WHERE status = 'cancelled'`,
            ]);

            const roomsList = await db`SELECT room_id, name, room_number, capacity, status FROM rooms ORDER BY room_id`;

            backupData.system = {
                statistics: {
                    total_bookings: totalBookings[0]?.count || 0,
                    confirmed_bookings: confirmedBookings[0]?.count || 0,
                    pending_bookings: pendingBookings[0]?.count || 0,
                    cancelled_bookings: cancelledBookings[0]?.count || 0,
                },
                rooms_config: roomsList,
                server_info: {
                    node_version: process.version,
                    platform: process.platform,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };
        }

        // คำนวณขนาดไฟล์
        const jsonStr = JSON.stringify(backupData, null, 2);
        const fileSizeBytes = new Blob([jsonStr]).size;
        const fileSize = fileSizeBytes > 1024 * 1024
            ? `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
            : `${(fileSizeBytes / 1024).toFixed(2)} KB`;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `backup_${type}_${timestamp}.json`;

        // บันทึก log + เก็บเนื้อหา backup ลงตาราง backup_logs เพื่อดาวน์โหลดภายหลัง
        let logSaved = false;
        try {
            await db`
                INSERT INTO backup_logs (file_name, file_size, file_url, status, created_by)
                VALUES (${fileName}, ${fileSize}, ${jsonStr}, ${'success'}, ${parseInt(adminId)})
            `;
            logSaved = true;
        } catch (logError: any) {
            console.error('Error saving backup log:', logError?.message || logError);
            // ถ้า error เกิดจาก column type เป็น VARCHAR ให้ลอง ALTER เป็น TEXT แล้ว retry
            if (logError?.message?.includes('value too long') || logError?.message?.includes('varying')) {
                try {
                    await db`ALTER TABLE backup_logs ALTER COLUMN file_url TYPE TEXT`;
                    await db`
                        INSERT INTO backup_logs (file_name, file_size, file_url, status, created_by)
                        VALUES (${fileName}, ${fileSize}, ${jsonStr}, ${'success'}, ${parseInt(adminId)})
                    `;
                    logSaved = true;
                    console.log('Auto-fixed: backup_logs.file_url changed to TEXT');
                } catch (retryError) {
                    console.error('Retry after ALTER also failed:', retryError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            backup: backupData,
            fileName,
            fileSize,
            logSaved,
        });
    } catch (error) {
        console.error('Error creating backup:', error);

        // บันทึก log ที่ล้มเหลว
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            await db`
        INSERT INTO backup_logs (file_name, file_size, file_url, status, created_by)
        VALUES (${'backup_failed_' + timestamp + '.json'}, ${'0'}, ${''}, ${'failed'}, ${parseInt(adminId)})
      `;
        } catch { }

        return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
    }
}

// DELETE: ลบประวัติการสำรองข้อมูล
export async function DELETE(request: NextRequest) {
    const adminId = await verifyAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const backupId = searchParams.get('id');

        if (!backupId) {
            return NextResponse.json({ error: 'กรุณาระบุ ID ของประวัติสำรอง' }, { status: 400 });
        }

        // ตรวจว่ามี record อยู่จริง
        const existing = await db`SELECT backup_id FROM backup_logs WHERE backup_id = ${parseInt(backupId)}`;
        if (!existing || existing.length === 0) {
            return NextResponse.json({ error: 'ไม่พบประวัติสำรองที่ระบุ' }, { status: 404 });
        }

        await db`DELETE FROM backup_logs WHERE backup_id = ${parseInt(backupId)}`;

        return NextResponse.json({ success: true, message: 'ลบประวัติสำรองข้อมูลสำเร็จ' });
    } catch (error) {
        console.error('Error deleting backup log:', error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบ' }, { status: 500 });
    }
}
