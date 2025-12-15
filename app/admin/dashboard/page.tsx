'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRooms: number;
  pendingVerifications: number;
  approvedUsers: number;
  pendingBookings: number;
  confirmedBookings: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // ตรวจสอบการเข้าสู่ระบบและสิทธิ์ admin
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        
        const userData = await response.json();
        setUser(userData);

        // ตรวจสอบสิทธิ์ admin หรือ staff
        if (userData.role !== 'admin' && userData.role !== 'staff') {
          router.push('/');
          return;
        }

        // ดึงข้อมูลสถิติ
        await fetchStats();
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
        <div className="w-64">
          <AdminSidebar />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 ml-12 px-12 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {user?.role === 'admin' ? 'แดชบอร์ดผู้ดูแลระบบ' : 'แดชบอร์ดเจ้าหน้าที่'}
            </h1>
            <p className="text-gray-600 mt-1">จัดการระบบจองห้องประชุม</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
            </p>
            <p className="font-medium text-gray-800">{user?.firstname} {user?.lastname}</p>
          </div>
        </div>

        {/* Stats Cards: แสดงทั้ง admin และ staff */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">ผู้ใช้ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">ยืนยันแล้ว</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">รอยืนยัน</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">การจองทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* User Management */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">จัดการผู้ใช้</h2>
              <Link href="/admin/users" className="text-blue-600 hover:text-blue-700 font-medium text-sm">ดูทั้งหมด →</Link>
            </div>
            <Link 
              href="/admin/users?filterStatus=pending"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  รอยืนยันตัวตน
                  {(stats?.pendingVerifications ?? 0) > 0 && (
                    <span className="animate-bounce inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {stats?.pendingVerifications ?? 0}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">ตรวจสอบและอนุมัติการยืนยันตัวตน</p>
              </div>
            </Link>
          </div>

          {/* Booking Management */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">จัดการการจอง</h2>
              <Link href="/admin/bookings" className="text-blue-600 hover:text-blue-700 font-medium text-sm">ดูทั้งหมด →</Link>
            </div>
            <Link 
              href="/admin/bookings"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  จัดการการจอง
                  {(stats?.pendingBookings ?? 0) > 0 && (
                    <span className="animate-bounce inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {stats?.pendingBookings ?? 0}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">ดู แก้ไข และลบการจองห้องประชุม</p>
              </div>
            </Link>
          </div>
        </div>

        {/* System Management */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">จัดการระบบ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                href="/admin/rooms"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">จัดการห้องประชุม</h3>
                  <p className="text-sm text-gray-500">เพิ่ม แก้ไข และลบห้องประชุม</p>
                </div>
              </Link>
              <Link 
                href="/admin/statistics"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">สถิติการใช้งาน</h3>
                  <p className="text-sm text-gray-500">ดูสถิติการจองและการใช้งานห้องประชุม</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
