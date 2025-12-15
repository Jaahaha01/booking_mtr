'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const AdminSidebar = dynamic(() => import('../../components/AdminSidebar'), { ssr: false });

interface RoomStats {
  id: number;
  name: string;
  capacity: string;
  booking_count: number;
  unique_users: number;
  avg_duration_hours: number;
  total_hours: number;
}

interface DayOfWeekStats {
  day_name: string;
  booking_count: number;
  avg_duration_hours: number;
}

interface PeakHourStats {
  hour: number;
  booking_count: number;
  rooms_used: number;
}

interface RecentBooking {
  room_name: string;
  title: string;
  start: string;
  end: string;
  username: string;
  duration_hours: number;
}

interface StatisticsData {
  mostBookedRooms: RoomStats[];
  monthlyBookedRooms: RoomStats[];
  dayOfWeekTrends: DayOfWeekStats[];
  peakHours: PeakHourStats[];
  recentBookings: RecentBooking[];
  generatedAt: string;
  currentMonth: number;
  currentYear: number;
}

export default function RoomStatisticsPage() {
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all-time' | 'monthly' | 'trends' | 'recent'>('all-time');

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms/statistics');
      const data = await response.json();
      
      if (data.success) {
        setStatisticsData(data.data);
        setError(null);
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayNameInThai = (dayName: string) => {
    const dayMap: { [key: string]: string } = {
      'Monday': 'จันทร์',
      'Tuesday': 'อังคาร',
      'Wednesday': 'พุธ',
      'Thursday': 'พฤหัสบดี',
      'Friday': 'ศุกร์',
      'Saturday': 'เสาร์',
      'Sunday': 'อาทิตย์'
    };
    return dayMap[dayName] || dayName;
  };

  const getMonthNameInThai = (month: number) => {
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return monthNames[month - 1];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลสถิติ...</p>
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
            onClick={fetchStatistics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
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
      <div className="flex-1 ml-0 md:ml-64 px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">สถิติการจองห้องประชุม</h1>
          <p className="text-lg text-gray-600 mb-6">
            วิเคราะห์ข้อมูลการใช้งานห้องประชุมและแนวโน้มการจอง
          </p>
          
          {statisticsData && (
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">
                อัปเดตล่าสุด: {new Date(statisticsData.generatedAt).toLocaleString('th-TH')}
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('all-time')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all-time'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🏆 ห้องที่จองเยอะที่สุด (ตลอดกาล)
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'monthly'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📅 ห้องที่จองเยอะที่สุด (เดือน{statisticsData?.currentMonth ? ` ${getMonthNameInThai(statisticsData.currentMonth)}` : ''})
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'trends'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 แนวโน้มการจอง
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⏰ การจองล่าสุด
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'all-time' && statisticsData && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ห้องที่จองเยอะที่สุด (ตลอดกาล)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {statisticsData.mostBookedRooms.map((room, index) => (
                    <div key={room.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">{room.name}</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">จำนวนการจอง:</span>
                          <span className="font-semibold text-blue-600">{room.booking_count} ครั้ง</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ผู้ใช้ที่แตกต่าง:</span>
                          <span className="font-semibold text-green-600">{room.unique_users} คน</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">เวลาจองเฉลี่ย:</span>
                          <span className="font-semibold text-purple-600">{room.avg_duration_hours?.toFixed(1) || 0} ชม.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">เวลารวม:</span>
                          <span className="font-semibold text-orange-600">{room.total_hours || 0} ชม.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ความจุ:</span>
                          <span className="font-semibold text-gray-700">{room.capacity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'monthly' && statisticsData && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ห้องที่จองเยอะที่สุด (เดือน{getMonthNameInThai(statisticsData.currentMonth)})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {statisticsData.monthlyBookedRooms.map((room, index) => (
                    <div key={room.id} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-green-500'
                          }`}>
                            {index + 1}
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">{room.name}</h4>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">จำนวนการจอง:</span>
                          <span className="font-semibold text-green-600">{room.booking_count} ครั้ง</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ผู้ใช้ที่แตกต่าง:</span>
                          <span className="font-semibold text-blue-600">{room.unique_users} คน</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">เวลาจองเฉลี่ย:</span>
                          <span className="font-semibold text-purple-600">{room.avg_duration_hours?.toFixed(1) || 0} ชม.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">เวลารวม:</span>
                          <span className="font-semibold text-orange-600">{room.total_hours || 0} ชม.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'trends' && statisticsData && (
              <div className="space-y-8">
                {/* Day of Week Trends */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">แนวโน้มการจองตามวันในสัปดาห์</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                    {statisticsData.dayOfWeekTrends.map((day) => (
                      <div key={day.day_name} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 text-center">
                        <h4 className="font-semibold text-gray-900 mb-2">{getDayNameInThai(day.day_name)}</h4>
                        <div className="text-2xl font-bold text-purple-600 mb-1">{day.booking_count}</div>
                        <div className="text-sm text-gray-600">การจอง</div>
                        <div className="text-sm text-gray-500 mt-1">
                          เฉลี่ย {day.avg_duration_hours?.toFixed(1) || 0} ชม.
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Peak Hours */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ชั่วโมงที่มีการจองสูงสุด</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {statisticsData.peakHours.slice(0, 12).map((hour) => (
                      <div key={hour.hour} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200 text-center">
                        <h4 className="font-semibold text-gray-900 mb-2">{hour.hour}:00</h4>
                        <div className="text-2xl font-bold text-orange-600 mb-1">{hour.booking_count}</div>
                        <div className="text-sm text-gray-600">การจอง</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {hour.rooms_used} ห้อง
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recent' && statisticsData && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">การจองล่าสุด (7 วันย้อนหลัง)</h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ห้องประชุม</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">หัวข้อ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ระยะเวลา</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้จอง</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statisticsData.recentBookings.map((booking, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {booking.room_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(booking.start)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTime(booking.start)} - {formatTime(booking.end)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {booking.duration_hours} ชม.
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {booking.username}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <button 
            onClick={fetchStatistics}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังอัปเดต...' : 'อัปเดตสถิติ'}
          </button>
          
          <Link 
            href="/rooms/availability" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ตรวจสอบห้องว่าง
          </Link>
          
          <Link 
            href="/booking" 
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            จองห้องประชุม
          </Link>
          
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