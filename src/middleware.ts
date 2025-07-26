import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Защищенные маршруты
const protectedPaths = [
  '/api/slots',
  '/api/feedback',
  '/app',
];

// Маршруты, не требующие аутентификации
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/_next',
  '/favicon.ico',
];

/**
 * Проверяет, требует ли путь аутентификации
 */
function isProtected(path: string): boolean {
  return protectedPaths.some(prefix => path.startsWith(prefix));
}

/**
 * Проверяет, является ли путь публичным
 */
function isPublic(path: string): boolean {
  return publicPaths.some(prefix => path.startsWith(prefix));
}

/**
 * Middleware для аутентификации и авторизации
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Пропускаем публичные маршруты
  if (isPublic(path)) {
    return NextResponse.next();
  }

  // Проверяем, требуется ли защита для текущего пути
  if (!isProtected(path)) {
    return NextResponse.next();
  }

  try {
    // Получаем JWT из cookie
    const token = request.cookies.get('token');
    
    if (!token?.value) {
      throw new Error('No token found');
    }

    // Проверяем JWT
    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    // Создаем новый заголовок с данными пользователя
    const headers = new Headers(request.headers);
    headers.set('x-user', JSON.stringify({
      userId: payload.sub,
      role: payload.role,
      telegramId: payload.tgId,
      groupId: payload.groupId,
    }));

    // Пропускаем запрос с добавленными заголовками
    return NextResponse.next({
      request: {
        headers,
      },
    });
  } catch (error) {
    // Перенаправляем на страницу входа при ошибке
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Конфигурация middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
