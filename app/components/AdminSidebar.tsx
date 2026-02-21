'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const PendingUserBadge = dynamic(() => import('./PendingUserBadge'), { ssr: false });
const PendingBookingBadge = dynamic(() => import('./PendingBookingBadge'), { ssr: false });

const sidebarLinks = [
  {
    href: '/admin/dashboard',
    label: 'แดชบอร์ด',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'จัดการผู้ใช้',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/bookings',
    label: 'จัดการการจอง',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/admin/rooms',
    label: 'จัดการห้องประชุม',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/admin/feedbacks',
    label: 'ความคิดเห็น',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    href: '/admin/profile',
    label: 'ข้อมูลส่วนตัว',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch { }
    };
    fetchUser();
  }, []);

  const SidebarContent = () => (
    <>
      {/* Header Logo */}
      <div className="h-20 flex items-center px-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-wide">Admin Panel</span>
            <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Meeting Room</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-5 py-5 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
              {user.fname?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200 truncate">{user.fname} {user.lname}</p>
              <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full border border-indigo-400/20">
                {user.role || 'Admin'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Label */}
      <div className="px-6 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">เมนูหลัก</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-700">
        {sidebarLinks
          .filter(link => !(link.href === '/admin/rooms' && user?.role === 'staff'))
          .map((link) => {
            const isActive = pathname === link.href;

            let badge = null;
            if (link.href === '/admin/users') badge = <PendingUserBadge />;
            if (link.href === '/admin/bookings') badge = <PendingBookingBadge />;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium'
                    : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300 font-medium border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                        transition-colors duration-200
                        ${isActive ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'}
                    `}>
                    {link.icon}
                  </div>
                  <span className="text-sm">{link.label}</span>
                </div>
                {badge}
              </Link>
            );
          })}
      </div>

      {/* Home Link */}
      <div className="px-3 pb-2">
        <Link
          href="/"
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 rounded-xl hover:bg-gray-800/50 hover:text-gray-300 transition-all duration-200 font-medium group border border-transparent"
        >
          <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm">กลับหน้าหลัก</span>
        </Link>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-gray-800/50">
        <button
          type="button"
          className="flex items-center gap-3 w-full px-4 py-3 text-red-400 rounded-xl hover:bg-red-500/10 transition-all duration-200 font-medium group border border-transparent hover:border-red-500/20"
          onClick={async () => {
            try {
              await fetch('/api/logout', { method: 'POST' });
            } catch (e) { }
            window.location.href = '/login';
          }}
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          <span className="text-sm">ออกจากระบบ</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="sm:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#23272b] border border-gray-800 text-gray-400 hover:text-white transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 w-72 h-screen
        bg-[#1e2328] border-r border-gray-800/50
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        sm:translate-x-0
      `}>
        <SidebarContent />
      </aside>
    </>
  );
}
