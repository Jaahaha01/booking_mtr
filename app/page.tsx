// app/page.tsx
'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import FullCalendar from './components/Calendar'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ClassScheduleSection from './components/ClassScheduleSection'

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRooms: 3,
    totalBookings: 0,
    activeUsers: 0
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch statistics (mock data for now)
    setStats({
      totalRooms: 3,
      totalBookings: 15,
      activeUsers: 8
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Calendar Section - now below the hero section */}
      <div className="max-w-6xl mx-auto px-5 sm:px-5 lg:px-4 pt-2">
        <FullCalendar />
      </div>

      {/* Class Schedule Section */}
      <ClassScheduleSection />

    </div>
  )
}
