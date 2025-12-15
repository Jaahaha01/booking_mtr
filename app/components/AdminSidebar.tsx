
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
// ใช้ dynamic import เพื่อแยก badge ออกจาก SSR
const PendingUserBadge = dynamic(() => import('./PendingUserBadge'), { ssr: false });
const PendingBookingBadge = dynamic(() => import('./PendingBookingBadge'), { ssr: false });

const sidebarLinks = [
  {
    href: '/admin/dashboard',
    label: 'แดชบอร์ด',
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'จัดการผู้ใช้',
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/bookings',
    label: 'จัดการการจอง',
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/rooms',
    label: 'จัดการห้องประชุม',
    icon: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/admin/profile',
    label: 'ดูข้อมูลเจ้าหน้าที่',
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

import { useEffect, useState } from 'react';
export default function AdminSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch {}
    };
    fetchUser();
  }, []);
  return (
    <aside className="h-screen w-64 bg-white shadow-lg flex flex-col py-6 px-2 fixed top-0 left-0 z-30">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">Admin Panel</h2>
      <nav className="flex flex-col gap-4">
        {sidebarLinks
          .filter(link => !(link.href === '/admin/rooms' && user?.role === 'staff'))
          .map((link) => {
            let badge = null;
            if (link.href === '/admin/users') {
              badge = <PendingUserBadge />;
            }
            if (link.href === '/admin/bookings') {
              badge = <PendingBookingBadge />;
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-gray-700 hover:bg-blue-50 ${pathname === link.href ? 'bg-blue-100 text-blue-700' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
                {badge}
              </Link>
            );
          })}
        <button
          type="button"
          className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-medium text-red-600 hover:bg-red-50 mt-8"
          onClick={async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
        >
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          <span>ออกจากระบบ</span>
        </button>
      </nav>
    </aside>
  );
}
