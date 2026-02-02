"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>({
    fname: "",
    lname: "",
    email: "",
    verification_status: null,
    role: "user",
    image: null,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [latestBooking, setLatestBooking] = useState<{ booking_id?: number, status: string } | null>(null);
  const [showBookingBadge, setShowBookingBadge] = useState(false);

  // Load user & notifications
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        // ignore
      }

    };

    load();
  }, []);

  useEffect(() => {
    // เมื่อ user หรือ latestBooking เปลี่ยน ให้เช็ค badge
    if (user && user.user_id && latestBooking && latestBooking.booking_id && (latestBooking.status === 'confirmed' || latestBooking.status === 'cancelled')) {
      const key = `latestBookingSeen_${user.user_id}`;
      const seenId = localStorage.getItem(key);
      setShowBookingBadge(String(latestBooking.booking_id) !== seenId);
    } else {
      setShowBookingBadge(false);
    }
  }, [user?.user_id, latestBooking]);

  useEffect(() => {
    const fetchLatestBooking = async () => {
      try {
        const response = await fetch('/api/bookings/latest-status');
        if (response.ok) {
          const data = await response.json();
          setLatestBooking(data.latest);
        }
      } catch (error) {
        // ignore
      }
    };
    if (user && user.user_id) fetchLatestBooking();
  }, [user?.user_id]);

  const handleBookingLinkClick = () => {
    if (user && user.user_id && latestBooking && latestBooking.booking_id) {
      const key = `latestBookingSeen_${user.user_id}`;
      localStorage.setItem(key, String(latestBooking.booking_id));
      setShowBookingBadge(false);
    }
  };

  // click outside close
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const target = ev.target as Element;
      if (
        !target.closest(".dropdown-container") &&
        !target.closest(".notif-container")
      ) {
        setIsDropdownOpen(false);
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };


  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case "success":
      case "booking_confirmed":
        return (
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        );
      case "warning":
      case "booking_cancelled":
        return (
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01"
              />
            </svg>
          </div>
        );
    }
  };


  return (
    <>
      <nav className="backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200 overflow-hidden">
                  <img
                    src="/uploads/logo.png"
                    alt="Logo"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-blue-700">
                  ระบบจองห้องประชุม
                </span>
                <div className="text-xs text-gray-500">Meeting Room System</div>
              </div>
            </Link>

            {/* Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { href: "/", label: "หน้าหลัก", public: true },
                { href: "/dashboard", label: "ภาพรวม", public: false },
                { href: "/booking", label: "จองห้องประชุม", public: false },
                { href: "/bookings", label: "สถานะการจอง", public: false },
                { href: "/history", label: "ประวัติการจอง", public: false },
                { href: "/rooms/availability", label: "ตรวจสอบห้องว่าง", public: true },
              ].filter(item => item.public || (user && user.email)).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={item.href === "/bookings" ? handleBookingLinkClick : undefined}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 group ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}
                  >
                    <span>{item.label}</span>
                    {/* Badge ! ดุ๊กดิ๊ก เฉพาะสถานะการจอง */}
                    {item.href === "/bookings" && showBookingBadge && (
                      <span className="ml-1 animate-bounce text-lg text-pink-600 select-none">!</span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* User menu only, notification removed */}
            <div className="flex items-center space-x-4">
              <div className="relative dropdown-container">
                {user && user.email ? (
                  <div>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-3 p-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
                    >
                      <div className="relative">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-100 group-hover:border-blue-300 transition-colors"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="text-white text-sm font-bold">
                              {user.fname
                                ? user.fname.charAt(0).toUpperCase()
                                : "U"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {user.fname} {user.lname}
                        </div>
                        <div className="text-xs text-gray-500">ออนไลน์</div>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-72 backdrop-blur-xl bg-white/95 border border-white/20 rounded-2xl shadow-2xl py-2 z-50">
                        <div className="px-4 py-4 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt="avatar"
                                className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {user.fname
                                    ? user.fname.charAt(0).toUpperCase()
                                    : "U"}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.fname} {user.lname}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.email}
                              </p>
                              {user.verification_status && (
                                <div className="flex items-center gap-1 mt-1">
                                  {user.verification_status === "approved" ? (
                                    <>
                                      <svg
                                        className="w-3 h-3 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      <span className="text-xs text-green-600 font-medium">
                                        ยืนยันตัวตนแล้ว
                                      </span>
                                    </>
                                  ) : user.verification_status ===
                                    "pending" ? (
                                    <>
                                      <svg
                                        className="w-3 h-3 text-yellow-500 animate-spin"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"
                                        />
                                      </svg>
                                      <span className="text-xs text-yellow-600 font-medium">
                                        รอยืนยัน
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <svg
                                        className="w-3 h-3 text-red-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                      <span className="text-xs text-red-600 font-medium">
                                        ถูกปฏิเสธ
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="py-2">
                          <Link
                            href="/profile"
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          >
                            <span>โปรไฟล์</span>
                          </Link>
                          <Link
                            href="/bookings"
                            onClick={handleBookingLinkClick}
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          >
                            <span>สถานะการจอง</span>
                            {showBookingBadge && (
                              <span className="ml-1 animate-bounce text-lg text-pink-600 select-none">!</span>
                            )}
                          </Link>
                          <Link
                            href="/history"
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          >
                            <span>ประวัติการจอง</span>
                          </Link>
                          {/* เพิ่มลิงก์แดชบอร์ดสำหรับ admin และ staff */}
                          {(user?.role === 'admin' || user?.role === 'staff') && (
                            <Link
                              href="/admin/dashboard"
                              className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                            >
                              <span>แดชบอร์ด</span>
                            </Link>
                          )}
                          {user.verification_status !== "approved" && (
                            <Link
                              href="/verify"
                              className="flex items-center space-x-3 px-4 py-3 text-sm text-yellow-600 hover:bg-yellow-50 transition-colors"
                            >
                              ยืนยันตัวตน
                            </Link>
                          )}

                          <div className="border-t border-gray-100 my-2"></div>
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            ออกจากระบบ
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 border border-transparent hover:border-blue-100"
                    >
                      เข้าสู่ระบบ
                    </Link>
                    <Link
                      href="/register"
                      className="px-6 py-2.5 rounded-xl text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                      สมัครสมาชิก
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden backdrop-blur-xl bg-white/95 border-t border-white/20">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {[
                { href: "/", label: "หน้าหลัก", public: true },
                { href: "/dashboard", label: "ภาพรวม", public: false },
                { href: "/booking", label: "จองห้องประชุม", public: false },
                { href: "/bookings", label: "สถานะการจอง", public: false },
                { href: "/history", label: "ประวัติการจอง", public: false },
                { href: "/rooms/availability", label: "ตรวจสอบห้องว่าง", public: true },
              ].filter(item => item.public || (user && user.email)).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

