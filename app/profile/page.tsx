'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    oldEmail: '',
    phone: '',
    oldPhone: '',
    address: '',
    organization: '',
    image: '',
    passwordOld: '',
    passwordNew: '',
    line_user_id: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('https://i.ibb.co/sv88CZNK/avatar.png');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(userData => {
        setUser(userData);
        setForm(prev => ({
          ...prev,
          ...userData,
          fname: userData.fname,
          lname: userData.lname,
          oldEmail: userData.email,
          oldPhone: userData.phone,
        }));
        if (userData.image) setPreview(userData.image);
      });
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const requiredFields = ['fname', 'lname', 'email', 'phone', 'address', 'organization'] as const;
    for (const key of requiredFields) {
      if (!form[key as keyof typeof form]) {
        setError('❌ กรุณากรอกข้อมูลให้ครบทุกช่อง');
        setIsLoading(false);
        return;
      }
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setIsLoading(false);
      return;
    }

    setSuccess('✅ บันทึกข้อมูลสำเร็จ');
    setIsEditing(false);
    setIsLoading(false);

    // Update user state
    const updatedUser = { ...user, ...form };
    setUser(updatedUser);

    // Show verification popup if user is not verified
    if (updatedUser.verification_status !== 'approved' && !updatedUser.is_verified) {
      setShowVerificationPopup(true);
    }
  };

  const handleImageChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        setForm({ ...form, image: data.url });
        setPreview(data.url);
      }
    } catch (err) {
      console.error('Upload Error:', err);
      alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    }
  };

  const getRoleName = (role: string) => {
    if (role === 'admin') return 'ผู้ดูแลระบบ';
    if (role === 'user') return 'ผู้ใช้ทั่วไป';
    return role;
  };

  const getVerificationStatus = () => {
    if (!user) return null;

    if (user.verification_status === 'approved') {
      return {
        text: 'ยืนยันตัวตนแล้ว',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      };
    } else if (user.verification_status === 'pending') {
      return {
        text: 'รอการอนุมัติ',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      };
    } else if (user.verification_status === 'rejected') {
      return {
        text: 'ถูกปฏิเสธ',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      };
    } else {
      return {
        text: 'ยังไม่ยืนยันตัวตน',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const verificationStatus = getVerificationStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
          <h1 className="text-3xl font-bold text-gray-800">โปรไฟล์ของคุณ</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="text-center">
                <div className="relative inline-block">
                  <Image
                    src={preview}
                    alt="avatar"
                    width={120}
                    height={120}
                    className="rounded-full object-cover w-[120px] h-[120px] border-4 border-blue-100 shadow-lg"
                  />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors duration-200 shadow-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                    </label>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-gray-800 mt-4">
                  {user.fname} {user.lname}
                </h2>
                <p className="text-gray-600 text-sm">{user.email}</p>

                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {getRoleName(user.role)}
                </div>

                {/* Verification Status */}
                {verificationStatus && (
                  <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${verificationStatus.bgColor} ${verificationStatus.color}`}>
                    {verificationStatus.icon}
                    <span className="ml-1">{verificationStatus.text}</span>
                  </div>
                )}

                {!isEditing && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      แก้ไขข้อมูล
                    </button>

                    {/* Verification Button - Only show if not verified */}
                    {user.verification_status !== 'approved' && (
                      <Link
                        href="/verify"
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        {user.verification_status === 'pending' ? 'ดูสถานะการยืนยัน' : 'ยืนยันตัวตน'}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* User Info Display */}
              {!isEditing && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-600">{user.phone || 'ไม่ระบุ'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">{user.address || 'ไม่ระบุ'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-gray-600">{user.organization || 'ไม่ระบุ'}</span>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            {isEditing ? (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">แก้ไขข้อมูลส่วนตัว</h3>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อจริง *</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={form.fname}
                      onChange={e => setForm({ ...form, fname: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">นามสกุล *</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={form.lname}
                      onChange={e => setForm({ ...form, lname: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล *</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทร *</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่ *</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      rows={3}
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสำนักงาน *</label>
                    <input
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      value={form.organization}
                      onChange={e => setForm({ ...form, organization: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Line User ID (สำหรับการแจ้งเตือน)</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={form.line_user_id || ''}
                        onChange={e => setForm({ ...form, line_user_id: e.target.value })}
                        placeholder="เช่น U12345678..."
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      * หากต้องการรับการแจ้งเตือน จำเป็นต้องแอดเพื่อนและขอ ID ก่อน:
                      <br />
                      1. แอดเพื่อนผ่านลิงก์: <a href="https://lin.ee/QNOoIX4" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">https://lin.ee/QNOoIX4</a> หรือสแกน QR Code
                      <br />
                      2. พิมพ์คำว่า <strong>&quot;id&quot;</strong> ส่งไปในแชท (Line ID: <strong>@768hlgsv</strong>)
                      <br />
                      3. นำรหัสที่บอทตอบกลับมาใส่ในช่องนี้
                    </p>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    เปลี่ยนรหัสผ่าน
                  </button>
                  {showPassword && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <input
                        type="password"
                        placeholder="รหัสผ่านเดิม"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={form.passwordOld}
                        onChange={e => setForm({ ...form, passwordOld: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="รหัสผ่านใหม่"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={form.passwordNew}
                        onChange={e => setForm({ ...form, passwordNew: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm">{success}</p>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        บันทึกข้อมูล
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">ข้อมูลส่วนตัว</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ชื่อจริง</label>
                    <p className="text-gray-800">{user.fname}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">นามสกุล</label>
                    <p className="text-gray-800">{user.lname}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">อีเมล</label>
                    <p className="text-gray-800">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">เบอร์โทร</label>
                    <p className="text-gray-800">{user.phone || 'ไม่ระบุ'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">ที่อยู่</label>
                    <p className="text-gray-800">{user.address || 'ไม่ระบุ'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ชื่อสำนักงาน</label>
                    <p className="text-gray-800">{user.organization || 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
