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
                if (res.ok) { const data = await res.json(); setFeedbacks(data.feedbacks || []); }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchFeedbacks();
    }, []);

    const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0';

    return (
        <div className="flex min-h-screen bg-[#1a1d21]">
            <AdminSidebar />
            <div className="flex-1 ml-0 sm:ml-72 p-4 sm:p-8 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
                            ความคิดเห็นจากผู้ใช้งาน
                        </h1>
                        <p className="text-gray-500 mt-1 ml-5 text-sm">รวบรวมความคิดเห็นและข้อเสนอแนะ • ทั้งหมด {feedbacks.length} รายการ • เฉลี่ย {avgRating} ★</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="relative w-16 h-16 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                            </div>
                            <p className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
                        </div>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-300">ยังไม่มีความคิดเห็น</h3>
                        <p className="text-gray-600 mt-1">ความคิดเห็นจากผู้ใช้จะปรากฏที่นี่</p>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {feedbacks.map((item, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-[#23272b] to-[#1e2328] rounded-2xl border border-gray-800 p-6 flex flex-col md:flex-row gap-6 hover:border-gray-700 transition-colors duration-200">
                                {/* User Info */}
                                <div className="flex items-start gap-4 md:w-1/4 min-w-[200px]">
                                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-200">{item.user?.fname} {item.user?.lname}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-lg font-medium border border-indigo-500/20">User</span>
                                            <p className="text-xs text-gray-600">{new Date(item.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center mb-3">
                                        <div className="flex text-yellow-400 text-sm">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-5 h-5 ${i < item.rating ? 'fill-current' : 'text-gray-700'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            ))}
                                        </div>
                                        <span className="ml-2 text-sm font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded-lg">{item.rating}.0</span>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed bg-[#1a1d21] p-4 rounded-xl border border-gray-800 text-sm">&quot;{item.comment}&quot;</p>
                                    {item.image_url && (
                                        <div className="mt-4"><img src={item.image_url} alt="Feedback" className="h-48 rounded-xl object-cover border border-gray-800" /></div>
                                    )}
                                </div>

                                {/* Room */}
                                <div className="md:w-1/5 text-right md:border-l md:border-gray-800 md:pl-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">BOOKED ROOM</span>
                                        <span className="font-medium text-sm text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                                            {item.room_name || 'N/A'}
                                        </span>
                                        {item.booking_id && (
                                            <div className="text-gray-600 text-xs flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-lg">
                                                <span>ID:</span><span className="font-mono font-medium text-gray-400">#{item.booking_id}</span>
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
