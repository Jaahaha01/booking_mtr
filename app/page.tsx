// app/page.tsx
'use client'
import FullCalendar from './components/Calendar'
import { useEffect, useState } from 'react'
import ClassScheduleSection from './components/ClassScheduleSection'

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Calendar Section - now below the hero section */}
      <div className="w-full max-w-full px-2 md:px-6 pt-2">
        <FullCalendar />
      </div>

      {/* Class Schedule Section */}
      <ClassScheduleSection />

    </div>
  )
}
