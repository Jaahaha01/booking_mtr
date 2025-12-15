'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar on login, register, and all /admin/* routes
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return <Navbar />;
}
