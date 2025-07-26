import { parse, validate as validateInitData } from '@telegram-apps/init-data-node';
import * as dotenv from 'dotenv';
dotenv.config();

export async function verifyInitData(initDataRaw: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const initData = parse(initDataRaw);
  await validateInitData(initDataRaw, botToken);
  
  if (!initData.user) {
    throw new Error('User data not found in initData');
  }
  
  // Приводим поля к единому формату
  const user = {
    telegramId: initData.user.id.toString(),
    firstName: initData.user.first_name || null,
    lastName: initData.user.last_name || null,
    username: initData.user.username || null,
    photoUrl: initData.user.photo_url || null,
  };
  
  return user;
}
