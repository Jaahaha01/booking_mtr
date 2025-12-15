


"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import AdminSidebar from '@/app/components/AdminSidebar';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';

type AdminUser = {
  user_id: number;
  username: string;
  email: string;
  fname: string;
  lname: string;
  phone: string;
  role: string;
  verification_status: string;
  identity_card: string;
  address: string;
  organization: string;
  image?: string;
  created_at: string;
  updated_at: string;
};

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('https://i.ibb.co/sv88CZNK/avatar.png');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    address: '',
    organization: '',
    image: '',
  });

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
        const userData: AdminUser = await res.json();
        setAdmin(userData);
        if (userData.image) setPreview(userData.image);
        
        // Set form data
        setForm({
          fname: userData.fname || '',
          lname: userData.lname || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          organization: userData.organization || '',
          image: userData.image || '',
        });
      } catch (err: any) {
        setError(err.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    }
    fetchAdmin();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // เตรียมข้อมูลสำหรับส่ง - ใช้ข้อมูลเดิมสำหรับช่องที่ว่าง
    const submitData = {
      fname: form.fname || admin?.fname || '',
      lname: form.lname || admin?.lname || '',
      email: form.email || admin?.email || '',
      phone: form.phone || admin?.phone || '',
      address: form.address || admin?.address || '',
      organization: form.organization || admin?.organization || '',
      image: form.image || admin?.image || '',
    };

    // ตรวจสอบเฉพาะฟิลด์ที่จำเป็นจริงๆ
    if (!submitData.fname || !submitData.lname) {
      setError('❌ กรุณากรอกชื่อและนามสกุล');
      setIsLoading(false);
      return;
    }

    if (!submitData.email) {
      setError('❌ กรุณากรอกอีเมล');
      setIsLoading(false);
      return;
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
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
    
    // Update admin state
    if (admin) {
      const updatedAdmin = { ...admin, ...form };
      setAdmin(updatedAdmin);
    }
  };

  const handleImageChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    setForm({ ...form, image: data.url });
    setPreview(data.url);
  };

  const getRoleName = (role: string) => {
    if (role === 'admin') return 'ผู้ดูแลระบบ';
    if (role === 'staff') return 'เจ้าหน้าที่';
    if (role === 'user') return 'ผู้ใช้ทั่วไป';
    return role;
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 bg-gradient-to-br from-sky-50 to-blue-50 min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
              <span className="text-lg text-sky-600 animate-pulse">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        ) : error || !admin ? (
          <div className="flex items-center justify-center h-96">
            <span className="text-lg text-red-500">{error || 'ไม่พบข้อมูลโปรไฟล์'}</span>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-12 px-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">ข้อมูลเจ้าหน้าที่</h1>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  แก้ไขข้อมูล
                </button>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-white to-sky-50 rounded-2xl shadow-lg p-6 sticky top-8 border border-sky-100">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <Image 
                        src={preview} 
                        alt="Profile Picture" 
                        width={120} 
                        height={120} 
                        className="rounded-full object-cover w-[120px] h-[120px] border-4 border-sky-100 shadow-lg" 
                      />
                      {isEditing && (
                        <label className="absolute bottom-0 right-0 bg-sky-500 text-white p-2 rounded-full cursor-pointer hover:bg-sky-600 transition-colors duration-200 shadow-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                        </label>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-800 mt-4">
                      {admin.fname} {admin.lname}
                    </h2>
                    <p className="text-gray-600 text-sm">{admin.email}</p>
                    
                    <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {getRoleName(admin.role)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-white to-sky-50 shadow-xl rounded-2xl p-8 border border-sky-100">
                  {/* Error/Success Messages */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-600 text-sm">{success}</p>
                    </div>
                  )}

                  {isEditing ? (
                    /* Edit Form */
                    <div className="space-y-6">
                      <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                        <p className="text-sky-700 text-sm">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          คุณสามารถแก้ไขเฉพาะข้อมูลที่ต้องการ หากไม่กรอกจะใช้ข้อมูลเดิม
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ</label>
                          <input
                            type="text"
                            value={form.fname}
                            onChange={(e) => setForm({ ...form, fname: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                            placeholder={admin?.fname || "กรอกชื่อ"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">นามสกุล</label>
                          <input
                            type="text"
                            value={form.lname}
                            onChange={(e) => setForm({ ...form, lname: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                            placeholder={admin?.lname || "กรอกนามสกุล"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                            placeholder={admin?.email || "กรอกอีเมล"}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทร</label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                            placeholder={admin?.phone || "กรอกเบอร์โทร (ไม่บังคับ)"}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">องค์กร</label>
                        <input
                          type="text"
                          value={form.organization}
                          onChange={(e) => setForm({ ...form, organization: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
                          placeholder={admin?.organization || "กรอกองค์กร (ไม่บังคับ)"}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
                        <textarea
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200 resize-none"
                          placeholder={admin?.address || "กรอกที่อยู่ (ไม่บังคับ)"}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-6">
                        <button
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
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
                          onClick={() => {
                            setIsEditing(false);
                            setError('');
                            setSuccess('');
                            // Reset form
                            setForm({
                              fname: admin?.fname || '',
                              lname: admin?.lname || '',
                              email: admin?.email || '',
                              phone: admin?.phone || '',
                              address: admin?.address || '',
                              organization: admin?.organization || '',
                              image: admin?.image || '',
                            });
                          }}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-gray-500">ชื่อ</span>
                          <div className="text-gray-900 font-medium">{admin.fname}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-gray-500">นามสกุล</span>
                          <div className="text-gray-900 font-medium">{admin.lname}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-gray-500">อีเมล</span>
                          <div className="text-gray-900 font-medium">{admin.email}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-gray-500">เบอร์โทร</span>
                          <div className="text-gray-900 font-medium">{admin.phone}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-gray-500">องค์กร</span>
                        <div className="text-gray-900 font-medium">{admin.organization}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-gray-500">ที่อยู่</span>
                        <div className="text-gray-900 font-medium">{admin.address}</div>
                      </div>
                      
                      <div className="pt-6 border-t border-gray-200">
                        <div className="text-xs text-gray-400">
                          สร้างเมื่อ: {new Date(admin.created_at).toLocaleString()} | อัปเดตล่าสุด: {new Date(admin.updated_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
