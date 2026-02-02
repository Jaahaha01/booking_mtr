// app/page.tsx
'use client'
import FullCalendar from './components/Calendar'
import HeroSection from './components/HeroSection'
import { useEffect, useState } from 'react'
import ClassScheduleSection from './components/ClassScheduleSection'

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />

      {/* Calendar Section - now below the hero section */}
      <div id="calendar-view" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-6 md:p-8">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">ตารางการใช้ห้องประชุม</h2>
            <p className="text-gray-500 mt-2">ตรวจสอบสถานะห้องว่างแบบเรียลไทม์</p>
          </div>
          <FullCalendar />
        </div>
      </div>

      {/* Class Schedule Section */}
      <ClassScheduleSection />

    </div>
  )
}
