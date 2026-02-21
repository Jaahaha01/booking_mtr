'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

// Premium color palette
const ROOM_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899', '#f97316'];
const HISTORICAL_COLORS = ['#818cf8', '#22d3ee', '#fbbf24', '#f87171', '#a78bfa', '#34d399', '#f472b6', '#fb923c'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [selectedHistMonth, setSelectedHistMonth] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await fetch('/api/profile');
        if (!profileRes.ok) throw new Error('Unauthorized');
        const userData = await profileRes.json();
        if (userData.role !== 'admin') {
          if (userData.role === 'staff') {
            router.push('/admin/bookings');
          } else {
            router.push('/');
          }
          return;
        }
        setUser(userData);

        const statsRes = await fetch('/api/admin/dashboard/advanced-stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setData(statsData);
        }
      } catch (e) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

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

  // Current period data based on filter
  const periodData = data?.[timeFilter] || {};
  const periodBookings = periodData?.bookings || 0;
  const periodUsers = periodData?.users || 0;
  const periodChart = periodData?.chart || [];

  // Rooms pie chart
  const roomsData = data?.charts?.rooms || [];

  // Historical data
  const historicalData = data?.historical?.monthly || [];

  // Get Thai month/year label
  const getThaiPeriodLabel = () => {
    const now = new Date();
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

    if (timeFilter === 'monthly') {
      return `${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543}`;
    } else if (timeFilter === 'weekly') {
      return `สัปดาห์นี้`;
    } else {
      return `วัน${thaiDays[now.getDay()]}ที่ ${now.getDate()} ${thaiMonths[now.getMonth()]}`;
    }
  };

  // Chart color based on filter
  const chartColor = timeFilter === 'monthly' ? '#6366f1' : timeFilter === 'weekly' ? '#06b6d4' : '#10b981';
  const chartGradient = timeFilter === 'monthly' ? 'indigo' : timeFilter === 'weekly' ? 'cyan' : 'emerald';

  // Custom tooltip with better Thai labels
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      let contextLabel = label;
      if (timeFilter === 'monthly') contextLabel = `วันที่ ${label}`;
      else if (timeFilter === 'daily') contextLabel = `เวลา ${label} น.`;
      else contextLabel = `วัน${label}`;
      return (
        <div className="bg-[#1e2328] border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
          <p className="text-gray-400 text-xs mb-1">{contextLabel}</p>
          <p className="text-white font-bold text-lg">{payload[0].value} <span className="text-sm font-normal text-gray-400">การจอง</span></p>
        </div>
      );
    }
    return null;
  };

  // Custom pie tooltip
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e2328] border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-gray-400 text-sm">{payload[0].value} ครั้ง</p>
        </div>
      );
    }
    return null;
  };

  // Historical Chart Tooltip
  const HistoricalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e2328] border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: p.color }}>
              {p.name}: <span className="font-bold text-white">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Build historical chart data per room
  const buildHistoricalRoomChart = () => {
    const byRoom = data?.historical?.byRoom || [];
    const months = historicalData.map((h: any) => h.month);
    const roomNames = [...new Set(byRoom.map((r: any) => r.room_name))] as string[];

    const chartData = months.map((month: string) => {
      const row: any = { month: historicalData.find((h: any) => h.month === month)?.label || month };
      roomNames.forEach((room: string) => {
        const found = byRoom.find((r: any) => r.month === month && r.room_name === room);
        row[room] = found ? found.bookings : 0;
      });
      return row;
    });

    return { chartData, roomNames };
  };

  const { chartData: histChartData, roomNames: histRoomNames } = buildHistoricalRoomChart();

  return (
    <div className="min-h-screen bg-[#1a1d21] flex">
      <AdminSidebar />

      <div className="flex-1 ml-0 sm:ml-72 p-4 sm:p-8 transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
              แดชบอร์ด
            </h1>
            <p className="text-gray-500 mt-1 ml-5 text-sm">ภาพรวมสถิติและการใช้งานระบบ • {getThaiPeriodLabel()}</p>
          </div>
          {/* Time Filter Tabs */}
          <div className="flex items-center bg-[#23272b] p-1 rounded-xl border border-gray-800 shadow-lg">
            {(['monthly', 'weekly', 'daily'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${timeFilter === filter
                  ? filter === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : filter === 'weekly'
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                {filter === 'monthly' ? 'รายเดือน' : filter === 'weekly' ? 'รายสัปดาห์' : 'รายวัน'}
              </button>
            ))}
          </div>
        </div>

        {/* ============ TOP SECTION — Period Stats ============ */}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Bookings */}
          <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-300">
            <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-500/5 rounded-bl-full"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-medium">จำนวนการจอง</span>
            </div>
            <div className="text-3xl font-bold text-white">{periodBookings} <span className="text-base font-normal text-gray-500">ครั้ง</span></div>
            <p className="text-xs text-gray-500 mt-1">{timeFilter === 'monthly' ? `ข้อมูลเดือนนี้ (${getThaiPeriodLabel()})` : timeFilter === 'weekly' ? 'ข้อมูลสัปดาห์นี้ (จันทร์ - อาทิตย์)' : `ข้อมูลวันนี้ (${getThaiPeriodLabel()})`}</p>
          </div>

          {/* Users */}
          <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group hover:border-cyan-500/30 transition-colors duration-300">
            <div className="absolute right-0 top-0 w-20 h-20 bg-cyan-500/5 rounded-bl-full"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-medium">ผู้ใช้ที่จอง</span>
            </div>
            <div className="text-3xl font-bold text-white">{periodUsers} <span className="text-base font-normal text-gray-500">คน</span></div>
            <p className="text-xs text-gray-500 mt-1">ผู้ใช้ที่มีการจอง{timeFilter === 'monthly' ? 'ในเดือนนี้' : timeFilter === 'weekly' ? 'ในสัปดาห์นี้' : 'ในวันนี้'}</p>
          </div>

          {/* Pending */}
          <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group hover:border-amber-500/30 transition-colors duration-300">
            <div className="absolute right-0 top-0 w-20 h-20 bg-amber-500/5 rounded-bl-full"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-medium">รอการอนุมัติ</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">
              {(parseInt(data?.counts?.pending_users || 0) + parseInt(data?.counts?.pending_bookings || 0))} <span className="text-base font-normal text-gray-500">รายการ</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">การจอง {data?.counts?.pending_bookings || 0} รายการ, ผู้ใช้ {data?.counts?.pending_users || 0} คน</p>
          </div>

          {/* Feedback */}
          <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group hover:border-purple-500/30 transition-colors duration-300">
            <div className="absolute right-0 top-0 w-20 h-20 bg-purple-500/5 rounded-bl-full"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-medium">ความพึงพอใจ</span>
            </div>
            <div className="text-3xl font-bold text-white flex items-baseline gap-1">
              {data?.feedbacks?.average || '0.0'}
              <span className="text-sm font-normal text-gray-500">/ 5.0</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">จาก {data?.feedbacks?.total || 0} รีวิว</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Trend Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#23272b] to-[#1e2328] p-6 rounded-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <span className={`w-1.5 h-6 rounded-full`} style={{ backgroundColor: chartColor }}></span>
                📊 สถิติการจอง
                <span className="text-sm font-normal text-gray-500">
                  — {timeFilter === 'monthly' ? 'แสดงจำนวนการจองแต่ละวันของเดือนนี้' : timeFilter === 'weekly' ? 'แสดงจำนวนการจองแต่ละวันในสัปดาห์นี้' : 'แสดงจำนวนการจองแต่ละชั่วโมงของวันนี้'}
                </span>
              </h3>
            </div>
            {periodChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={periodChart} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`color${chartGradient}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3239" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#2d3239' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="bookings" stroke={chartColor} strokeWidth={2.5} fillOpacity={1} fill={`url(#color${chartGradient})`} dot={{ fill: chartColor, strokeWidth: 0, r: 3 }} activeDot={{ r: 6, stroke: chartColor, strokeWidth: 2, fill: '#1a1d21' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-600">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm">ไม่มีข้อมูลในช่วงเวลานี้</p>
                </div>
              </div>
            )}
          </div>

          {/* Room Usage Pie Chart */}
          <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full bg-purple-500"></span>
              สัดส่วนการใช้ห้อง
            </h3>
            {roomsData.length > 0 && roomsData.some((r: any) => r.value > 0) ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={roomsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={0}
                    >
                      {roomsData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="mt-2 space-y-1.5">
                  {roomsData.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ROOM_COLORS[index % ROOM_COLORS.length] }}></span>
                        <span className="text-gray-400 text-xs">{entry.name}</span>
                      </div>
                      <span className="text-gray-300 font-medium text-xs">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-600">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <p className="text-sm">ไม่มีข้อมูลการใช้ห้อง</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback + Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Feedback Distribution */}
          <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full bg-yellow-500"></span>
              ความพึงพอใจของผู้ใช้งาน
            </h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data?.feedbacks?.distribution ? data.feedbacks.distribution[star - 1] : 0;
                const total = data?.feedbacks?.total || 1;
                const percent = (count / total) * 100;

                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center w-12 text-sm font-bold text-gray-400">
                      {star} <span className="text-yellow-400 ml-1">★</span>
                    </div>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-right text-xs text-gray-500 font-medium">{count}</div>
                  </div>
                );
              })}
            </div>
            <Link href="/admin/feedbacks" className="block text-center mt-6 text-indigo-400 text-sm font-medium hover:text-indigo-300 transition-colors">
              ดูความคิดเห็นทั้งหมด →
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 rounded-2xl shadow-lg shadow-indigo-900/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-1">จัดการระบบ</h3>
              <p className="text-indigo-200 text-sm mb-6">เข้าถึงส่วนต่างๆ ของระบบได้อย่างรวดเร็ว</p>

              <div className="space-y-2.5">
                <Link href="/admin/bookings" className="block w-full bg-white/10 hover:bg-white/20 p-3.5 rounded-xl transition-all duration-200 flex items-center group backdrop-blur-sm border border-white/5">
                  <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center mr-3 group-hover:bg-white/25 transition-colors">📅</span>
                  <div>
                    <span className="text-white font-medium text-sm">ตรวจสอบการจอง</span>
                    <p className="text-indigo-200 text-xs">{data?.counts?.pending_bookings || 0} รอการอนุมัติ</p>
                  </div>
                </Link>
                <Link href="/admin/users" className="block w-full bg-white/10 hover:bg-white/20 p-3.5 rounded-xl transition-all duration-200 flex items-center group backdrop-blur-sm border border-white/5">
                  <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center mr-3 group-hover:bg-white/25 transition-colors">👥</span>
                  <div>
                    <span className="text-white font-medium text-sm">จัดการผู้ใช้งาน</span>
                    <p className="text-indigo-200 text-xs">{data?.counts?.total_users || 0} คนในระบบ</p>
                  </div>
                </Link>
                <Link href="/admin/rooms" className="block w-full bg-white/10 hover:bg-white/20 p-3.5 rounded-xl transition-all duration-200 flex items-center group backdrop-blur-sm border border-white/5">
                  <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center mr-3 group-hover:bg-white/25 transition-colors">🏢</span>
                  <div>
                    <span className="text-white font-medium text-sm">จัดการห้องประชุม</span>
                    <p className="text-indigo-200 text-xs">ดูและจัดการห้อง</p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-200">System Status</span>
                <span className="flex items-center text-emerald-300 gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ BOTTOM SECTION — Historical Monthly Statistics (Independent) ============ */}
        <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] p-6 rounded-2xl border border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full bg-amber-500"></span>
              สถิติย้อนหลังรายเดือน
              <span className="text-sm font-normal text-gray-500">(12 เดือนล่าสุด)</span>
            </h3>
          </div>

          {histChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={histChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3239" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#2d3239' }} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<HistoricalTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value: string) => <span className="text-gray-400 text-xs">{value}</span>}
                  />
                  {histRoomNames.map((room, index) => (
                    <Bar
                      key={room}
                      dataKey={room}
                      name={room}
                      fill={HISTORICAL_COLORS[index % HISTORICAL_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              {/* Summary table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wider">เดือน</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wider">จำนวนการจอง</th>
                      <th className="text-right py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wider">ผู้ใช้ที่จอง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.map((h: any, i: number) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-gray-300 font-medium">{h.label}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="text-indigo-400 font-bold">{h.bookings}</span>
                          <span className="text-gray-600 ml-1">ครั้ง</span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="text-cyan-400 font-bold">{h.unique_users}</span>
                          <span className="text-gray-600 ml-1">คน</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-600">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm">ยังไม่มีข้อมูลสถิติย้อนหลัง</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
