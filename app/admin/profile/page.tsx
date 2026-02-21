"use client";
import AdminSidebar from '@/app/components/AdminSidebar';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type AdminUser = {
  user_id: number; username: string; email: string; fname: string; lname: string;
  phone: string; role: string; verification_status: string; identity_card: string;
  address: string; organization: string; image?: string; created_at: string; updated_at: string;
};

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('https://i.ibb.co/sv88CZNK/avatar.png');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ fname: '', lname: '', email: '', phone: '', address: '', organization: '', image: '' });

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
        const u: AdminUser = await res.json();
        setAdmin(u);
        if (u.image) setPreview(u.image);
        setForm({ fname: u.fname || '', lname: u.lname || '', email: u.email || '', phone: u.phone || '', address: u.address || '', organization: u.organization || '', image: u.image || '' });
      } catch (err: any) { setError(err.message || 'เกิดข้อผิดพลาด'); } finally { setLoading(false); }
    }
    fetchAdmin();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true); setError(''); setSuccess('');
    const d = { fname: form.fname || admin?.fname || '', lname: form.lname || admin?.lname || '', email: form.email || admin?.email || '', phone: form.phone || admin?.phone || '', address: form.address || admin?.address || '', organization: form.organization || admin?.organization || '', image: form.image || admin?.image || '' };
    if (!d.fname || !d.lname) { setError('กรุณากรอกชื่อและนามสกุล'); setIsLoading(false); return; }
    if (!d.email) { setError('กรุณากรอกอีเมล'); setIsLoading(false); return; }
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    const data = await res.json();
    if (data.error) { setError(data.error); setIsLoading(false); return; }
    setSuccess('บันทึกข้อมูลสำเร็จ'); setIsEditing(false); setIsLoading(false);
    if (admin) setAdmin({ ...admin, ...form });
  };

  const handleImageChange = async (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setForm({ ...form, image: data.url }); setPreview(data.url);
  };

  const getRoleName = (role: string) => role === 'admin' ? 'ผู้ดูแลระบบ' : role === 'staff' ? 'เจ้าหน้าที่' : role === 'user' ? 'ผู้ใช้ทั่วไป' : role;

  return (
    <div className="flex min-h-screen bg-[#1a1d21]">
      <AdminSidebar />
      <main className="flex-1 ml-0 sm:ml-72 p-4 sm:p-8 transition-all duration-300">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4"><div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div></div>
              <p className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        ) : error && !admin ? (
          <div className="flex items-center justify-center h-96"><span className="text-red-400">{error || 'ไม่พบข้อมูลโปรไฟล์'}</span></div>
        ) : admin && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><span className="w-2 h-8 bg-indigo-500 rounded-full"></span>ข้อมูลเจ้าหน้าที่</h1>
                <p className="text-gray-500 mt-1 ml-5 text-sm">จัดการข้อมูลส่วนตัวของคุณ</p>
              </div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  แก้ไข
                </button>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6 sticky top-8">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <Image src={preview} alt="Profile" width={120} height={120} className="rounded-2xl object-cover w-[120px] h-[120px] border-2 border-gray-700 shadow-lg" />
                      {isEditing && (
                        <label className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                        </label>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-white mt-4">{admin.fname} {admin.lname}</h2>
                    <p className="text-gray-500 text-sm">{admin.email}</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      {getRoleName(admin.role)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6 sm:p-8">
                  {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
                  {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{success}</div>}

                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 text-sm">คุณสามารถแก้ไขเฉพาะข้อมูลที่ต้องการ</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { label: 'ชื่อ', key: 'fname', type: 'text', ph: admin.fname || 'กรอกชื่อ' },
                          { label: 'นามสกุล', key: 'lname', type: 'text', ph: admin.lname || 'กรอกนามสกุล' },
                          { label: 'อีเมล', key: 'email', type: 'email', ph: admin.email || 'กรอกอีเมล' },
                          { label: 'เบอร์โทร', key: 'phone', type: 'tel', ph: admin.phone || 'ไม่บังคับ' },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">{f.label}</label>
                            <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-4 py-3 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder={f.ph} />
                          </div>
                        ))}
                      </div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">องค์กร</label><input type="text" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} className="w-full px-4 py-3 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder={admin.organization || 'ไม่บังคับ'} /></div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">ที่อยู่</label><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={3} className="w-full px-4 py-3 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none" placeholder={admin.address || 'ไม่บังคับ'} /></div>
                      <div className="flex gap-3 pt-4">
                        <button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm">{isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
                        <button onClick={() => { setIsEditing(false); setError(''); setSuccess(''); setForm({ fname: admin.fname || '', lname: admin.lname || '', email: admin.email || '', phone: admin.phone || '', address: admin.address || '', organization: admin.organization || '', image: admin.image || '' }); }} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium text-sm">ยกเลิก</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { label: 'ชื่อ', value: admin.fname },
                          { label: 'นามสกุล', value: admin.lname },
                          { label: 'อีเมล', value: admin.email },
                          { label: 'เบอร์โทร', value: admin.phone || '-' },
                        ].map(f => (
                          <div key={f.label} className="space-y-1">
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{f.label}</span>
                            <div className="text-gray-200 font-medium">{f.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1"><span className="text-xs font-medium text-gray-600 uppercase tracking-wider">องค์กร</span><div className="text-gray-200 font-medium">{admin.organization || '-'}</div></div>
                      <div className="space-y-1"><span className="text-xs font-medium text-gray-600 uppercase tracking-wider">ที่อยู่</span><div className="text-gray-200 font-medium">{admin.address || '-'}</div></div>
                      <div className="pt-6 border-t border-gray-800"><div className="text-xs text-gray-600">สร้างเมื่อ: {new Date(admin.created_at).toLocaleString()} | อัปเดตล่าสุด: {new Date(admin.updated_at).toLocaleString()}</div></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
