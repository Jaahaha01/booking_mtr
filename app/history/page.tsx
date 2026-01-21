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
        setBookings(
          allBookings.filter(
            (b: any) => b.status === "confirmed" || b.status === "cancelled"
          )
        );
        if (allBookings.length === 0) {
          setError("ไม่พบข้อมูลการจอง");
        }
      } catch {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleOpenFeedback = (booking: Booking) => {
    setFeedbackForm({ bookingId: booking.booking_id, rating: 5, comment: '', image: '' });
    setIsFeedbackOpen(true);
  };

  const handleImageChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setFeedbackForm(prev => ({ ...prev, image: data.url }));
    } catch (err) {
      alert('Upload failed');
    }
  };

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: feedbackForm.bookingId,
          rating: feedbackForm.rating,
          comment: feedbackForm.comment,
          image_url: feedbackForm.image
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('ขอบคุณสำหรับความคิดเห็น!');
        setIsFeedbackOpen(false);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-fade-in-up">
            <h3 className="text-xl font-bold mb-4 text-gray-800">ให้คะแนนการใช้งาน</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">คะแนนความพึงพอใจ</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })} className="text-2xl focus:outline-none transition-transform hover:scale-110">
                    {star <= feedbackForm.rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">ความคิดเห็นเพิ่มเติม</label>
              <textarea
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
                rows={3}
                value={feedbackForm.comment}
                onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                placeholder="บรรยากาศเป็นอย่างไร ใช้งานสะดวกหรือไม่..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">แนบรูปภาพบรรยากาศ (ถ้ามี)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              {feedbackForm.image && <img src={feedbackForm.image} alt="Preview" className="mt-2 h-20 rounded shadow" />}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 shadow-lg"
              >
                {submitting ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4">
        {/* ... Header and Filters ... (same as original) */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/bookings" className="text-blue-600 hover:underline">
            &larr; กลับหน้าสถานะการจอง
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">ประวัติการจองห้องประชุม</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            className="w-full md:w-1/2 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="ค้นหาด้วยชื่อห้องหรือวัตถุประสงค์..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            {/* Filter Buttons */}
            <button className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setStatusFilter('all')}>ทั้งหมด</button>
            <button className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${statusFilter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setStatusFilter('confirmed')}>ยืนยันแล้ว</button>
            <button className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${statusFilter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setStatusFilter('cancelled')}>ถูกยกเลิก</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">กำลังโหลดข้อมูล...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">ไม่มีประวัติการจอง</div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="py-2 px-2 text-left">ห้องประชุม</th>
                  <th className="py-2 px-2 text-left">วัตถุประสงค์</th>
                  <th className="py-2 px-2 text-left">วันเวลา</th>
                  <th className="py-2 px-2 text-left">สถานะ</th>
                  <th className="py-2 px-2 text-left">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter(b =>
                    (statusFilter === 'all' || b.status === statusFilter) &&
                    (b.room_name?.toLowerCase().includes(search.toLowerCase()) || b.title?.toLowerCase().includes(search.toLowerCase()))
                  )
                  .map((b) => (
                    <tr key={b.booking_id} className="border-b hover:bg-blue-50 transition">
                      <td className="py-2 px-2 font-semibold text-blue-700">
                        {b.room_number ? b.room_number + " " : ""}{b.room_name}
                      </td>
                      <td className="py-2 px-2">{b.title}</td>
                      <td className="py-2 px-2">
                        <span className="inline-block bg-gray-100 rounded px-2 py-1 text-xs text-gray-700 mr-1">
                          {new Date(b.start).toLocaleString("th-TH", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        <span className="inline-block bg-gray-100 rounded px-2 py-1 text-xs text-gray-700">
                          {new Date(b.end).toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        {b.status === "confirmed" ? (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">ยืนยันแล้ว</span>
                        ) : b.status === "cancelled" ? (
                          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">ถูกยกเลิก</span>
                        ) : (
                          b.status
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {b.status === 'confirmed' && new Date(b.end) < new Date() && (
                          <button
                            onClick={() => handleOpenFeedback(b)}
                            className="text-xs bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded shadow transition hover:scale-105"
                          >
                            ★ ให้คะแนน
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
