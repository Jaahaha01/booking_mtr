"use client";
import { useEffect, useState } from "react";

import AdminSidebar from '@/app/components/AdminSidebar';

export default function AdminFeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const res = await fetch('/api/feedbacks');
                if (res.ok) {
                    const data = await res.json();
                    setFeedbacks(data.feedbacks || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedbacks();
    }, []);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 ml-0 sm:ml-72 p-8 transition-all duration-300">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">ความคิดเห็นจากผู้ใช้งาน</h1>
                    <p className="text-gray-500 mt-2">รวบรวมความคิดเห็นและข้อเสนอแนะจากการใช้งานจริง</p>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">ยังไม่มีความคิดเห็น</h3>
                        <p className="text-gray-500 mt-1">ความคิดเห็นจากผู้ใช้จะปรากฏที่นี่</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {feedbacks.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow duration-200">
                                {/* User Info */}
                                <div className="flex items-start gap-4 md:w-1/4 min-w-[200px]">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                                        {item.user?.fname?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{item.user?.fname} {item.user?.lname}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium border border-blue-100">
                                                User
                                            </span>
                                            <p className="text-xs text-gray-400">
                                                {new Date(item.created_at).toLocaleDateString('th-TH', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center mb-3">
                                        <div className="flex text-yellow-400 text-sm">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-5 h-5 ${i < item.rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <span className="ml-2 text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                            {item.rating}.0
                                        </span>
                                    </div>

                                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                                        &quot;{item.comment}&quot;
                                    </p>

                                    {/* Images */}
                                    {item.image_url && (
                                        <div className="mt-4">
                                            <img src={item.image_url} alt="Feedback" className="h-48 rounded-lg object-cover border border-gray-200 shadow-sm" />
                                        </div>
                                    )}
                                </div>

                                {/* Booking Context */}
                                <div className="md:w-1/4 text-right md:border-l md:border-gray-100 md:pl-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Booked Room</span>
                                        <span className="font-medium text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {item.room_name || 'N/A'}
                                        </span>
                                        {item.booking_id && (
                                            <div className="text-gray-400 text-xs flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                                <span>Booking ID:</span>
                                                <span className="font-mono font-medium text-gray-600">#{item.booking_id}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
