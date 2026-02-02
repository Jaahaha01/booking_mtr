"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaCalendarAlt, FaArrowRight, FaClock, FaCheckCircle } from "react-icons/fa";

export default function HeroSection() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check if user is logged in simply by checking local storage or cookie presence if accessible
        // But since Navbar does the fetch, we can also try to fetch profile or just check if "user" object exists in some state.
        // Ideally we share state, but simple fetch verify is fine or checking for cookie.
        // Let's just default to showing the "Guest" view which encourages login.
        // Or we can check if the 'user' object is in the response of /api/profile.
        const checkLogin = async () => {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) setIsLoggedIn(true);
            } catch (e) { }
        };
        checkLogin();
    }, []);

    return (
        <div className="relative overflow-hidden bg-white">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-blue-100/40 to-indigo-100/40 blur-3xl animate-pulse"></div>
                <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-purple-100/40 to-pink-100/40 blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 pb-20 lg:pt-24 lg:pb-28">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                    {/* Text Content */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6 hover:bg-blue-100 transition-colors cursor-default">
                            <span className="flex h-2 w-2 relative mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            ระบบจองห้องประชุมออนไลน์ 24 ชม.
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                            จัดการการประชุม<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">ได้ง่ายกว่าที่เคย</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            ลดความยุ่งยากในการจองห้องประชุม ด้วยระบบที่ทันสมัย ตรวจสอบสถานะห้องได้แบบ Real-time และจัดการการนัดหมายได้ในที่เดียว
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            {isLoggedIn ? (
                                <Link href="/booking" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                                    จองห้องประชุม <FaArrowRight className="ml-2" />
                                </Link>
                            ) : (
                                <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                                    เข้าสู่ระบบเพื่อจอง <FaArrowRight className="ml-2" />
                                </Link>
                            )}

                            <a href="#calendar-view" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-gray-700 border border-gray-200 font-bold text-lg hover:bg-gray-50 hover:border-gray-300 hover:text-blue-600 transition-all duration-300 flex items-center justify-center group">
                                <FaCalendarAlt className="mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" /> ดูตารางการใช้ห้อง
                            </a>
                        </div>

                        {/* Features List */}
                        <div className="mt-12 flex flex-wrap justify-center lg:justify-start gap-6 text-gray-500 text-sm font-medium">
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 text-green-600">
                                    <FaCheckCircle />
                                </div>
                                จองง่ายใน 3 ขั้นตอน
                            </div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 text-purple-600">
                                    <FaClock />
                                </div>
                                อัพเดทสถานะ Real-time
                            </div>
                        </div>
                    </div>

                    {/* Graphic / Image Placeholder */}
                    {/* You can replace this with a real image or a CSS composition */}
                    <div className="flex-1 relative w-full max-w-lg lg:max-w-xl hidden md:block">
                        <div className="relative rounded-2xl bg-gradient-to-b from-white to-blue-50 shadow-2xl border border-white/50 p-6 backdrop-blur-sm z-10 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* Mockup simplistic UI */}
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-blue-100"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                    <div className="h-3 w-20 bg-gray-100 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-24 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-90 w-full animate-pulse"></div>
                                <div className="h-24 rounded-xl bg-white border border-gray-100 w-full shadow-sm flex items-center p-4">
                                    <div className="w-12 h-12 rounded-lg bg-orange-100 mr-4"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-24 rounded-xl bg-white border border-gray-100 w-full shadow-sm flex items-center p-4">
                                    <div className="w-12 h-12 rounded-lg bg-green-100 mr-4"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative blobs behind */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-200/30 to-purple-200/30 blur-3xl -z-10 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
