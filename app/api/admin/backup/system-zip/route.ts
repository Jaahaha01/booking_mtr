import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // ให้เวลาสำหรับ ZIP ไฟล์ใหญ่

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

// โฟลเดอร์และไฟล์ที่จะไม่รวมใน ZIP
const EXCLUDE_PATTERNS = [
    'node_modules',
    '.next',
    '.git',
    '.vercel',
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
    '.env*.local',
    'coverage',
    'build',
    'out',
    '.DS_Store',
    '*.pem',
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log',
    '.pnpm-debug.log',
    '*.tsbuildinfo',
];

function shouldExclude(relativePath: string): boolean {
    const baseName = path.basename(relativePath);
    const parts = relativePath.split(path.sep);

    for (const pattern of EXCLUDE_PATTERNS) {
        // ตรวจ exact match กับ folder/file name
        if (baseName === pattern) return true;
        if (parts.includes(pattern)) return true;

        // ตรวจ glob patterns เบื้องต้น
        if (pattern.startsWith('*.') && baseName.endsWith(pattern.slice(1))) return true;
        if (pattern.startsWith('.env') && baseName.startsWith('.env')) return true;
    }
    return false;
}

function addDirectoryToArchive(archive: archiver.Archiver, dirPath: string, baseDir: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (shouldExclude(relativePath)) continue;

        if (entry.isDirectory()) {
            addDirectoryToArchive(archive, fullPath, baseDir);
        } else if (entry.isFile()) {
            try {
                archive.file(fullPath, { name: relativePath });
            } catch {
                // ข้ามไฟล์ที่อ่านไม่ได้
            }
        }
    }
}

export async function POST(request: NextRequest) {
    const adminId = await verifyAdmin();
    if (!adminId) {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    try {
        // รูท directory ของโปรเจค
        const projectRoot = process.cwd();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `backup_system_${timestamp}.zip`;

        // สร้าง ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 6 }, // ระดับการบีบอัด (0-9)
        });

        const chunks: Buffer[] = [];

        // เก็บ chunks ไว้ใน memory
        archive.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });

        const archiveEndPromise = new Promise<void>((resolve, reject) => {
            archive.on('end', resolve);
            archive.on('error', reject);
        });

        // เพิ่มไฟล์ทั้งหมดในโปรเจค
        addDirectoryToArchive(archive, projectRoot, projectRoot);

        // Finalize archive
        archive.finalize();

        // รอให้ archive เสร็จ
        await archiveEndPromise;

        // รวม chunks เป็น Buffer เดียว
        const zipBuffer = Buffer.concat(chunks);
        const fileSizeBytes = zipBuffer.length;
        const fileSize = fileSizeBytes > 1024 * 1024
            ? `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
            : `${(fileSizeBytes / 1024).toFixed(2)} KB`;

        // บันทึก log (ไม่เก็บเนื้อหา ZIP ในฐานข้อมูลเพราะใหญ่เกินไป)
        try {
            await db`
                INSERT INTO backup_logs (file_name, file_size, file_url, status, created_by)
                VALUES (${fileName}, ${fileSize}, ${'[ZIP_FILE]'}, ${'success'}, ${parseInt(adminId)})
            `;
        } catch (logError) {
            console.error('Error saving backup log:', logError);
        }

        // ส่ง ZIP file กลับ
        return new NextResponse(zipBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': fileSizeBytes.toString(),
            },
        });
    } catch (error) {
        console.error('Error creating system ZIP backup:', error);

        // บันทึก log ที่ล้มเหลว
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            await db`
                INSERT INTO backup_logs (file_name, file_size, file_url, status, created_by)
                VALUES (${'backup_system_failed_' + timestamp + '.zip'}, ${'0'}, ${''}, ${'failed'}, ${parseInt(adminId)})
            `;
        } catch { }

        return NextResponse.json({ error: 'Failed to create system ZIP backup' }, { status: 500 });
    }
}
