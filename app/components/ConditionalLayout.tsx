'use client';
import { usePathname } from 'next/navigation';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // หน้า admin, login, register ไม่ต้องมี pt-16 (ไม่มี Navbar)
    const isAdminRoute = pathname.startsWith('/admin');
    const isAuthRoute = pathname === '/login' || pathname === '/register';
    const hideNavbarPadding = isAdminRoute || isAuthRoute;

    // กำหนด background ตาม route
    const bgClass = isAdminRoute ? 'bg-[#1a1d21]' : 'bg-gray-100';

    return (
        <div className={`${bgClass} flex-1 flex flex-col`}>
            <main className={`${hideNavbarPadding ? '' : 'pt-16'} flex-1`}>
                {children}
            </main>
            {/* ซ่อน footer ในหน้า admin และ auth */}
            {!isAdminRoute && !isAuthRoute && (
                <footer className="bg-gray-100 py-6 text-center text-gray-600 text-sm border-t border-gray-200 w-full">
                    <div>
                        &copy; {new Date().getFullYear()} RMUTSB | คณะวิทยาศาสตร์เทคโนโลยี | ระบบจองห้องประชุม
                    </div>
                </footer>
            )}
        </div>
    );
}
