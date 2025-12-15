"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import AdminSidebar from "@/app/components/AdminSidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RoomStat {
  room_id: number;
  room_name: string;
  room_number: string;
  total_bookings: number;
  total_hours: number;
}

export default function AdminRoomStatisticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State สำหรับเลือกเดือน/ปี
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // ตรวจสอบสิทธิ์ admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const userData = await response.json();
        setUser(userData);
        if (userData.role !== "admin") {
          setError("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
          setTimeout(() => {
            router.back();
          }, 1800);
          return;
        }
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = "/api/rooms/statistics";
        if (selectedMonth && selectedYear) {
          url += `?month=${selectedMonth}&year=${selectedYear}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลสถิติได้");
        const payload = await response.json();
        if (payload.success && payload.data) {
          setStats(payload.data);
        } else {
          setError(payload.error || "เกิดข้อผิดพลาด");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedMonth, selectedYear]);

  // Chart data for booking trends by day of week
  const dayChartData = stats?.dayOfWeekTrends && Array.isArray(stats.dayOfWeekTrends)
    ? {
        labels: stats.dayOfWeekTrends.map((d: any) => d.day_name),
        datasets: [
          {
            label: "จำนวนครั้งที่จอง",
            data: stats.dayOfWeekTrends.map((d: any) => d.booking_count),
            backgroundColor: "#6366f1",
          },
        ],
      }
    : null;

  // Chart data for booking trends by hour
  const hourChartData = stats?.peakHours && Array.isArray(stats.peakHours)
    ? {
        labels: stats.peakHours.map((h: any) => `${h.hour}:00`),
        datasets: [
          {
            label: "จำนวนครั้งที่จอง",
            data: stats.peakHours.map((h: any) => h.booking_count),
            backgroundColor: "#38bdf8",
          },
        ],
      }
    : null;

  // รวมสถิติรวมทั้งหมด
  const totalBookings = Array.isArray(stats?.mostBookedRooms)
    ? stats.mostBookedRooms.reduce((sum: number, r: any) => sum + (r.booking_count || 0), 0)
    : 0;
  // รวมจำนวนชั่วโมงจากทุกห้อง (รวมทุกแถว)
  const totalHours = Array.isArray(stats?.mostBookedRooms)
    ? stats.mostBookedRooms.reduce((sum: number, r: any) => sum + (Number(r.total_hours) || 0), 0)
    : 0;
  const mostBookedRoom = Array.isArray(stats?.mostBookedRooms) && stats.mostBookedRooms.length > 0
    ? stats.mostBookedRooms[0].name
    : "-";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <span className="text-gray-500 text-lg">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <span className="text-red-500 text-lg">{error}</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <span className="text-gray-500 text-lg">ไม่พบข้อมูลสถิติ</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <AdminSidebar />
      <main className="flex-1 ml-64 py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">แดชบอร์ดสถิติการใช้ห้องประชุม</h1>
            <p className="text-gray-500">ดูข้อมูลการใช้ห้องประชุมแบบละเอียดสำหรับผู้ดูแลระบบ</p>
          </div>
          <Link href="/admin/dashboard">
            <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700 transition">กลับไปหน้า Dashboard</button>
          </Link>
        </div>

        {/* Card สรุปยอดรวม */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-bold text-indigo-700 mb-2">{totalBookings}</span>
            <span className="text-gray-600">จำนวนครั้งที่จองทั้งหมด</span>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-bold text-blue-700 mb-2">{totalHours}</span>
            <span className="text-gray-600">จำนวนชั่วโมงที่ใช้ทั้งหมด</span>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-bold text-green-700 mb-2">{mostBookedRoom}</span>
            <span className="text-gray-600">ห้องที่ถูกจองมากที่สุด</span>
          </div>
        </div>

        {/* กราฟแท่งขนาดเล็ก: จำนวนครั้งที่จองแต่ละห้อง */}
        {stats?.mostBookedRooms && stats.mostBookedRooms.length > 0 && (
          <section
            className="bg-white rounded-2xl shadow p-6 mb-8 flex flex-col items-center justify-center mx-auto"
            style={{ width: 1280, height: 480 }}
          >
            <h2 className="text-lg font-bold mb-2">กราฟจำนวนครั้งที่จองแต่ละห้อง</h2>
            <Bar
              data={{
                labels: stats.mostBookedRooms.map((room: any) => room.name),
                datasets: [
                  {
                    label: "จำนวนครั้งที่จอง",
                    data: stats.mostBookedRooms.map((room: any) => room.booking_count),
                    backgroundColor: "#6366f1",
                  },
                ],
              }}
              options={{
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    ticks: { font: { size: 10 } },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, font: { size: 10 } },
                  },
                },
              }}
              height={80}
            />
          </section>
        )}

        {/* ตารางสถิติรวมทั้งหมด */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold mb-4">สถิติรวมทั้งหมด</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">ชื่อห้อง</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">จำนวนครั้งที่จอง</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">จำนวนผู้ใช้ที่จอง</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">จำนวนชั่วโมงที่ใช้</th>
                </tr>
              </thead>
              <tbody>
                {stats?.mostBookedRooms?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-6 text-center text-gray-500">ไม่มีข้อมูลการจอง</td>
                  </tr>
                ) : (
                  stats.mostBookedRooms.map((room: any) => (
                    <tr key={room.room_id} className="border-b border-gray-100 hover:bg-indigo-50 transition">
                      <td className="py-2 px-4 font-medium text-gray-900">{room.name}</td>
                      <td className="py-2 px-4 text-blue-700 font-bold text-right">{room.booking_count}</td>
                      <td className="py-2 px-4 text-gray-700 text-right">{room.unique_users}</td>
                      <td className="py-2 px-4 text-indigo-700 font-bold text-right">{room.total_hours}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
