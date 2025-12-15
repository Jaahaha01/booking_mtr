"use client";
import { useEffect, useState } from 'react';

export default function PendingBookingBadge() {
  const [pendingBookings, setPendingBookings] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setPendingBookings(data.pendingBookings ?? 0);
        }
      } catch (e) {}
    };
    fetchStats();
  }, []);

  if (pendingBookings > 0) {
    return <span className="ml-2 animate-bounce text-lg text-pink-600 select-none">!</span>;
  }
  return null;
}
