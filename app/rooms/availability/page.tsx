'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Room {
  room_id: number;
  name: string;
  room_number: string;
  capacity: string;
  equipment: string;
  description: string;
  availability: 'ว่าง' | 'ไม่ว่าง';
  rating: string;
  review_count: number;
  image: string;
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
  const router = useRouter();
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    const interval = setInterval(fetchAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRoomIcon = (roomName: string) => {
    // Single Building Icon for all rooms as requested
    return (
      <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  };

  const handleBookClick = (roomId: number) => {
    router.push(`/booking?room_id=${roomId}`);
  };

  if (loading && !availabilityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสถานะห้อง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">สถานะห้องประชุม</h1>
              <p className="text-gray-500 mt-1">ตรวจสอบความพร้อมและจองห้องประชุมได้ทันที</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAvailability}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                อัปเดตข้อมูล
              </button>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </div>

          {/* Search Box */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อห้องประชุม..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Quick Stats */}
          {availabilityData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">ห้องทั้งหมด</p>
                <p className="text-2xl font-bold text-blue-900">{availabilityData.totalRooms}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                <p className="text-sm text-green-600 font-medium">ว่างพร้อมใช้งาน</p>
                <p className="text-2xl font-bold text-green-900">{availabilityData.availableRooms}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-600 font-medium">ไม่ว่าง</p>
                <p className="text-2xl font-bold text-red-900">{availabilityData.occupiedRooms}</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-sm text-purple-600 font-medium">เวลาตรวจสอบ</p>
                <p className="text-lg font-bold text-purple-900">
                  {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : '-'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {availabilityData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availabilityData.rooms
              .filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((room) => (
                <div
                  key={room.room_id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
                >
                  {/* Icon/Image Area */}
                  <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
                    {/* Dynamic Icon based on Room Name */}
                    <div className="transform transition-transform duration-500 group-hover:scale-110 text-gray-400">
                      {getRoomIcon(room.name)}
                    </div>

                    {/* Availability Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`
                       px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm
                       ${room.availability === 'ว่าง'
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'}
                     `}>
                        {room.availability}
                      </span>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute bottom-4 left-4 z-10">
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                        <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-800">{room.rating}</span>
                        <span className="text-xs text-gray-500">({room.review_count} รีวิว)</span>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {room.name}
                      </h3>
                      <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                        {room.room_number}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <p className="text-sm text-gray-500 line-clamp-2">{room.description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>ความจุ {room.capacity} ท่าน</span>
                      </div>

                      {/* Current Booking Info (Only show if room is occupied/busy) */}
                      {room.availability === 'ไม่ว่าง' && room.currentBooking ? (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-xs text-red-500 font-bold mb-1">กำลังใช้งาน</p>
                          <p className="text-sm font-bold text-gray-800 truncate">{room.currentBooking.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            ถึงเวลา {new Date(room.currentBooking.end).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ) : (
                        // Spacer to maintain height if needed, or just standard spacing
                        <div className="mt-4 p-3 h-[86px] flex items-center justify-center text-sm text-gray-400 border border-transparent">
                          {/* Optional: Show 'Available' text properly or just keep empty */}
                          {/* User asked to show 'ว่างอยู่' effectively by NOT showing 'Currently using' */}
                        </div>
                      )}
                    </div>

                    {/* Footer / Action */}
                    <div className="mt-auto pt-4 border-t border-gray-50">
                      <button
                        onClick={() => handleBookClick(room.room_id)}
                        disabled={room.availability === 'ไม่ว่าง'}
                        className={`
                        w-full py-3 px-4 rounded-xl font-bold shadow-sm transition-all duration-200
                        flex items-center justify-center gap-2
                        ${room.availability === 'ว่าง'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                      `}
                      >
                        {room.availability === 'ว่าง' ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            จองห้องประชุม
                          </>
                        ) : (
                          'ไม่ว่างชั่วคราว'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            {availabilityData.rooms.filter((room) => room.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="col-span-full text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500 text-lg font-medium">ไม่พบห้องที่ค้นหา</p>
                <p className="text-gray-400 text-sm mt-1">ลองค้นหาด้วยชื่ออื่น</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
