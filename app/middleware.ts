import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get('user_id');
  
  // หน้าเหล่านี้ไม่ต้องการ authentication
  const publicPaths = ['/login', '/register', '/api/login', '/api/register'];
  
  // ตรวจสอบว่าเป็น public path หรือไม่
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // ถ้าไม่มี user cookie และไม่ใช่ public path ให้ redirect ไป login
  if (!userCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // ถ้ามี user cookie และอยู่ที่หน้า login/register ให้ redirect ไปหน้าแรก
  if (userCookie && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
