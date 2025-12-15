'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VerifyForm {
  identity_card: string;
  address: string;
  organization: string;
}

type VerificationStatus = 'approved' | 'pending' | 'rejected' | string;

interface UserProfile extends Record<string, unknown> {
  verification_status?: VerificationStatus;
}

export default function VerifyIdentityPage() {
  const router = useRouter();
  const [form, setForm] = useState<VerifyForm>({
    identity_card: '',
    address: '',
    organization: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // ตรวจสอบการเข้าสู่ระบบ
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        
        const userData: UserProfile = await response.json();
        setUser(userData);

        // ถ้ายืนยันตัวตนแล้ว ให้ไปหน้าหลัก
        if (userData.verification_status === 'approved') {
          router.push('/');
          return;
        }

        // ถ้าส่งข้อมูลแล้วและรอการอนุมัติ ให้แสดงข้อความ
        if (userData.verification_status === 'pending') {
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!form.identity_card || !form.address || !form.organization) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      setSubmitting(false);
      return;
    }

    // ตรวจสอบรูปแบบบัตรประชาชน (13 หลัก)
    if (form.identity_card.length !== 13 || !/^\d+$/.test(form.identity_card)) {
      setError('หมายเลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/verify-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
        setSubmitting(false);
        return;
      }

      setSuccess('ส่งข้อมูลการยืนยันตัวตนสำเร็จ กรุณารอการอนุมัติจากเจ้าหน้าที่');
      
      // อัปเดตข้อมูลผู้ใช้ใน state
      const updatedUser = { ...user, verification_status: 'pending' };
      setUser(updatedUser);

      // อัปเดตข้อมูลใน localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        localStorage.setItem('user', JSON.stringify({
          ...parsedUser,
          verification_status: 'pending'
        }));
      }

      // รอสักครู่แล้วไปหน้าหลัก
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error) {
      console.error('Failed to submit verification:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ยืนยันตัวตน</h1>
          <p className="text-lg text-gray-600">
            {user?.verification_status === 'pending' 
              ? 'คุณได้ส่งข้อมูลการยืนยันตัวตนแล้ว กรุณารอการอนุมัติจากเจ้าหน้าที่'
              : 'กรุณากรอกข้อมูลเพิ่มเติมเพื่อยืนยันตัวตนก่อนจองห้องประชุม'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {user?.verification_status === 'pending' ? (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">รอการอนุมัติ</h3>
              <p className="text-gray-600 mb-6">
                ข้อมูลการยืนยันตัวตนของคุณได้ถูกส่งไปยังเจ้าหน้าที่แล้ว<br />
                กรุณารอการอนุมัติ
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                กลับหน้าหลัก
              </Link>
            </div>
                    ) : (
            <>
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

              <form onSubmit={handleSubmit} className="space-y-6">
            {/* ID Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเลขบัตรประชาชน *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="identity_card"
                  required
                  maxLength={13}
                  value={form.identity_card}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="กรอกหมายเลขบัตรประชาชน 13 หลัก"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                กรอกหมายเลขบัตรประชาชน 13 หลัก (เฉพาะตัวเลข)
              </p>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ที่อยู่ *
              </label>
              <textarea
                name="address"
                required
                rows={3}
                value={form.address}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="กรอกที่อยู่ที่สมบูรณ์"
              />
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อสำนักงาน/องค์กร *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="organization"
                  required
                  value={form.organization}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="ชื่อสำนักงานหรือองค์กรที่สังกัด"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังยืนยันตัวตน...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  ยืนยันตัวตน
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">ข้อมูลที่จำเป็น</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• หมายเลขบัตรประชาชน 13 หลัก</li>
              <li>• ที่อยู่ที่สมบูรณ์</li>
              <li>• ชื่อสำนักงานหรือองค์กรที่สังกัด</li>
              <li>• ข้อมูลจะถูกใช้เพื่อการยืนยันตัวตนเท่านั้น</li>
            </ul>
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        {user?.verification_status !== 'pending' && (
          <div className="text-center mt-6">
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              ← กลับหน้าหลัก
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
