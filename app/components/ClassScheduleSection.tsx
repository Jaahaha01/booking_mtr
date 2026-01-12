'use client';
import { useState, useEffect } from 'react';

interface Schedule {
  schedule_id: number;
  room_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
}


// ห้องทั้งหมดในระบบ (room_id จาก rooms)
const allRooms: { room_id: number; name: string; room_number: string }[] = [
  { room_id: 1, name: 'ห้องเรียนรวม', room_number: '6102' },
  { room_id: 2, name: 'ห้องประชุมคณะ', room_number: '6302' },
  { room_id: 3, name: 'ห้องสำนักงาน', room_number: '6101' },
];

const daysOfWeek = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

export default function ClassScheduleSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(allRooms[0].room_id);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableRoomsWithData, setAvailableRoomsWithData] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // ดึงข้อมูลตารางสอนจาก API
  const fetchSchedules = async (roomId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/room-schedules?room_id=${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      const data = await response.json();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // ไม่ต้อง fetch ห้องที่มีตารางสอน ใช้ allRooms แทน

  // โหลดข้อมูลเมื่อเลือกห้องใหม่
  useEffect(() => {
    if (isExpanded) {
      fetchSchedules(selectedRoom);
    }
  }, [selectedRoom, isExpanded]);

  // ไม่ต้องโหลดรายการห้องจาก API ใช้ allRooms

  const getScheduleForDay = (day: string): Schedule[] => {
    return schedules.filter(schedule => schedule.day_of_week === day);
  };

  const formatTime = (timeString: string): string => {
    // แปลง "08:00:00" เป็น "08:00"
    return timeString.substring(0, 5);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-sky-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <button
            onClick={toggleExpanded}
            className="group inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <svg 
              className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>ดูตารางสอน</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="mt-6 animate-fade-in">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-4">
                ตารางเรียนประจำสัปดาห์
              </h2>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="animate-slide-down">
            {/* Room Selector */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-xl p-2 shadow-lg border border-sky-100">
                <div className="flex flex-wrap gap-2 justify-center">
                  {allRooms.map((room) => (
                    <button
                      key={room.room_id}
                      onClick={() => setSelectedRoom(room.room_id)}
                      className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                        selectedRoom === room.room_id
                          ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md transform scale-105'
                          : 'text-gray-600 hover:bg-sky-50 hover:text-sky-600 bg-white border border-sky-200 hover:border-sky-300'
                      }`}
                    >
                      {room.name} ({room.room_number})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-sky-100">
              <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white p-3 sm:p-6">
                <h3 className="text-lg sm:text-2xl font-bold">
                  {(() => {
                    const r = allRooms.find(r => r.room_id === selectedRoom);
                    return r ? `${r.name} (${r.room_number})` : '-';
                  })()}
                </h3>
                <p className="text-sky-100 mt-1 text-xs sm:text-base">ตารางเวลาเรียนประจำสัปดาห์</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-sky-100">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 bg-sky-50">วัน</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 bg-sky-50">เริ่ม</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 bg-sky-50">จบ</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-700 bg-sky-50">วิชา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-8 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-gray-600">กำลังโหลดข้อมูล...</span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={4} className="py-8 px-6 text-center">
                          <div className="text-red-500">
                            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>เกิดข้อผิดพลาด: {error}</p>
                          </div>
                        </td>
                      </tr>
                    ) : daysOfWeek.map((day, dayIndex) => {
                      const daySchedules = getScheduleForDay(day);
                      
                      if (daySchedules.length === 0) {
                        return (
                          <tr key={day} className={`border-b border-gray-100 ${dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-sky-100 transition-colors duration-200`}>
                            <td className="py-2 px-2 sm:px-4 font-medium text-gray-900">{day}</td>
                            <td className="py-2 px-2 sm:px-4 text-gray-500" colSpan={3}>
                              <span className="italic">ไม่มี</span>
                            </td>
                          </tr>
                        );
                      }
                      
                      return daySchedules.map((schedule: Schedule, scheduleIndex: number) => (
                        <tr 
                          key={`${day}-${scheduleIndex}`} 
                          className={`border-b border-gray-100 ${dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-sky-100 transition-colors duration-200`}
                        >
                          <td className="py-2 px-2 sm:px-4 font-medium text-gray-900">
                            {scheduleIndex === 0 ? day : ''}
                          </td>
                          <td className="py-2 px-2 sm:px-4 text-gray-700 font-medium">
                            {formatTime(schedule.start_time)}
                          </td>
                          <td className="py-2 px-2 sm:px-4 text-gray-700 font-medium">
                            {formatTime(schedule.end_time)}
                          </td>
                          <td className="py-2 px-2 sm:px-4">
                            <span className="text-gray-900 font-medium text-xs sm:text-sm">
                              {schedule.subject}
                            </span>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-4 border-t border-sky-100">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>ตารางเวลาอาจมีการเปลี่ยนแปลง กรุณาตรวจสอบอีกครั้งก่อนการจอง</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); max-height: 0; }
          to { opacity: 1; transform: translateY(0); max-height: 1000px; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slide-down {
          animation: slideDown 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}
