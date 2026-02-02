"use client";
import { useEffect, useState } from "react";

export default function AdminFeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, you'd fetch from /api/feedbacks
        // For now, let's mock or if we have an API, use it.
        // I'll assume we haven't built the fetch API yet, so I'll structure the UI first.
        // But to make it work, I'll update the stats API to include fetching feedbacks or make a new one.
        // Let's rely on a future /api/feedbacks endpoint.
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
            {/* Placeholder for sidebar width since it's fixed */}
            <div className="w-72 hidden sm:block flex-shrink-0"></div>
            <div className="flex-1 p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">ความคิดเห็นจากผู้ใช้งาน</h1>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
                        ยังไม่มีความคิดเห็นจากผู้ใช้งาน
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {feedbacks.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
                                {/* User Info */}
                                <div className="flex items-start gap-4 md:w-1/4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {item.user?.fname?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{item.user?.fname} {item.user?.lname}</h3>
                                        <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString('th-TH')}</p>
                                        <div className="flex mt-1 text-yellow-400 text-sm">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i}>{i < item.rating ? '★' : '☆'}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="flex-1">
                                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        &quot;{item.comment}&quot;
                                    </p>
                                    {/* Images */}
                                    {item.image_url && (
                                        <div className="mt-4">
                                            <img src={item.image_url} alt="Feedback" className="h-32 rounded-lg object-cover border border-gray-200" />
                                        </div>
                                    )}
                                </div>

                                {/* Related Booking */}
                                <div className="md:w-1/4 text-right md:border-l md:border-gray-100 md:pl-6 text-sm">
                                    <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">ห้องประชุม</span>
                                    <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block mb-2">
                                        {item.room_name || 'ห้องทั่่วไป'}
                                    </span>
                                    {item.booking_id && (
                                        <div className="text-gray-500 text-xs">
                                            Booking ID: #{item.booking_id}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
