"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/app/components/AdminSidebar';
import Swal from 'sweetalert2';

interface User {
  user_id: number;
  username: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  role: string;
  verification_status: string;
  address: string;
  organization: string;
  created_at: string;
  identity_card?: string;
  image?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) { router.push('/login'); return; }
        const userData = await response.json();
        setUser(userData);
        if (userData.role !== 'admin' && userData.role !== 'staff') { router.push('/'); return; }
        await fetchUsers();
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleUpdateUser = async (userId: number, field: string, value: any) => {
    const targetUser = users.find(u => u.user_id === userId);
    // admin สามารถแก้ไข staff ได้ แต่ staff ไม่สามารถแก้ไข staff/admin ได้
    if (targetUser && targetUser.role === 'admin') {
      setError('ไม่สามารถแก้ไขข้อมูลผู้ดูแลระบบได้');
      return;
    }
    if (user?.role === 'staff' && targetUser && (targetUser.role === 'staff' || targetUser.role === 'admin')) {
      setError('คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลเจ้าหน้าที่หรือผู้ดูแลระบบ');
      return;
    }
    setUpdating(userId);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'เกิดข้อผิดพลาดในการอัปเดต'); setUpdating(null); return; }
      setSuccess('อัปเดตข้อมูลสำเร็จ');
      await fetchUsers();
      setUpdating(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const targetUser = users.find(u => u.user_id === userId);
    // ป้องกันการลบ admin
    if (targetUser && targetUser.role === 'admin') {
      Swal.fire({ title: 'ไม่สามารถลบได้', text: 'ไม่สามารถลบผู้ดูแลระบบได้', icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', width: 'min(90vw, 500px)', background: '#23272b', color: '#e5e7eb' });
      return;
    }
    // staff ไม่สามารถลบ staff/admin ได้
    if (user?.role === 'staff' && targetUser && (targetUser.role === 'staff' || targetUser.role === 'admin')) {
      Swal.fire({ title: 'ไม่สามารถลบได้', text: 'คุณไม่มีสิทธิ์ในการลบเจ้าหน้าที่หรือผู้ดูแลระบบ', icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', width: 'min(90vw, 500px)', background: '#23272b', color: '#e5e7eb' });
      return;
    }
    const result = await Swal.fire({ title: 'ยืนยันการลบ', text: 'คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้? ไม่สามารถคืนค่าได้', icon: 'warning', showCancelButton: true, confirmButtonText: 'ใช่, ลบเลย', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', width: 'min(90vw, 500px)', reverseButtons: true, background: '#23272b', color: '#e5e7eb' });
    if (!result.isConfirmed) return;
    setUpdating(userId);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!response.ok) { const data = await response.json(); setError(data.error || 'เกิดข้อผิดพลาดในการลบ'); setUpdating(null); return; }
      setSuccess('ลบผู้ใช้สำเร็จ');
      await fetchUsers();
      setUpdating(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setUpdating(null);
    }
  };

  const handleResetPassword = async (userId: number) => {
    const targetUser = users.find(u => u.user_id === userId);
    if (!targetUser) return;
    // ป้องกันการรีเซ็ตรหัสผ่าน admin
    if (targetUser.role === 'admin') {
      Swal.fire({ title: 'ไม่สามารถรีเซ็ตได้', text: 'ไม่สามารถรีเซ็ตรหัสผ่านผู้ดูแลระบบ', icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', background: '#23272b', color: '#e5e7eb' });
      return;
    }
    // staff ไม่สามารถรีเซ็ตรหัสผ่าน staff/admin ได้
    if (user?.role === 'staff' && (targetUser.role === 'staff' || targetUser.role === 'admin')) {
      Swal.fire({ title: 'ไม่สามารถรีเซ็ตได้', text: 'คุณไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่านเจ้าหน้าที่หรือผู้ดูแลระบบ', icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', background: '#23272b', color: '#e5e7eb' });
      return;
    }

    const { value: newPassword } = await Swal.fire({
      title: `รีเซ็ตรหัสผ่าน`,
      html: `<p class="text-gray-400 text-sm mb-3">ผู้ใช้: <span class="text-white font-medium">${targetUser.fname} ${targetUser.lname}</span></p>`,
      input: 'password',
      inputLabel: 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)',
      inputPlaceholder: 'รหัสผ่านใหม่',
      inputAttributes: { minlength: '6', autocomplete: 'new-password' },
      showCancelButton: true,
      confirmButtonText: 'รีเซ็ตรหัสผ่าน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      background: '#23272b',
      color: '#e5e7eb',
      inputValidator: (value) => {
        if (!value) return 'กรุณากรอกรหัสผ่านใหม่';
        if (value.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        return null;
      },
    });

    if (!newPassword) return;

    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');

      Swal.fire({ title: 'รีเซ็ตรหัสผ่านสำเร็จ!', text: data.message, icon: 'success', confirmButtonText: 'ตกลง', confirmButtonColor: '#6366f1', background: '#23272b', color: '#e5e7eb' });
    } catch (err: any) {
      Swal.fire({ title: 'เกิดข้อผิดพลาด', text: err.message, icon: 'error', confirmButtonText: 'ปิด', confirmButtonColor: '#dc2626', background: '#23272b', color: '#e5e7eb' });
    } finally {
      setUpdating(null);
    }
  };
  const filteredUsers = users.filter(u => {
    // admin เห็นได้ทุกคนยกเว้น admin คนอื่น, staff เห็นได้เฉพาะ user ทั่วไป
    if (u.role === 'admin') return false;
    if (user?.role === 'staff' && u.role === 'staff') return false;
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.fname} ${u.lname}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.verification_status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

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
              <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
              จัดการผู้ใช้
            </h1>
            <p className="text-gray-500 mt-1 ml-5 text-sm">จัดการข้อมูลและสิทธิ์ผู้ใช้ในระบบ • ทั้งหมด {users.length} คน</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <p className="text-emerald-400 text-sm">{success}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">ค้นหา</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="ค้นหาด้วยชื่อ, อีเมล, หรือชื่อผู้ใช้"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">บทบาท</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                <option value="all">ทั้งหมด</option>
                <option value="user">ผู้ใช้</option>
                <option value="student">นักศึกษา</option>
                <option value="teacher">อาจารย์</option>
                {user?.role === 'admin' && <option value="staff">เจ้าหน้าที่</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">สถานะการยืนยัน</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
                <option value="all">ทั้งหมด</option>
                <option value="approved">ยืนยันแล้ว</option>
                <option value="pending">รอยืนยัน</option>
                <option value="rejected">ถูกปฏิเสธ</option>
                <option value="null">ยังไม่ยืนยัน</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บทบาท</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะการยืนยัน</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สมัคร</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.user_id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${userItem.role === 'staff' ? 'border-l-2 border-l-cyan-500/60 bg-cyan-500/5' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {userItem.image ? (
                          <img src={userItem.image} alt={`${userItem.fname} ${userItem.lname}`} className="w-10 h-10 rounded-xl object-cover border border-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                        ) : null}
                        <div className={`w-10 h-10 ${userItem.role === 'staff' ? 'bg-cyan-500/20' : 'bg-indigo-500/20'} rounded-xl flex items-center justify-center ${userItem.image ? 'hidden' : ''}`}>
                          <svg className={`w-5 h-5 ${userItem.role === 'staff' ? 'text-cyan-400' : 'text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-200 flex items-center gap-2">
                            {userItem.fname} {userItem.lname}
                            {userItem.role === 'staff' && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                                เจ้าหน้าที่
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{userItem.email}</div>
                          <div className="text-xs text-gray-600">@{userItem.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={userItem.role}
                        onChange={(e) => handleUpdateUser(userItem.user_id, 'role', e.target.value)}
                        disabled={updating === userItem.user_id}
                        className="text-sm bg-[#1a1d21] border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="user">ผู้ใช้</option>
                        <option value="student">นักศึกษา</option>
                        <option value="teacher">อาจารย์</option>
                        {user?.role === 'admin' && (<option value="staff">เจ้าหน้าที่</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          value={userItem.verification_status || ''}
                          onChange={(e) => handleUpdateUser(userItem.user_id, 'verification_status', e.target.value || null)}
                          disabled={updating === userItem.user_id}
                          className="text-sm bg-[#1a1d21] border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">ยังไม่ยืนยัน</option>
                          <option value="pending">รอยืนยัน</option>
                          <option value="approved">ยืนยันแล้ว</option>
                          <option value="rejected">ถูกปฏิเสธ</option>
                        </select>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${userItem.verification_status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : userItem.verification_status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : userItem.verification_status === 'rejected'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                          {userItem.verification_status === 'approved' ? '✓ ยืนยัน' : userItem.verification_status === 'pending' ? '⏳ รอ' : userItem.verification_status === 'rejected' ? '✗ ปฏิเสธ' : '— ยังไม่ยืนยัน'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {updating === userItem.user_id ? (
                          <div className="relative w-5 h-5"><div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin"></div></div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                const message = `<div class="text-left space-y-3">
                                  <div><p class="font-semibold text-gray-400 text-xs uppercase tracking-wider">ชื่อ-นามสกุล</p><p class="text-gray-200">${userItem.fname || '-'} ${userItem.lname || '-'}</p></div>
                                  <div><p class="font-semibold text-gray-400 text-xs uppercase tracking-wider">อีเมล</p><p class="text-gray-200 break-all">${userItem.email || '-'}</p></div>
                                  <div><p class="font-semibold text-gray-400 text-xs uppercase tracking-wider">เบอร์โทร</p><p class="text-gray-200">${userItem.phone || '-'}</p></div>
                                  <div><p class="font-semibold text-gray-400 text-xs uppercase tracking-wider">องค์กร</p><p class="text-gray-200">${userItem.organization || '-'}</p></div>
                                  <div><p class="font-semibold text-gray-400 text-xs uppercase tracking-wider">ที่อยู่</p><p class="text-gray-200">${userItem.address || '-'}</p></div>
                                  <div><p class="font-semibold text-gray-400 text-xs uppercase tracking-wider">หมายเลขบัตรประชาชน</p><p class="text-gray-200">${userItem.identity_card || '-'}</p></div>
                                </div>`;
                                Swal.fire({ title: 'ข้อมูลยืนยันตัวตน', html: message, icon: 'info', confirmButtonText: 'ปิด', confirmButtonColor: '#6366f1', width: 'min(90vw, 500px)', background: '#23272b', color: '#e5e7eb' });
                              }}
                              className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
                            >
                              ดูข้อมูล
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userItem.user_id)}
                              className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
                              disabled={userItem.user_id === user?.user_id}
                            >
                              ลบ
                            </button>
                            <button
                              onClick={() => handleResetPassword(userItem.user_id)}
                              className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                            >
                              รีเซ็ตรหัส
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
              </div>
              <h3 className="text-sm font-medium text-gray-300">ไม่พบผู้ใช้</h3>
              <p className="mt-1 text-sm text-gray-600">ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'ผู้ใช้ทั้งหมด', value: users.filter(u => u.role !== 'admin' && u.role !== 'staff').length, color: 'indigo', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
            { label: 'เจ้าหน้าที่', value: users.filter(u => u.role === 'staff').length, color: 'cyan', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'ยืนยันแล้ว', value: users.filter(u => u.verification_status === 'approved').length, color: 'emerald', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'รอยืนยัน', value: users.filter(u => u.verification_status === 'pending').length, color: 'amber', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center`} style={{ backgroundColor: color === 'indigo' ? 'rgba(99,102,241,0.1)' : color === 'cyan' ? 'rgba(6,182,212,0.1)' : color === 'emerald' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }}>
                  <svg className="w-5 h-5" style={{ color: color === 'indigo' ? '#818cf8' : color === 'cyan' ? '#22d3ee' : color === 'emerald' ? '#34d399' : '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
