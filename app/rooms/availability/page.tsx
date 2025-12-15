'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';


interface Room {
  room_id: number;
  name: string;
  capacity: string;
  equipment: string;
  availability: 'ว่าง' | 'ไม่ว่าง';
  currentBooking?: {
    title: string;
    start: string;
    end: string;
  };
}

interface AvailabilityData {
  rooms: Room[];
  checkedAt: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
}

export default function RoomAvailabilityPage() {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms/availability');
      const data = await response.json();
      
      if (data.success) {
        setAvailabilityData(data.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !availabilityData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสถานะห้องประชุม...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">เกิดข้อผิดพลาด</p>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={fetchAvailability}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">สถานะห้องประชุมวันนี้</h1>
          <p className="text-lg text-gray-600 mb-6">
            ตรวจสอบสถานะห้องประชุมแบบเรียลไทม์
          </p>
          
          {/* Last Updated */}
          {lastUpdated && (
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">
                อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
              </span>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        {availabilityData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ห้องทั้งหมด</p>
                  <p className="text-3xl font-bold text-gray-900">{availabilityData.totalRooms}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ห้องว่าง</p>
                  <p className="text-3xl font-bold text-green-600">{availabilityData.availableRooms}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ห้องไม่ว่าง</p>
                  <p className="text-3xl font-bold text-red-600">{availabilityData.occupiedRooms}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">อัตราการใช้งาน</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {availabilityData.totalRooms > 0 
                      ? Math.round((availabilityData.occupiedRooms / availabilityData.totalRooms) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Room Cards */}
        {availabilityData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availabilityData.rooms.map((room) => (
              <div key={room.room_id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Room Header */}
                <div className={`p-6 ${
                  room.availability === 'ว่าง' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                } text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{room.name}</h3>
                      <p className="text-green-100">{room.capacity}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      room.availability === 'ว่าง' 
                        ? 'bg-green-400 text-green-900' 
                        : 'bg-red-400 text-red-900'
                    }`}>
                      {room.availability}
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {room.availability === 'ว่าง' ? (
                        <Link 
                          href="/booking" 
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          จองห้องประชุม
                        </Link>
                      ) : (
                        <button 
                          disabled
                          className="flex-1 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-center text-sm font-medium cursor-not-allowed"
                        >
                          ไม่ว่าง
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button 
            onClick={fetchAvailability}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ'}
          </button>
          
          <Link 
            href="/" 
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
} 