
'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

  const [form, setForm] = useState<RoomForm>({
    name: '',
    room_number: '',
    capacity: '',
    description: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const userData = await response.json();
        setUser(userData);
        // เฉพาะ admin เท่านั้นที่สามารถเพิ่ม/แก้ไข/ลบห้องประชุม
        if (userData.role !== 'admin' && userData.role !== 'staff') {
          router.push('/');
          return;
        }
        if (userData.role === 'staff' && (window.location.pathname === '/admin/rooms')) {
          setError('คุณไม่มีสิทธิ์จัดการห้องประชุม');
          setTimeout(() => {
            router.back();
          }, 1800);
          setLoading(false);
          return;
        }
        // ดึงข้อมูลห้องประชุมทั้งหมด
        const roomsResponse = await fetch('/api/admin/rooms');
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const url = editingRoom 
        ? `/api/admin/rooms/${editingRoom.room_id}`
        : '/api/admin/rooms';
      
      const method = editingRoom ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        setSubmitting(false);
        return;
      }

      setSuccess(editingRoom ? 'อัปเดตห้องประชุมสำเร็จ' : 'เพิ่มห้องประชุมสำเร็จ');
      
      // รีเฟรชข้อมูลห้องประชุม
      const roomsResponse = await fetch('/api/admin/rooms');
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData);
      }

      // รีเซ็ตฟอร์ม
      setForm({
        name: '',
        room_number: '',
        capacity: '',
        description: ''
      });
      setEditingRoom(null);
      setShowAddForm(false);

      // ซ่อนข้อความสำเร็จหลังจาก 3 วินาที
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      room_number: room.room_number,
      capacity: room.capacity,
      description: room.description
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingRoom(null);
    setShowAddForm(false);
    setForm({
      name: '',
      room_number: '',
      capacity: '',
      description: ''
    });
    setError('');
  };

  const handleDelete = async (roomId: number) => {
    if (!confirm('คุณต้องการลบห้องประชุมนี้หรือไม่?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('ลบห้องประชุมสำเร็จ');
        // รีเฟรชข้อมูลห้องประชุม
        const roomsResponse = await fetch('/api/admin/rooms');
        if (roomsResponse.ok) {
          const roomsData = await roomsResponse.json();
          setRooms(roomsData);
        }
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'เกิดข้อผิดพลาดในการลบห้องประชุม');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <span className="text-red-500 text-lg">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <div className="hidden md:block">
        <div className="w-64">
          <AdminSidebar />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 px-12 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับไปแดชบอร์ด
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">จัดการห้องประชุม</h1>
        </div>

        {/* Add Room Button */}
        {user?.role === 'admin' && (
          <div className="mb-8">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              เพิ่มห้องประชุม
            </button>
          </div>
        )}

        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {user?.role === 'admin' && showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {editingRoom ? 'แก้ไขห้องประชุม' : 'เพิ่มห้องประชุมใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อห้องประชุม *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="เช่น ห้องประชุมใหญ่"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลขห้อง *
                  </label>
                  <input
                    type="text"
                    name="room_number"
                    required
                    value={form.room_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="เช่น 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ความจุ *
                  </label>
                  <input
                    type="text"
                    name="capacity"
                    required
                    value={form.capacity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="เช่น 20 คน"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รายละเอียด
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับห้องประชุม"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingRoom ? 'อัปเดต' : 'เพิ่มห้องประชุม'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rooms List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีห้องประชุม</h3>
              <p className="text-gray-500">ยังไม่มีห้องประชุมในระบบ</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.room_id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">ห้อง: {room.room_number}</p>
                    <p className="text-sm text-gray-600 mb-2">ความจุ: {room.capacity}</p>
                    {room.description && (
                      <p className="text-sm text-gray-500">{room.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    room.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {room.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                  </span>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(room)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(room.room_id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
