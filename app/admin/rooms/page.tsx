'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/app/components/AdminSidebar';

interface Room {
  room_id: number;
  name: string;
  room_number: string;
  capacity: string;
  description: string;
  status: string;
  created_at: string;
}

interface RoomForm {
  name: string;
  room_number: string;
  capacity: string;
  description: string;
}

export default function AdminRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<RoomForm>({ name: '', room_number: '', capacity: '', description: '' });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) { router.push('/login'); return; }
        const userData = await response.json();
        setUser(userData);
        if (userData.role !== 'admin' && userData.role !== 'staff') { router.push('/'); return; }
        if (userData.role === 'staff') { setError('คุณไม่มีสิทธิ์จัดการห้องประชุม'); setTimeout(() => router.back(), 1800); setLoading(false); return; }
        const r = await fetch('/api/admin/rooms');
        if (r.ok) setRooms(await r.json());
        setLoading(false);
      } catch { router.push('/login'); }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setSubmitting(true);
    try {
      const url = editingRoom ? `/api/admin/rooms/${editingRoom.room_id}` : '/api/admin/rooms';
      const res = await fetch(url, { method: editingRoom ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); setSubmitting(false); return; }
      setSuccess(editingRoom ? 'อัปเดตสำเร็จ' : 'เพิ่มห้องสำเร็จ');
      const r2 = await fetch('/api/admin/rooms'); if (r2.ok) setRooms(await r2.json());
      setForm({ name: '', room_number: '', capacity: '', description: '' }); setEditingRoom(null); setShowAddForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('เกิดข้อผิดพลาดในการเชื่อมต่อ'); } finally { setSubmitting(false); }
  };

  const handleEdit = (room: Room) => { setEditingRoom(room); setForm({ name: room.name, room_number: room.room_number, capacity: room.capacity, description: room.description }); setShowAddForm(true); };
  const handleCancel = () => { setEditingRoom(null); setShowAddForm(false); setForm({ name: '', room_number: '', capacity: '', description: '' }); setError(''); };
  const handleDelete = async (roomId: number) => {
    if (!confirm('คุณต้องการลบห้องประชุมนี้หรือไม่?')) return;
    try { const r = await fetch(`/api/admin/rooms/${roomId}`, { method: 'DELETE' }); if (r.ok) { setSuccess('ลบสำเร็จ'); const r2 = await fetch('/api/admin/rooms'); if (r2.ok) setRooms(await r2.json()); setTimeout(() => setSuccess(''), 3000); } else { const d = await r.json(); setError(d.error || 'เกิดข้อผิดพลาด'); } } catch { setError('เกิดข้อผิดพลาด'); }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  if (loading) return (<div className="min-h-screen bg-[#1a1d21] flex items-center justify-center"><div className="text-center"><div className="relative w-16 h-16 mx-auto mb-4"><div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div></div><p className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</p></div></div>);
  if (error && !rooms.length) return (<div className="min-h-screen bg-[#1a1d21] flex items-center justify-center"><span className="text-red-400">{error}</span></div>);

  return (
    <div className="min-h-screen bg-[#1a1d21] flex">
      <AdminSidebar />
      <div className="flex-1 ml-0 sm:ml-72 p-4 sm:p-8 transition-all duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><span className="w-2 h-8 bg-purple-500 rounded-full"></span>จัดการห้องประชุม</h1>
            <p className="text-gray-500 mt-1 ml-5 text-sm">เพิ่ม แก้ไขห้องประชุม • ทั้งหมด {rooms.length} ห้อง</p>
          </div>
          {user?.role === 'admin' && !showAddForm && <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 text-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>เพิ่มห้อง</button>}
        </div>

        {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">{success}</div>}
        {error && rooms.length > 0 && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

        {user?.role === 'admin' && showAddForm && (
          <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3"><span className="w-1.5 h-6 rounded-full bg-indigo-500"></span>{editingRoom ? 'แก้ไข' : 'เพิ่มห้องใหม่'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">ชื่อห้อง *</label><input type="text" name="name" required value={form.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="เช่น ห้องประชุมใหญ่" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">เลขห้อง *</label><input type="text" name="room_number" required value={form.room_number} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="เช่น 101" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">ความจุ *</label><input type="text" name="capacity" required value={form.capacity} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="เช่น 20" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">รายละเอียด</label><textarea name="description" rows={3} value={form.description} onChange={handleInputChange} className="w-full px-4 py-3 bg-[#1a1d21] border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none" placeholder="รายละเอียดเพิ่มเติม" /></div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 text-sm">{submitting ? 'กำลังบันทึก...' : editingRoom ? 'อัปเดต' : 'เพิ่มห้อง'}</button>
                <button type="button" onClick={handleCancel} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-6 py-2.5 rounded-xl font-medium text-sm">ยกเลิก</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.length === 0 ? (
            <div className="col-span-full bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4"><svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg></div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">ไม่มีห้องประชุม</h3><p className="text-gray-600">ยังไม่มีห้องประชุมในระบบ</p>
            </div>
          ) : rooms.map((room) => (
            <div key={room.room_id} className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6 hover:border-gray-700 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">{room.name}</h3>
                  <div className="space-y-1.5">
                    <p className="text-sm text-gray-400 flex items-center gap-2"><svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>ห้อง: {room.room_number}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-2"><svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>ความจุ: {room.capacity} คน</p>
                  </div>
                  {room.description && <p className="text-sm text-gray-500 mt-3">{room.description}</p>}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${room.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>{room.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</span>
              </div>
              {user?.role === 'admin' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                  <button onClick={() => handleEdit(room)} className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-2 rounded-xl text-sm font-medium border border-indigo-500/20">แก้ไข</button>
                  <button onClick={() => handleDelete(room.room_id)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-xl text-sm font-medium border border-red-500/20">ลบ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
