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

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings/my-bookings");
        const data = await res.json();
        let allBookings = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setStatusFilter('all')}
            >ทั้งหมด</button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${statusFilter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setStatusFilter('confirmed')}
            >ยืนยันแล้ว</button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${statusFilter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setStatusFilter('cancelled')}
            >ถูกยกเลิก</button>
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
