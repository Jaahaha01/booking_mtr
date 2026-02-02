'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'monthly' | 'weekly' | 'daily'>('all');

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check Auth
        const profileRes = await fetch('/api/profile');
        if (!profileRes.ok) throw new Error('Unauthorized');
        const userData = await profileRes.json();
        if (userData.role !== 'admin' && userData.role !== 'staff') {
          router.push('/');
          return;
        }
        setUser(userData);

        // 2. Fetch Advanced Stats
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Determine which chart to show based on filter
  const renderMainChart = () => {
    if (!data?.charts) return null;

    let chartData = [];
    const XKey = 'name';
    const dataKey = 'bookings';
    let color = '#3b82f6'; // blue-500

    if (timeFilter === 'all' || timeFilter === 'monthly') {
      chartData = data.charts.monthly;
    } else if (timeFilter === 'weekly') {
      chartData = data.charts.weekly;
      color = '#8b5cf6'; // violet-500
    } else {
      chartData = data.charts.daily;
      color = '#10b981'; // emerald-500
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey={XKey} />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill="url(#colorVis)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <div className="flex-1 ml-0 sm:ml-72 p-8 transition-all duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">แดชบอร์ด</h1>
            <p className="text-gray-500 mt-1">ภาพรวมสถิติและการใช้งานระบบ</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
            {(['all', 'monthly', 'weekly', 'daily'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeFilter === filter
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {filter === 'all' ? 'ทั้งหมด' : filter === 'monthly' ? 'รายเดือน' : filter === 'weekly' ? 'รายสัปดาห์' : 'รายวัน'}
              </button>
            ))}
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm font-medium mb-2">การจองทั้งหมด</div>
            <div className="text-3xl font-bold text-gray-800">{data?.counts?.total_bookings || 0}</div>
            <div className="text-xs text-green-600 mt-2 flex items-center">
              <span className="bg-green-100 px-1.5 py-0.5 rounded mr-1">Active</span>
              รายการ
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm font-medium mb-2">ผู้ใช้งานทั้งหมด</div>
            <div className="text-3xl font-bold text-gray-800">{data?.counts?.total_users || 0}</div>
            <div className="text-xs text-blue-600 mt-2 flex items-center">
              <span className="bg-blue-100 px-1.5 py-0.5 rounded mr-1">Users</span>
              คน
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-400/10 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="text-gray-500 text-sm font-medium mb-2">รอการอนุมัติ</div>
            <div className="text-3xl font-bold text-yellow-600">
              {(parseInt(data?.counts?.pending_users || 0) + parseInt(data?.counts?.pending_bookings || 0))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {data?.counts?.pending_bookings} การจอง, {data?.counts?.pending_users} ผู้ใช้
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-400/10 rounded-bl-full -mr-4 -mt-4"></div>
            <div className="text-gray-500 text-sm font-medium mb-2">คะแนนความพึงพอใจ</div>
            <div className="text-3xl font-bold text-purple-600">{data?.feedbacks?.average || '0.0'}</div>
            <div className="text-xs text-gray-500 mt-2">
              จากทั้งหมด {data?.feedbacks?.total || 0} รีวิว
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Trend Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <span className={`w-3 h-8 rounded-full mr-3 ${timeFilter === 'monthly' ? 'bg-blue-500' : timeFilter === 'weekly' ? 'bg-violet-500' : 'bg-emerald-500'}`}></span>
              สถิติการจอง ({timeFilter === 'monthly' ? 'รายเดือน' : timeFilter === 'weekly' ? 'รายสัปดาห์' : 'รายวัน'})
            </h3>
            {renderMainChart()}
          </div>

          {/* Room Usage Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-6">สัดส่วนการใช้ห้อง</h3>
            <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.charts?.rooms || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.charts?.rooms?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend Overlay */}
              <div className="absolute bottom-0 left-0 w-full flex justify-center gap-4 text-xs text-gray-500">
                {data?.charts?.rooms?.slice(0, 3).map((entry: any, index: number) => (
                  <div key={index} className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rating Distribution */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">ความพึงพอใจของผู้ใช้งาน</h3>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data?.feedbacks?.distribution ? data.feedbacks.distribution[star - 1] : 0;
                const total = data?.feedbacks?.total || 1;
                const percent = (count / total) * 100;

                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center w-12 text-sm font-bold text-gray-600">
                      {star} <span className="text-yellow-400 ml-1">★</span>
                    </div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-right text-xs text-gray-500">{count}</div>
                  </div>
                );
              })}
            </div>
            <Link href="/admin/feedbacks" className="block text-center mt-6 text-blue-600 text-sm font-medium hover:underline">
              ดูความคิดเห็นทั้งหมด →
            </Link>
          </div>

          {/* Quick Actions redundant but kept for layout balance or maybe replace with Recent Activity */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">จัดการระบบ</h3>
              <p className="text-blue-100 mb-6">เข้าถึงส่วนต่างๆ ของระบบได้อย่างรวดเร็ว</p>

              <div className="space-y-3">
                <Link href="/admin/bookings" className="block w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-3">📅</span>
                  ตรวจสอบการจอง
                </Link>
                <Link href="/admin/users" className="block w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mr-3">👥</span>
                  จัดการผู้ใช้งาน
                </Link>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-200">System Status</span>
                <span className="flex items-center text-green-300 gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
