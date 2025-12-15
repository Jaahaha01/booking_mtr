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
  // ...existing code...

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

        // ดึงข้อมูลการจองของผู้ใช้
        const bookingsResponse = await fetch('/api/bookings/my-bookings');
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          setBookings(Array.isArray(bookingsData) ? bookingsData : []);
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

  const filteredBookings = bookings.filter(booking => {
  return true;
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

  function AttendeesList({ attendees, capacity }: { attendees: string, capacity?: string }) {
    // attendees is now a number (string or number), not a comma-separated list
    const attendeeCount = Number(attendees) || 0;
    return (
      <span className="text-xs text-gray-500">
        {attendeeCount} / {capacity || '-'}
      </span>
    );
  }

  const handleRemoveBooking = async (bookingId: number) => {
    if (!window.confirm('ต้องการลบการจองนี้ใช่ไหม?')) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
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
    }
  };

  const handleEditBooking = (bookingId: number) => {
    // Redirect to edit page (assume /booking/edit/[id])
  router.push(`/booking/edit/${bookingId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">สถานะการจอง</h1>
        </div>

        {/* Filter Tabs */}
        {/* ...filter tabs removed... */}

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
              <p className="text-gray-500 mb-6">
                คุณยังไม่มีการจองห้องประชุม
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                จองห้องประชุม
              </Link>
            </div>
          ) : (
            Array.isArray(filteredBookings) && filteredBookings.map((booking) => (
              <div key={booking.booking_id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {booking.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    {booking.description && (
                      <p className="text-gray-600 mb-3">{booking.description}</p>
                    )}
                  </div>
                  {booking.status !== 'confirmed' && (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => handleEditBooking(booking.booking_id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleRemoveBooking(booking.booking_id)}
                          className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors duration-200"
                        >
                          ลบ
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      สร้างเมื่อ: {new Date(booking.created_at).toLocaleDateString('th-TH')}
                    </span>
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

                {booking.attendees && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-1">ผู้เข้าร่วม</h4>
                    <AttendeesList attendees={booking.attendees} capacity={booking.room_capacity} />
                  </div>
                )}

                {booking.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-1">อุปกรณ์เสริม</h4>
                    <p className="text-sm text-gray-600">{booking.notes}</p>
                  </div>
                )}

                {booking.status === 'pending' && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-yellow-700">
                        การจองของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ
                      </p>
                    </div>
                  </div>
                )}
                {booking.status === 'confirmed' && booking.confirmed_name && (
                  <p className="text-green-700 text-sm mb-1">ยืนยันโดย {booking.confirmed_name}</p>
                )}
                {booking.status === 'cancelled' && (
                  <p className="text-red-700 text-sm mb-1">ยกเลิกโดย {booking.cancelled_name || '-'}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
