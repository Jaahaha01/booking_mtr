'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/app/components/AdminSidebar';

interface User {
  user_id: number;
  username: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  role: string;
  verification_status: string;
  address: string;
  organization: string;
  created_at: string;
  identity_card?: string;
  image?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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

        // ดึงข้อมูลผู้ใช้ทั้งหมด
        await fetchUsers();
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleUpdateUser = async (userId: number, field: string, value: any) => {
    // ตรวจสอบว่าผู้ใช้ที่จะแก้ไขเป็น staff หรือ admin หรือไม่
    const targetUser = users.find(u => u.user_id === userId);
    if (targetUser && (targetUser.role === 'staff' || targetUser.role === 'admin')) {
      setError('คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลเจ้าหน้าที่หรือผู้ดูแลระบบ');
      return;
    }

  setUpdating(userId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการอัปเดต');
        setUpdating(null);
        return;
      }

      setSuccess('อัปเดตข้อมูลสำเร็จ');
      await fetchUsers(); // รีเฟรชข้อมูล
      setUpdating(null);

      // ลบข้อความสำเร็จหลังจาก 3 วินาที
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    // ตรวจสอบว่าผู้ใช้ที่จะลบเป็น staff หรือ admin หรือไม่
    const targetUser = users.find(u => u.user_id === userId);
    if (targetUser && (targetUser.role === 'staff' || targetUser.role === 'admin')) {
      setError('คุณไม่มีสิทธิ์ในการลบเจ้าหน้าที่หรือผู้ดูแลระบบ');
      return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) {
      return;
    }

    setUpdating(userId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'เกิดข้อผิดพลาดในการลบ');
        setUpdating(null);
        return;
      }

      setSuccess('ลบผู้ใช้สำเร็จ');
      await fetchUsers(); // รีเฟรชข้อมูล
      setUpdating(null);

      // ลบข้อความสำเร็จหลังจาก 3 วินาที
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setUpdating(null);
    }
  };

  // กรองข้อมูลผู้ใช้
  const filteredUsers = users.filter(user => {
    // ซ่อน staff และ admin จากการแสดงผล
    if (user.role === 'staff' || user.role === 'admin') {
      return false;
    }
    
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.fname} ${user.lname}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.verification_status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
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
        <div className="w-64">
          <AdminSidebar />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 px-12 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link 
              href="/admin/dashboard" 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium mb-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              กลับไปแดชบอร์ด
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">จัดการผู้ใช้</h1>
            <p className="text-gray-600 mt-1">จัดการข้อมูลผู้ใช้ในระบบ</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
            </p>
            <p className="font-medium text-gray-800">{user?.firstname} {user?.lastname}</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหา
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ค้นหาด้วยชื่อ, อีเมล, หรือชื่อผู้ใช้"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บทบาท
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="user">ผู้ใช้</option>
                <option value="student">นักศึกษา</option>
                <option value="teacher">อาจารย์</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สถานะการยืนยัน
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="approved">ยืนยันแล้ว</option>
                <option value="pending">รอยืนยัน</option>
                <option value="rejected">ถูกปฏิเสธ</option>
                <option value="null">ยังไม่ยืนยัน</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะการยืนยัน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สมัคร
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {userItem.image ? (
                          <img
                            src={userItem.image}
                            alt={`${userItem.fname} ${userItem.lname}`}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium ${userItem.image ? 'hidden' : ''}`}>
                          {userItem.fname ? userItem.fname.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.fname} {userItem.lname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userItem.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{userItem.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={userItem.role}
                        onChange={(e) => handleUpdateUser(userItem.user_id, 'role', e.target.value)}
                        disabled={updating === userItem.user_id}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="user">ผู้ใช้</option>
                        <option value="student">นักศึกษา</option>
                        <option value="teacher">อาจารย์</option>
                        {user?.role === 'admin' && (
                          <option value="staff">เจ้าหน้าที่</option>
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <select
                          value={userItem.verification_status || ''}
                          onChange={(e) => handleUpdateUser(userItem.user_id, 'verification_status', e.target.value || null)}
                          disabled={updating === userItem.user_id}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">ยังไม่ยืนยัน</option>
                          <option value="pending">รอยืนยัน</option>
                          <option value="approved">ยืนยันแล้ว</option>
                          <option value="rejected">ถูกปฏิเสธ</option>
                        </select>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userItem.verification_status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : userItem.verification_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : userItem.verification_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {userItem.verification_status === 'approved' 
                            ? '✓ ยืนยันแล้ว' 
                            : userItem.verification_status === 'pending'
                            ? '⏳ รอยืนยัน'
                            : userItem.verification_status === 'rejected'
                            ? '✗ ถูกปฏิเสธ'
                            : '❓ ยังไม่ยืนยัน'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {updating === userItem.user_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <>
                                                      <button
                                                        onClick={() => {
                                                          const message = `ข้อมูลผู้ใช้\n\n` +
                                                            `ชื่อ-นามสกุล: ${userItem.fname || '-'} ${userItem.lname || '-'}\n` +
                                                            `อีเมล: ${userItem.email || '-'}\n` +
                                                            `เบอร์โทร: ${userItem.phone || '-'}\n` +
                                                            `องค์กร: ${userItem.organization || '-'}\n` +
                                                            `ที่อยู่: ${userItem.address || '-'}\n` +
                                                            `หมายเลขบัตรประชาชน: ${userItem.identity_card || '-'}\n`;
                                                          alert(message);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors mr-3"
                                                        title="ดูข้อมูลผู้ใช้ทั้งหมด"
                                                      >
                                                        ดูข้อมูลยืนยันตัวตน?
                                                      </button>
                                                      <button
                                                        onClick={() => handleDeleteUser(userItem.user_id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                        disabled={userItem.user_id === user?.user_id}
                                                      >
                                                        ลบ
                                                      </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบผู้ใช้</h3>
              <p className="mt-1 text-sm text-gray-500">
                ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ผู้ใช้ทั้งหมด</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ยืนยันแล้ว</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.verification_status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">รอยืนยัน</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.verification_status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ผู้ดูแลระบบ</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
