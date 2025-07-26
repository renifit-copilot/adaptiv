import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parse, validate } from '@telegram-apps/init-data-node';
import type { InitData } from '@telegram-apps/types';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import { z } from 'zod';

export const dynamic = 'force-no-store';

// Валидация переменных окружения
const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  JWT_SECRET: z.string().min(32),
});

// Проверяем env переменные при инициализации
const env = envSchema.parse(process.env);

/**
 * Аутентификация пользователя через Telegram Mini Apps
 * 
 * @param request NextRequest с заголовком Authorization: tma <initDataRaw>
 * @returns NextResponse с JWT в httpOnly cookie и данными пользователя
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем заголовок авторизации
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('tma ')) {
      return NextResponse.json(
        { error: 'Отсутствуют данные авторизации Telegram' },
        { status: 401 }
      );
    }

    // Извлекаем и валидируем initData
    const initDataRaw = auth.slice(4);
    let initData: InitData;
    try {
      initData = parse(initDataRaw);
      await validate(initDataRaw, env.TELEGRAM_BOT_TOKEN);
      
      if (!initData.user) {
        throw new Error('User data not found in initData');
      }
    } catch (err) {
      console.error('[AUTH_ERROR] Invalid Telegram initData:', err);
      return NextResponse.json(
        { error: 'Недействительные данные авторизации' },
        { status: 403 }
      );
    }

    // Поиск пользователя в базе
    const telegramId = initData.user.id.toString();
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!existingUser.length) {
      return NextResponse.json(
        { error: 'Пользователь не зарегистрирован' },
        { status: 403 }
      );
    }

    const user = existingUser[0];

    // Генерация JWT
    const token = sign(
      {
        sub: user.id,
        role: user.role,
        tgId: telegramId,
        groupId: user.groupId,
      },
      env.JWT_SECRET,
      { 
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    );

    // Формируем ответ
    const response = NextResponse.json({
      userId: user.id,
      role: user.role,
      groupId: user.groupId
    });

    // Устанавливаем безопасный cookie с токеном
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    });

    return response;
  } catch (err) {
    console.error('[AUTH_ERROR] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
