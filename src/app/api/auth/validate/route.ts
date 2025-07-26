import { db } from '@/db/client';
import { groups } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Код не передан' }, { status: 400 });
    }

    const foundGroup = await db
      .select({
        id: groups.id,
        title: groups.title,
        teacherId: groups.teacherId,
        accessCode: groups.accessCode,
      })
      .from(groups)
      .where(eq(groups.accessCode, code))
      .limit(1);

    if (!foundGroup.length) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    const group = foundGroup[0];

    // Определяем доступные роли для данного кода
    const availableRoles = ['student', 'mentor'];
    if (group.teacherId === null) {
      availableRoles.push('teacher');
    }

    return NextResponse.json({
      valid: true,
      groupId: group.id,
      groupTitle: group.title,
      availableRoles,
    });
  } catch (error) {
    console.error('[VALIDATE_ERROR]', error);
    return NextResponse.json({ valid: false, error: 'Ошибка сервера' }, { status: 500 });
  }
}
