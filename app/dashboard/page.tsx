"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import moment from "moment";
import "moment/locale/th";
import {
    FaCalendarCheck,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaBan,
    FaDoorOpen,
    FaUsers,
    FaArrowRight
} from "react-icons/fa";

moment.locale('th');

interface DashboardData {
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        cancelled: number;
    };
    rooms: {
        room_id: number;
        name: string;
        capacity: number;
        is_available: boolean;
    }[];
    recentBookings: {
        booking_id: number;
        title: string;
        start: string;
        end: string;
        status: string;
        room_name: string;
        cancelled_by: number;
    }[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/dashboard");
            if (!res.ok) {
                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                throw new Error("Failed to load data");
            }
            const jsonData = await res.json();
            setData(jsonData);
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh room status every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
                    <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                    <p className="text-gray-600 mb-6">{error || "ไม่พบข้อมูล"}</p>
                    <button
                        onClick={fetchData}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                    >
                        ลองใหม่
                    </button>
                </div>
            </div>
        );
    }

    const { stats, rooms, recentBookings } = data;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 pb-20 pt-10 px-4 sm:px-6 lg:px-8 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        แดชบอร์ดภาพรวม
                    </h1>
                    <p className="text-blue-100 text-lg">
                        สวัสดี! นี่คือสถิติการใช้งานและสถานะห้องประชุมของคุณ
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">ยอดจองทั้งหมด</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <FaCalendarCheck className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                            <span className="text-green-500 font-medium flex items-center">
                                <FaCheckCircle className="mr-1" /> Active
                            </span>
                            <span className="ml-2">ตลอดการใช้งาน</span>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">รออนุมัติ</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-xl">
                                <FaClock className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-yellow-600 bg-yellow-50 inline-block px-2 py-1 rounded-lg">
                            รอเจ้าหน้าที่ตรวจสอบ
                        </div>
                    </div>

                    {/* Approved */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">อนุมัติแล้ว</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl">
                                <FaCheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded-lg">
                            ใช้งานได้ตามปกติ
                        </div>
                    </div>

                    {/* Rejected/Cancelled */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">ถูกระงับ/ยกเลิก</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejected + stats.cancelled}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-xl">
                                <FaBan className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-red-500">
                            {stats.rejected} ปฏิเสธ / {stats.cancelled} ยกเลิกเอง
                        </div>
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Recent Bookings */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <span className="w-1 h-6 bg-blue-600 rounded-full mr-3"></span>
                                    การจองล่าสุดของฉัน
                                </h3>
                                <Link href="/history" className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center transition-colors">
                                    ดูทั้งหมด <FaArrowRight className="ml-1 w-3 h-3" />
                                </Link>
                            </div>

                            <div className="p-6">
                                {recentBookings.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <FaCalendarCheck className="text-gray-300 w-8 h-8" />
                                        </div>
                                        <p className="text-gray-500">ยังไม่มีประวัติการจอง</p>
                                        <Link href="/booking" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                            จองห้องประชุมทันที
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {recentBookings.map((booking) => {
                                            const isMeCancelled = booking.status === 'cancelled' && String(booking.cancelled_by) === String(booking.cancelled_by); // logic checked in API but let's assume API returns correct cancelled_by. 
                                            // actually we can't fully check 'me' here easily without my user id, but API separates rejected/cancelled in stats. 
                                            // For display, let's just show text.
                                            let statusBadge;
                                            if (booking.status === 'pending') {
                                                statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>รออนุมัติ</span>;
                                            } else if (booking.status === 'confirmed') {
                                                statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>อนุมัติ</span>;
                                            } else {
                                                statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>ยกเลิก/ปฏิเสธ</span>;
                                            }

                                            return (
                                                <div key={booking.booking_id} className="group p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-200">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
                                                                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{booking.title}</h4>
                                                                {statusBadge}
                                                            </div>
                                                            <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                                                                <FaDoorOpen className="ml-0.5 text-gray-400" /> {booking.room_name}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {moment(booking.start).format('D MMM YY HH:mm')} - {moment(booking.end).format('HH:mm')}
                                                            </div>
                                                        </div>

                                                        <div className="text-right sm:border-l sm:border-gray-200 sm:pl-4 pl-0 border-t border-gray-200 mx-0 mt-2 pt-2 sm:border-t-0 sm:pt-0 sm:mt-0">
                                                            <Link
                                                                href={`/bookings`}
                                                                className="text-xs font-medium text-blue-600 hover:underline"
                                                            >
                                                                ดูรายละเอียด &gt;
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notification Alert Simulation */}
                        {recentBookings.length > 0 && recentBookings[0].status === 'pending' && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <FaClock className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                            การจองล่าสุดของคุณ <span className="font-bold">"{recentBookings[0].title}"</span> กำลังรอการตรวจสอบสถานะ
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {recentBookings.length > 0 && recentBookings[0].status === 'confirmed' && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <FaCheckCircle className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-700">
                                            การจองล่าสุด <span className="font-bold">"{recentBookings[0].title}"</span> ได้รับการอนุมัติแล้ว!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right: Room Status */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 sticky top-24">
                            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <div className="relative flex h-3 w-3 mr-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </div>
                                    สถานะห้อง Real-time
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {rooms.map((room) => (
                                        <div
                                            key={room.room_id}
                                            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${room.is_available
                                                    ? "bg-gradient-to-br from-white to-green-50 border-green-200 hover:shadow-lg hover:border-green-300"
                                                    : "bg-gradient-to-br from-white to-red-50 border-red-200 hover:shadow-lg hover:border-red-300"
                                                }`}
                                        >
                                            <div className="p-5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-800 text-lg">{room.name}</h4>
                                                    {room.is_available ? (
                                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                                            ว่าง
                                                        </span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                                            ไม่ว่าง
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center text-gray-500 text-sm mt-2">
                                                    <FaUsers className="mr-2" />
                                                    <span>ความจุ {room.capacity} คน</span>
                                                </div>

                                                {!room.is_available && (
                                                    <div className="mt-3 pt-3 border-t border-red-100">
                                                        <p className="text-xs text-red-600 font-medium flex items-center">
                                                            <FaClock className="mr-1" /> มีการใช้งานขณะนี้
                                                        </p>
                                                    </div>
                                                )}

                                                {room.is_available && (
                                                    <div className="mt-3 pt-3 border-t border-green-100">
                                                        <Link href={`/booking?room=${room.room_id}`} className="text-xs text-green-600 font-bold hover:underline flex items-center">
                                                            จองห้องนี้เลย <FaArrowRight className="ml-1" />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 text-center">
                                    <Link href="/rooms/availability" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                                        ตรวจสอบตารางเวลาล่วงหน้า &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
