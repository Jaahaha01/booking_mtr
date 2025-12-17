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

        // ตรวจสอบว่าเป็น admin หรือ staff
        if (userData.role !== 'admin' && userData.role !== 'staff') {
          router.push('/');
          return;
        }

        // ดึงข้อมูลการจองทั้งหมด
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    // If reset (คืนค่า), also reset confirmed_by and cancelled_by
    if (newStatus === 'pending') {
      body.confirmed_by = null;
      body.cancelled_by = null;
    }
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const updated = await response.json();
      setBookings(prev => prev.map(booking => 
        booking.booking_id === bookingId 
          ? { 
              ...booking, 
              status: newStatus, 
              confirmed_name: updated.confirmed_name, 
              cancelled_name: updated.cancelled_name 
            }
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
  // รออนุมัติ เฉพาะที่ยังไม่ถึงเวลาเริ่มต้น (start > now)
  const now = new Date();
  return booking.status === 'pending' && new Date(booking.start) > now;
  }
  if (filter === 'expired') {
  // ล่วงเวลา แสดงเฉพาะ pending ที่ start <= เวลาปัจจุบัน
  const now = new Date();
  return booking.status === 'pending' && new Date(booking.start) <= now;
  }
  return booking.status === filter;
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <div className="hidden md:block">
        <div className="w-12">
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
          <h1 className="text-3xl font-bold text-gray-800">จัดการการจอง</h1>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ทั้งหมด ({bookings.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              รอการอนุมัติ ({bookings.filter(b => {
                const now = new Date();
                return b.status === 'pending' && new Date(b.start) > now;
              }).length})
            </button>
            <button
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'confirmed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ยืนยันแล้ว ({bookings.filter(b => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'cancelled' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ยกเลิกแล้ว ({bookings.filter(b => b.status === 'cancelled').length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'expired' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ล่วงเวลา ({bookings.filter(b => { const now = new Date(); return b.status === 'pending' && new Date(b.start) <= now; }).length})
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีการจอง</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'ยังไม่มีการจองในระบบ' 
                  : `ไม่มีการจองที่มีสถานะ "${getStatusText(filter)}"`
                }
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.booking_id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {booking.title}
                    </h3>
                    {booking.description && (
                      <p className="text-gray-600 mb-3">{booking.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    <div className="flex gap-2">
                      {/* เฉพาะ pending ที่ยังไม่หมดเวลา: มีปุ่มยืนยัน/ยกเลิก/ลบ */}
                      {filter === 'pending' && booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(booking.booking_id, 'confirmed')}
                            disabled={updating === booking.booking_id}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-green-400 transition-colors duration-200"
                          >
                            {updating === booking.booking_id ? 'กำลังอัปเดต...' : 'ยืนยัน'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.booking_id, 'cancelled')}
                            disabled={updating === booking.booking_id}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-red-400 transition-colors duration-200"
                          >
                            {updating === booking.booking_id ? 'กำลังอัปเดต...' : 'ยกเลิก'}
                          </button>
                          <button
                            onClick={() => handleRemoveBooking(booking.booking_id)}
                            disabled={updating === booking.booking_id}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:bg-gray-400 transition-colors duration-200"
                          >
                            {updating === booking.booking_id ? 'กำลังลบ...' : 'ลบการจอง'}
                          </button>
                        </>
                      )}
                      {/* เฉพาะล่วงเวลา: มีปุ่มลบ/ยกเลิกเท่านั้น */}
                      {filter === 'expired' && booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(booking.booking_id, 'cancelled')}
                            disabled={updating === booking.booking_id}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-red-400 transition-colors duration-200"
                          >
                            {updating === booking.booking_id ? 'กำลังอัปเดต...' : 'ยกเลิก'}
                          </button>
                          <button
                            onClick={() => handleRemoveBooking(booking.booking_id)}
                            disabled={updating === booking.booking_id}
                            className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 disabled:bg-gray-400 transition-colors duration-200"
                          >
                            {updating === booking.booking_id ? 'กำลังลบ...' : 'ลบการจอง'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {booking.status === 'confirmed' && booking.confirmed_name && (
                  <p className="text-green-700 text-sm mb-1">ยืนยันโดย {booking.confirmed_name}</p>
                )}
                {booking.status === 'cancelled' && (
                  <p className="text-red-700 text-sm mb-1">ยกเลิกโดย {booking.cancelled_name || '-'}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm text-gray-600">{booking.room_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">ความจุ: {booking.room_capacity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-gray-600">{booking.user_name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">เวลาเริ่มต้น</h4>
                    <p className="text-sm text-gray-600">{formatDateTime(booking.start)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">เวลาสิ้นสุด</h4>
                    <p className="text-sm text-gray-600">{formatDateTime(booking.end)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">จำนวนผู้เข้าร่วม</h4>
                  <span className="text-sm text-gray-600">{booking.attendees}{booking.room_capacity ? ` / ${booking.room_capacity}` : ''} คน</span>
                </div>

                {booking.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-1">หมายเหตุ</h4>
                    <p className="text-sm text-gray-600">{booking.notes}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-500">
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

