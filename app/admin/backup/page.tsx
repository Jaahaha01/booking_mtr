'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/app/components/AdminSidebar';
import Swal from 'sweetalert2';

interface BackupSummary {
    users: number;
    bookings: number;
    rooms: number;
    room_schedules: number;
    feedbacks: number;
}

interface BackupLog {
    backup_id: number;
    file_name: string;
    file_size: string;
    status: string;
    created_by: number;
    created_at: string;
    fname?: string;
    lname?: string;
    has_data?: boolean;
}

export default function AdminBackupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<BackupSummary | null>(null);
    const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
    const [backingUp, setBackingUp] = useState<string | null>(null);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState<any>(null);
    const [restoreFileName, setRestoreFileName] = useState('');
    const [selectedTables, setSelectedTables] = useState<string[]>(['rooms', 'users', 'room_schedules', 'bookings', 'feedbacks']);
    const [downloading, setDownloading] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            const summaryRes = await fetch('/api/admin/backup');
            if (summaryRes.ok) {
                const data = await summaryRes.json();
                setSummary(data.summary);
                setBackupLogs(data.backupLogs || []);
                setLastBackup(data.lastChecked);
            }
        } catch { }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const profileRes = await fetch('/api/profile');
                if (!profileRes.ok) { router.push('/login'); return; }
                const userData = await profileRes.json();
                if (userData.role !== 'admin') { router.push('/'); return; }
                await fetchData();
            } catch {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [router]);

    const handleBackup = async (type: 'database' | 'system' | 'full') => {
        const typeLabels: Record<string, string> = {
            database: 'ฐานข้อมูล',
            system: 'ระบบ',
            full: 'ข้อมูลทั้งหมด',
        };

        const result = await Swal.fire({
            title: `สำรอง${typeLabels[type]}`,
            text: `คุณต้องการสำรอง${typeLabels[type]}หรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'สำรองข้อมูล',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            background: '#23272b',
            color: '#e5e7eb',
        });

        if (!result.isConfirmed) return;

        setBackingUp(type);
        try {
            const res = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            });

            if (!res.ok) throw new Error('Backup failed');
            const data = await res.json();

            // สร้างไฟล์ดาวน์โหลด
            const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.fileName || `backup_${type}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // รีเฟรชข้อมูล
            await fetchData();

            Swal.fire({
                title: 'สำรองข้อมูลสำเร็จ!',
                html: `<div class="text-left space-y-2">
          <p class="text-gray-300">ไฟล์: <span class="text-indigo-400 font-mono text-sm">${data.fileName}</span></p>
          <p class="text-gray-300">ขนาด: <span class="text-emerald-400">${data.fileSize}</span></p>
        </div>`,
                icon: 'success',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#6366f1',
                background: '#23272b',
                color: '#e5e7eb',
            });
        } catch {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถสำรองข้อมูลได้ กรุณาลองอีกครั้ง',
                icon: 'error',
                confirmButtonText: 'ปิด',
                confirmButtonColor: '#dc2626',
                background: '#23272b',
                color: '#e5e7eb',
            });
        } finally {
            setBackingUp(null);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setRestoreFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                if (!json.metadata || !json.database) {
                    Swal.fire({ title: 'ไฟล์ไม่ถูกต้อง', text: 'ไฟล์สำรองต้องมี metadata และ database', icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', background: '#23272b', color: '#e5e7eb' });
                    setRestoreFile(null);
                    setRestoreFileName('');
                    return;
                }
                setRestoreFile(json);
            } catch {
                Swal.fire({ title: 'ไฟล์ไม่ถูกต้อง', text: 'ไม่สามารถอ่านไฟล์ JSON ได้', icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', background: '#23272b', color: '#e5e7eb' });
                setRestoreFile(null);
                setRestoreFileName('');
            }
        };
        reader.readAsText(file);
    };

    const toggleTable = (table: string) => {
        setSelectedTables(prev => prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]);
    };

    const handleRestore = async () => {
        if (!restoreFile || selectedTables.length === 0) return;

        const step1 = await Swal.fire({
            title: '⚠️ ยืนยันการกู้คืนข้อมูล',
            html: `<div class="text-left space-y-2"><p class="text-gray-300 text-sm">ตารางที่จะกู้คืน:</p><p class="text-amber-400 font-mono text-sm">${selectedTables.join(', ')}</p><p class="text-red-400 text-xs mt-3">⚠️ ข้อมูลเดิมในตารางที่เลือกจะถูกแทนที่!</p></div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ดำเนินการต่อ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            background: '#23272b',
            color: '#e5e7eb',
        });
        if (!step1.isConfirmed) return;

        const step2 = await Swal.fire({
            title: '🔴 ยืนยันครั้งสุดท้าย',
            text: 'การกู้คืนข้อมูลไม่สามารถย้อนกลับได้ คุณแน่ใจหรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน กู้คืนเลย',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            background: '#23272b',
            color: '#e5e7eb',
        });
        if (!step2.isConfirmed) return;

        setRestoring(true);
        try {
            const res = await fetch('/api/admin/backup/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ backup: restoreFile, tables: selectedTables }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Restore failed');

            await fetchData();

            const restoredList = data.results.restored.map((r: any) => `<li class="text-emerald-400">✓ ${r.table} (${r.count} รายการ)${r.note ? ` <span class="text-gray-500 text-xs">— ${r.note}</span>` : ''}</li>`).join('');
            const errorList = data.results.errors.map((e: any) => `<li class="text-red-400">✗ ${e.table}: ${e.error}</li>`).join('');
            const skippedList = data.results.skipped.map((s: string) => `<li class="text-gray-500">— ${s} (ข้าม)</li>`).join('');

            Swal.fire({
                title: data.results.errors.length > 0 ? 'กู้คืนบางส่วนสำเร็จ' : 'กู้คืนข้อมูลสำเร็จ!',
                html: `<ul class="text-left text-sm space-y-1 mt-2">${restoredList}${errorList}${skippedList}</ul>`,
                icon: data.results.errors.length > 0 ? 'warning' : 'success',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#6366f1',
                background: '#23272b',
                color: '#e5e7eb',
            });

            setRestoreFile(null);
            setRestoreFileName('');
        } catch (err: any) {
            Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message || 'ไม่สามารถกู้คืนข้อมูลได้', icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', background: '#23272b', color: '#e5e7eb' });
        } finally {
            setRestoring(false);
        }
    };

    const handleDownloadOld = async (backupId: number, fileName: string) => {
        setDownloading(backupId);
        try {
            const res = await fetch(`/api/admin/backup?id=${backupId}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'ดาวน์โหลดไม่สำเร็จ');
            }
            const data = await res.json();

            const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            Swal.fire({ title: 'ดาวน์โหลดไม่สำเร็จ', text: err.message, icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', background: '#23272b', color: '#e5e7eb' });
        } finally {
            setDownloading(null);
        }
    };

    const totalRecords = summary
        ? summary.users + summary.bookings + summary.rooms + summary.room_schedules + summary.feedbacks
        : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1a1d21] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                    </div>
                    <p className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a1d21] flex">
            <AdminSidebar />

            <div className="flex-1 ml-0 sm:ml-72 p-4 sm:p-8 transition-all duration-300">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                            สำรองข้อมูล
                        </h1>
                        <p className="text-gray-500 mt-1 ml-5 text-sm">จัดการการสำรองข้อมูลของระบบ • เฉพาะผู้ดูแลระบบ</p>
                    </div>
                    {lastBackup && (
                        <div className="flex items-center gap-2 bg-[#23272b] px-4 py-2.5 rounded-xl border border-gray-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-gray-400 text-sm">ตรวจสอบล่าสุด: {new Date(lastBackup).toLocaleString('th-TH')}</span>
                        </div>
                    )}
                </div>

                {/* Database Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'ผู้ใช้', count: summary?.users || 0, icon: '👥' },
                        { label: 'การจอง', count: summary?.bookings || 0, icon: '📅' },
                        { label: 'ห้องประชุม', count: summary?.rooms || 0, icon: '🏢' },
                        { label: 'ตารางเรียน', count: summary?.room_schedules || 0, icon: '📋' },
                        { label: 'ความคิดเห็น', count: summary?.feedbacks || 0, icon: '💬' },
                    ].map(({ label, count, icon }) => (
                        <div
                            key={label}
                            className="bg-gradient-to-br from-[#23272b] to-[#1e2328] p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors duration-200"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{icon}</span>
                                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{count.toLocaleString()}</p>
                            <p className="text-xs text-gray-600 mt-1">รายการ</p>
                        </div>
                    ))}
                </div>

                {/* Total Records Banner */}
                <div className="bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-cyan-600/10 border border-indigo-500/20 rounded-2xl p-5 mb-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white font-semibold text-lg">{totalRecords.toLocaleString()} รายการทั้งหมด</p>
                        <p className="text-gray-400 text-sm">ข้อมูลทั้งหมดในฐานข้อมูลระบบจองห้องประชุม</p>
                    </div>
                </div>

                {/* Backup Options */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* สำรองฐานข้อมูล */}
                    <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                        <div className="p-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">สำรองฐานข้อมูล</h3>
                            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                ข้อมูลผู้ใช้, การจอง, ห้องประชุม, ตารางเรียน และความคิดเห็น
                            </p>
                            <div className="space-y-2 mb-6">
                                {['ข้อมูลผู้ใช้ (ไม่รวม password)', 'ข้อมูลการจองทั้งหมด', 'ข้อมูลห้องและตารางเรียน'].map((item) => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
                                        <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleBackup('database')}
                                disabled={backingUp !== null}
                                className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {backingUp === 'database' ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> กำลังสำรอง...</>
                                ) : (
                                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> สำรองฐานข้อมูล</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* สำรองระบบ */}
                    <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
                        <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600"></div>
                        <div className="p-6">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-5 border border-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">สำรองระบบ</h3>
                            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                สถิติสรุป การตั้งค่าระบบ และข้อมูลเซิร์ฟเวอร์
                            </p>
                            <div className="space-y-2 mb-6">
                                {['สถิติการจอง (ยืนยัน, รอ, ยกเลิก)', 'การตั้งค่าห้องประชุม', 'ข้อมูลเซิร์ฟเวอร์'].map((item) => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
                                        <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleBackup('system')}
                                disabled={backingUp !== null}
                                className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {backingUp === 'system' ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> กำลังสำรอง...</>
                                ) : (
                                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> สำรองระบบ</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* สำรองข้อมูลทั้งหมด */}
                    <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 relative">
                        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
                        <div className="absolute top-5 right-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">แนะนำ</span>
                        </div>
                        <div className="p-6">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">สำรองข้อมูลทั้งหมด</h3>
                            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                                รวมฐานข้อมูล + ระบบครบถ้วน เหมาะสำหรับสำรองประจำ
                            </p>
                            <div className="space-y-2 mb-6">
                                {['รวมข้อมูลฐานข้อมูลทั้งหมด', 'รวมการตั้งค่าระบบ', 'ไฟล์สำรองครบถ้วนพร้อมกู้คืน'].map((item) => (
                                    <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
                                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => handleBackup('full')}
                                disabled={backingUp !== null}
                                className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {backingUp === 'full' ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> กำลังสำรอง...</>
                                ) : (
                                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> สำรองข้อมูลทั้งหมด</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ============ Restore Section ============ */}
                <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 overflow-hidden mb-8">
                    <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-3">
                            <span className="w-1.5 h-6 rounded-full bg-orange-500"></span>
                            กู้คืนข้อมูล
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">อัปโหลดไฟล์สำรอง (.json) เพื่อกู้คืนข้อมูลกลับเข้าสู่ระบบ</p>

                        {/* File Upload Area */}
                        <div className="mb-6">
                            <label className="block">
                                <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${restoreFile ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-gray-700 hover:border-indigo-500/40 hover:bg-indigo-500/5'}`}>
                                    {restoreFile ? (
                                        <div>
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                                                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <p className="text-emerald-400 font-medium text-sm">{restoreFileName}</p>
                                            <p className="text-gray-500 text-xs mt-1">สร้างเมื่อ: {new Date(restoreFile.metadata.created_at).toLocaleString('th-TH')}</p>
                                            <p className="text-gray-500 text-xs">ประเภท: {restoreFile.metadata.type === 'full' ? 'สำรองทั้งหมด' : restoreFile.metadata.type === 'database' ? 'ฐานข้อมูล' : 'ระบบ'}</p>
                                            <button type="button" onClick={(e) => { e.preventDefault(); setRestoreFile(null); setRestoreFileName(''); }} className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors">เปลี่ยนไฟล์</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-3 border border-gray-700">
                                                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                            </div>
                                            <p className="text-gray-300 font-medium text-sm">คลิกเพื่อเลือกไฟล์สำรอง</p>
                                            <p className="text-gray-600 text-xs mt-1">รองรับไฟล์ .json ที่สร้างจากระบบสำรองข้อมูล</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>

                        {/* Table Selection */}
                        {restoreFile && restoreFile.database && (
                            <div className="mb-6">
                                <p className="text-gray-400 text-sm font-medium mb-3">เลือกตารางที่ต้องการกู้คืน:</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {[
                                        { key: 'rooms', label: 'ห้องประชุม', icon: '🏢', count: restoreFile.database.rooms?.length || 0 },
                                        { key: 'users', label: 'ผู้ใช้', icon: '👥', count: restoreFile.database.users?.length || 0 },
                                        { key: 'room_schedules', label: 'ตารางเรียน', icon: '📋', count: restoreFile.database.room_schedules?.length || 0 },
                                        { key: 'bookings', label: 'การจอง', icon: '📅', count: restoreFile.database.bookings?.length || 0 },
                                        { key: 'feedbacks', label: 'ความคิดเห็น', icon: '💬', count: restoreFile.database.feedbacks?.length || 0 },
                                    ].map(({ key, label, icon, count }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleTable(key)}
                                            disabled={count === 0}
                                            className={`p-3 rounded-xl border text-left transition-all duration-200 ${selectedTables.includes(key) && count > 0
                                                ? 'bg-indigo-500/10 border-indigo-500/30 text-white'
                                                : count === 0
                                                    ? 'bg-gray-800/30 border-gray-800 text-gray-600 cursor-not-allowed'
                                                    : 'bg-[#1a1d21] border-gray-800 text-gray-400 hover:border-gray-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span>{icon}</span>
                                                <span className="text-xs font-medium">{label}</span>
                                                {selectedTables.includes(key) && count > 0 && (
                                                    <svg className="w-3.5 h-3.5 text-indigo-400 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600">{count} รายการ</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Restore Button */}
                        {restoreFile && (
                            <button
                                onClick={handleRestore}
                                disabled={restoring || selectedTables.length === 0}
                                className="w-full sm:w-auto py-3 px-8 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {restoring ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> กำลังกู้คืนข้อมูล...</>
                                ) : (
                                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> กู้คืนข้อมูล ({selectedTables.length} ตาราง)</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Backup History */}
                <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6 mb-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-6 rounded-full bg-purple-500"></span>
                        ประวัติการสำรองข้อมูล
                    </h3>

                    {backupLogs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อไฟล์</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ขนาด</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สำรองโดย</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ดาวน์โหลด</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backupLogs.map((log) => (
                                        <tr key={log.backup_id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    <span className="text-gray-300 text-sm font-mono truncate max-w-[250px]">{log.file_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{log.file_size || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${log.status === 'success'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : log.status === 'restored'
                                                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                                        : log.status === 'partial'
                                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                    {log.status === 'success' ? '✓ สำรองสำเร็จ' : log.status === 'restored' ? '↻ กู้คืนสำเร็จ' : log.status === 'partial' ? '⚠ กู้คืนบางส่วน' : '✗ ล้มเหลว'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {log.fname ? `${log.fname} ${log.lname}` : `ID: ${log.created_by}`}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(log.created_at).toLocaleString('th-TH')}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {log.has_data && log.status === 'success' ? (
                                                    <button
                                                        onClick={() => handleDownloadOld(log.backup_id, log.file_name)}
                                                        disabled={downloading !== null}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 mx-auto"
                                                    >
                                                        {downloading === log.backup_id ? (
                                                            <div className="w-3 h-3 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin"></div>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        )}
                                                        ดาวน์โหลด
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-700 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </div>
                            <h3 className="text-sm font-medium text-gray-300">ยังไม่มีประวัติการสำรองข้อมูล</h3>
                            <p className="mt-1 text-sm text-gray-600">เลือกประเภทการสำรองข้อมูลด้านบนเพื่อเริ่มต้น</p>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                        <span className="w-1.5 h-6 rounded-full bg-amber-500"></span>
                        คำแนะนำการสำรองข้อมูล
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { icon: '🔒', title: 'ความปลอดภัย', desc: 'ไฟล์สำรองจะไม่รวม password ของผู้ใช้เพื่อความปลอดภัย' },
                            { icon: '📁', title: 'รูปแบบไฟล์', desc: 'ข้อมูลจะถูกสำรองในรูปแบบ JSON ที่สามารถอ่านและนำเข้าได้ง่าย' },
                            { icon: '📅', title: 'ความถี่', desc: 'แนะนำให้สำรองข้อมูลอย่างน้อยสัปดาห์ละ 1 ครั้ง' },
                            { icon: '💾', title: 'การจัดเก็บ', desc: 'เก็บไฟล์สำรองไว้ในที่ปลอดภัย เช่น Google Drive หรือ OneDrive' },
                        ].map(({ icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-3 p-4 bg-[#1a1d21] rounded-xl border border-gray-800">
                                <span className="text-xl mt-0.5">{icon}</span>
                                <div>
                                    <p className="text-white font-medium text-sm">{title}</p>
                                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
