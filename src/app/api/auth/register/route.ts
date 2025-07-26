import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db/client';
import { groups, users, userRoleEnum } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyInitData } from '@/lib/telegramAuth';

export const dynamic = 'force-no-store'; // отключаем кэширование

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessCode, role } = body;
    
    // Получаем raw initData: либо из Authorization, либо из тела
    const auth = request.headers.get('authorization');
    const raw = auth?.startsWith('tma ') ? auth.substring(4) : body.initDataRaw;
    if (!raw || typeof raw !== 'string') {
      return NextResponse.json({ error: 'initDataRaw не передан' }, { status: 400 });
    }

    if (!accessCode || typeof accessCode !== 'string') {
      return NextResponse.json({ error: 'accessCode не передан' }, { status: 400 });
    }

    if (!role || !['student', 'mentor', 'teacher'].includes(role)) {
      return NextResponse.json({ error: 'Неверная роль' }, { status: 400 });
    }

    // Парсим и валидируем initData
    const { telegramId, firstName, lastName, username, photoUrl } = await verifyInitData(raw);

    // Находим группу по accessCode
    const groupRes = await db
      .select()
      .from(groups)
      .where(eq(groups.accessCode, accessCode))
      .limit(1);

    if (groupRes.length === 0) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }
    const group = groupRes[0];

    // Проверяем существующего пользователя
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    let userRecord;
    if (existing.length) {
      await db
        .update(users)
        .set({ role: role as typeof userRoleEnum.enumValues[number], groupId: group.id })
        .where(eq(users.telegramId, telegramId));
      userRecord = { ...existing[0], role, groupId: group.id };
    } else {
      const inserted = await db
        .insert(users)
        .values({
          telegramId,
          username,
          firstName,
          lastName,
          photoUrl,
          role: role as typeof userRoleEnum.enumValues[number],
          groupId: group.id,
        })
        .returning();
      userRecord = inserted[0];
    }

    // Генерируем простой access token (в реальном приложении используйте JWT или другой безопасный метод)
    const accessToken = Buffer.from(`${userRecord.id}:${userRecord.telegramId}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      userId: userRecord.id,
      role: userRecord.role,
      groupId: userRecord.groupId,
      accessToken,
      user: {
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        username: userRecord.username,
        photoUrl: userRecord.photoUrl,
      }
    });
  } catch (err: any) {
    console.error('[REGISTER_ERROR]', err);
    return NextResponse.json({ error: err.message || 'Ошибка сервера' }, { status: 500 });
  }
}
