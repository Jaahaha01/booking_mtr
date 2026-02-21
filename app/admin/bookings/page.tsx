'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminSidebar from '../../components/AdminSidebar';

interface Booking {
  booking_id: number;
  title: string;
  description: string;
  start: string;
  end: string;
  status: string;
  attendees: number;
  notes: string;
  room_name: string;
  room_capacity: string;
  user_name: string;
  user_email: string;
  created_at: string;
  confirmed_name?: string;
  cancelled_name?: string;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<number | null>(null);

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

        if (userData.role !== 'admin' && userData.role !== 'staff') {
          router.push('/');
          return;
        }

        const bookingsResponse = await fetch('/api/admin/bookings');
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอการอนุมัติ';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      default:
        return status;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateStatus = async (bookingId: number, newStatus: string) => {
    let confirmText = '';
    if (newStatus === 'confirmed') confirmText = 'คุณแน่ใจหรือไม่ว่าต้องการยืนยันการจองนี้?';
    if (newStatus === 'cancelled') confirmText = 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?';
    if (newStatus === 'pending') confirmText = 'คุณแน่ใจหรือไม่ว่าต้องการคืนค่าสถานะการจองนี้?';
    if (!window.confirm(confirmText)) return;
    setUpdating(bookingId);
    try {
      const body = { status: newStatus, confirmed_by: null as number | null, cancelled_by: null as number | null };
      if (newStatus === 'pending') {
        body.confirmed_by = null;
        body.cancelled_by = null;
      }
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const updated = await response.json();
        setBookings(prev => prev.map(booking =>
          booking.booking_id === bookingId
            ? { ...booking, status: newStatus, confirmed_name: updated.confirmed_name, cancelled_name: updated.cancelled_name }
            : booking
        ));
      } else {
        const data = await response.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveBooking = async (bookingId: number) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการจองนี้?')) return;
    setUpdating(bookingId);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setBookings(prev => prev.filter(booking => booking.booking_id !== bookingId));
      } else {
        const data = await response.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการลบการจอง');
      }
    } catch (error) {
      console.error('Error removing booking:', error);
      alert('เกิดข้อผิดพลาดในการลบการจอง');
    } finally {
      setUpdating(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'pending') {
      const now = new Date();
      return booking.status === 'pending' && new Date(booking.start) > now;
    }
    if (filter === 'expired') {
      const now = new Date();
      return booking.status === 'pending' && new Date(booking.start) <= now;
    }
    return booking.status === filter;
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
              <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
              จัดการการจอง
            </h1>
            <p className="text-gray-500 mt-1 ml-5 text-sm">อนุมัติ ปฏิเสธ และจัดการคำขอจองห้องประชุม</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-4 sm:p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: `ทั้งหมด (${bookings.length})`, color: 'indigo' },
              { key: 'pending', label: `รอการอนุมัติ (${bookings.filter(b => { const now = new Date(); return b.status === 'pending' && new Date(b.start) > now; }).length})`, color: 'amber' },
              { key: 'confirmed', label: `ยืนยันแล้ว (${bookings.filter(b => b.status === 'confirmed').length})`, color: 'emerald' },
              { key: 'cancelled', label: `ยกเลิกแล้ว (${bookings.filter(b => b.status === 'cancelled').length})`, color: 'red' },
              { key: 'expired', label: `ล่วงเวลา (${bookings.filter(b => { const now = new Date(); return b.status === 'pending' && new Date(b.start) <= now; }).length})`, color: 'gray' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${filter === key
                    ? `bg-${color === 'gray' ? 'gray-600' : color + '-600'} text-white shadow-lg`
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                  }`}
                style={filter === key ? {
                  backgroundColor: color === 'indigo' ? '#4f46e5' : color === 'amber' ? '#d97706' : color === 'emerald' ? '#059669' : color === 'red' ? '#dc2626' : '#4b5563'
                } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-12 text-center">
              <div className="mx-auto h-16 w-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">ไม่มีการจอง</h3>
              <p className="text-gray-500 text-sm">
                {filter === 'all'
                  ? 'ยังไม่มีการจองในระบบ'
                  : `ไม่มีการจองที่มีสถานะ "${getStatusText(filter)}"`
                }
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.booking_id} className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6 hover:border-gray-700 transition-colors duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{booking.title}</h3>
                    {booking.description && (
                      <p className="text-gray-400 text-sm">{booking.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    <div className="flex gap-2">
                      {filter === 'pending' && booking.status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdateStatus(booking.booking_id, 'confirmed')} disabled={updating === booking.booking_id} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                            {updating === booking.booking_id ? '...' : 'ยืนยัน'}
                          </button>
                          <button onClick={() => handleUpdateStatus(booking.booking_id, 'cancelled')} disabled={updating === booking.booking_id} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                            {updating === booking.booking_id ? '...' : 'ยกเลิก'}
                          </button>
                          <button onClick={() => handleRemoveBooking(booking.booking_id)} disabled={updating === booking.booking_id} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                            {updating === booking.booking_id ? '...' : 'ลบ'}
                          </button>
                        </>
                      )}
                      {filter === 'expired' && booking.status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdateStatus(booking.booking_id, 'cancelled')} disabled={updating === booking.booking_id} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                            {updating === booking.booking_id ? '...' : 'ยกเลิก'}
                          </button>
                          <button onClick={() => handleRemoveBooking(booking.booking_id)} disabled={updating === booking.booking_id} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                            {updating === booking.booking_id ? '...' : 'ลบ'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {booking.status === 'confirmed' && booking.confirmed_name && (
                  <p className="text-emerald-400 text-xs mb-2">ยืนยันโดย {booking.confirmed_name}</p>
                )}
                {booking.status === 'cancelled' && (
                  <p className="text-red-400 text-xs mb-2">ยกเลิกโดย {booking.cancelled_name || '-'}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm text-gray-400">{booking.room_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-400">ความจุ: {booking.room_capacity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-gray-400">{booking.user_name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="text-xs text-gray-600 font-medium">เริ่มต้น</span>
                    <p className="text-sm text-gray-300">{formatDateTime(booking.start)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600 font-medium">สิ้นสุด</span>
                    <p className="text-sm text-gray-300">{formatDateTime(booking.end)}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-xs text-gray-600 font-medium">ผู้เข้าร่วม</span>
                  <span className="text-sm text-gray-300 ml-2">{booking.attendees}{booking.room_capacity ? ` / ${booking.room_capacity}` : ''} คน</span>
                </div>

                {booking.notes && (
                  <div className="mb-3">
                    <span className="text-xs text-gray-600 font-medium">หมายเหตุ</span>
                    <p className="text-sm text-gray-400 mt-0.5">{booking.notes}</p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-800">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>สร้างเมื่อ: {new Date(booking.created_at).toLocaleDateString('th-TH')}</span>
                    <span>อีเมล: {booking.user_email}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
