"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Booking {
  booking_id: number;
  title: string;
  room_id: number;
  room_name?: string;
  room_number?: string;
  start: string;
  end: string;
  status: string;
  feedback_rating?: number | null;
}

export default function BookingHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ bookingId: 0, rating: 5, comment: '', image: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings/my-bookings");
        const data = await res.json();
        const allBookings = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setBookings(allBookings.filter((b: any) => b.status === "confirmed" || b.status === "cancelled"));
        if (allBookings.length === 0) setError("ไม่พบข้อมูลการจอง");
      } catch { setError("เกิดข้อผิดพลาดในการโหลดข้อมูล"); } finally { setLoading(false); }
    };
    fetchBookings();
  }, []);

  const handleOpenFeedback = (booking: Booking) => {
    setFeedbackForm({ bookingId: booking.booking_id, rating: 5, comment: '', image: '' });
    setIsFeedbackOpen(true);
  };

  const handleImageChange = async (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try { const res = await fetch('/api/upload', { method: 'POST', body: formData }); const data = await res.json(); setFeedbackForm(prev => ({ ...prev, image: data.url })); } catch { alert('Upload failed'); }
  };

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: feedbackForm.bookingId, rating: feedbackForm.rating, comment: feedbackForm.comment, image_url: feedbackForm.image }) });
      const data = await res.json();
      if (data.error) alert(data.error); else {
        alert('ขอบคุณสำหรับความคิดเห็น!');
        setIsFeedbackOpen(false);
        // Update local state to show the rating immediately
        setBookings(prev => prev.map(b => b.booking_id === feedbackForm.bookingId ? { ...b, feedback_rating: feedbackForm.rating } : b));
      }
    } catch { alert('เกิดข้อผิดพลาด'); } finally { setSubmitting(false); }
  };

  const filtered = bookings.filter(b =>
    (statusFilter === 'all' || b.status === statusFilter) &&
    (b.room_name?.toLowerCase().includes(search.toLowerCase()) || b.title?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800">ให้คะแนนการใช้งาน</h3>
              <button onClick={() => setIsFeedbackOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">คะแนนความพึงพอใจ</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })} className="text-2xl focus:outline-none transition-transform hover:scale-125">
                    {star <= feedbackForm.rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">ความคิดเห็นเพิ่มเติม</label>
              <textarea className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm resize-none" rows={3} value={feedbackForm.comment} onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })} placeholder="บรรยากาศเป็นอย่างไร ใช้งานสะดวกหรือไม่..." />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">แนบรูปภาพ (ถ้ามี)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
              {feedbackForm.image && <img src={feedbackForm.image} alt="Preview" className="mt-2 h-20 rounded-lg shadow" />}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsFeedbackOpen(false)} className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors">ยกเลิก</button>
              <button onClick={handleSubmitFeedback} disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium shadow-sm transition-colors">{submitting ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link href="/bookings" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                กลับหน้าสถานะการจอง
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">ประวัติการจอง</h1>
              <p className="text-sm text-gray-500 mt-1">รายการจองที่เสร็จสิ้นแล้ว • ทั้งหมด {bookings.length} รายการ</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm bg-white" placeholder="ค้นหาชื่อห้องหรือวัตถุประสงค์..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {([['all', 'ทั้งหมด'], ['confirmed', 'ยืนยันแล้ว'], ['cancelled', 'ถูกยกเลิก']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setStatusFilter(key)} className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === key ? (key === 'confirmed' ? 'bg-emerald-600 text-white' : key === 'cancelled' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-gray-500 font-medium">ไม่พบประวัติที่ค้นหา</p>
            <p className="text-gray-400 text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const isPast = new Date(b.end) < new Date();
              return (
                <div key={b.booking_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Status sidebar */}
                    <div className={`sm:w-1.5 h-1.5 sm:h-auto ${b.status === 'confirmed' ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg">{b.room_number ? `${b.room_number} ` : ''}{b.room_name}</span>
                            {b.status === "confirmed" ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">✓ ยืนยันแล้ว</span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-100">✗ ถูกยกเลิก</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{b.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {new Date(b.start).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {new Date(b.start).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} - {new Date(b.end).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {b.status === 'confirmed' && isPast && (
                            b.feedback_rating ? (
                              <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl" title={`คุณให้คะแนน ${b.feedback_rating} ดาว`}>
                                <span className="text-xs font-medium text-amber-700 mr-1">คะแนน</span>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span key={star} className="text-base leading-none">
                                    {star <= b.feedback_rating! ? '⭐' : <span className="text-gray-300">☆</span>}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenFeedback(b)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:shadow-md"
                              >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ให้คะแนน
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
