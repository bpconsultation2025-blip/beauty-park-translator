import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const config = {
  matcher: ['/room/:path*'],
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/room\/([^/]+)/);
  if (!match) return NextResponse.next();

  const roomId = match[1];
  const token = request.cookies.get(`bp_auth_${roomId}`)?.value;

  if (!verifyToken(token, roomId)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('auth', 'required');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
