'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Booking {
  booking_id: number;
  title: string;
  description: string;
  start: string;
  end: string;
  status: string;
  attendees: string;
  notes: string;
  room_name: string;
  room_capacity: string;
  created_at: string;
  confirmed_name?: string;
  cancelled_name?: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) { router.push('/login'); return; }
        const userData = await response.json();
        setUser(userData);
        const bookingsResponse = await fetch('/api/bookings/my-bookings');
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        }
        setLoading(false);
      } catch (error) { console.error('Error:', error); router.push('/login'); }
    };
    checkAuth();
  }, [router]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed': return { text: 'ยืนยันแล้ว', bg: 'bg-emerald-50', text_color: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: '✓' };
      case 'pending': return { text: 'รอการอนุมัติ', bg: 'bg-amber-50', text_color: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', icon: '⏳' };
      case 'cancelled': return { text: 'ถูกยกเลิก', bg: 'bg-red-50', text_color: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', icon: '✗' };
      default: return { text: status, bg: 'bg-gray-50', text_color: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500', icon: '?' };
    }
  };

  const formatDateTime = (dateTime: string) => new Date(dateTime).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatTime = (dateTime: string) => new Date(dateTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  const filteredBookings = bookings.filter(b => statusFilter === 'all' || b.status === statusFilter);

  const handleRemoveBooking = async (bookingId: number) => {
    if (!window.confirm('ต้องการลบการจองนี้ใช่ไหม?')) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      if (response.ok) { setBookings(prev => prev.filter(b => b.booking_id !== bookingId)); }
      else { const data = await response.json(); alert(data.error || 'เกิดข้อผิดพลาด'); }
    } catch (error) { alert('เกิดข้อผิดพลาดในการลบ'); }
  };

  const handleEditBooking = (bookingId: number) => { router.push(`/booking/edit/${bookingId}`); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                กลับหน้าหลัก
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">สถานะการจอง</h1>
              <p className="text-sm text-gray-500 mt-1">ติดตามสถานะคำขอจองห้องประชุมของคุณ</p>
            </div>
            <Link href="/booking" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              จองห้องประชุม
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            {([['all', 'ทั้งหมด'], ['pending', 'รออนุมัติ'], ['confirmed', 'ยืนยัน'], ['cancelled', 'ยกเลิก']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label} <span className={`ml-1 ${statusFilter === key ? 'text-blue-200' : 'text-gray-400'}`}>({counts[key]})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ไม่มีการจอง</h3>
            <p className="text-gray-500 mb-6 text-sm">ยังไม่มีการจองในหมวดหมู่นี้</p>
            <Link href="/booking" className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              จองห้องประชุม
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const config = getStatusConfig(booking.status);
              return (
                <div key={booking.booking_id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200`}>
                  <div className="p-5 sm:p-6">
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">{booking.title}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text_color} border ${config.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                            {config.text}
                          </span>
                        </div>
                        {booking.description && <p className="text-sm text-gray-500 mt-1">{booking.description}</p>}
                      </div>
                      {booking.status !== 'confirmed' && (
                        <div className="flex items-start gap-2 shrink-0">
                          <button onClick={() => handleEditBooking(booking.booking_id)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100">แก้ไข</button>
                          <button onClick={() => handleRemoveBooking(booking.booking_id)} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors border border-gray-200">ลบ</button>
                        </div>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">ห้องประชุม</p>
                        <p className="text-sm font-medium text-gray-800">{booking.room_name}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">วันเวลา</p>
                        <p className="text-sm font-medium text-gray-800">{formatDateTime(booking.start)}</p>
                        <p className="text-xs text-gray-500">ถึง {formatTime(booking.end)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">ผู้เข้าร่วม</p>
                        <p className="text-sm font-medium text-gray-800">{booking.attendees || '-'} / {booking.room_capacity} คน</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">อุปกรณ์เสริม</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{booking.notes || 'ไม่มี'}</p>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {booking.status === 'pending' && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-xs text-amber-700">กำลังรอการอนุมัติจากผู้ดูแลระบบ</p>
                      </div>
                    )}
                    {booking.status === 'confirmed' && booking.confirmed_name && (
                      <p className="mt-3 text-xs text-emerald-600 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>ยืนยันโดย {booking.confirmed_name}</p>
                    )}
                    {booking.status === 'cancelled' && (
                      <p className="mt-3 text-xs text-red-500 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>ยกเลิกโดย {booking.cancelled_name || '-'}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link to history */}
        <div className="mt-8 text-center">
          <Link href="/history" className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium">
            ดูประวัติการจองทั้งหมด →
          </Link>
        </div>
      </div>
    </div>
  );
}
