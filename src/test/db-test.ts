import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '@/db/client';
import { users } from '@/db/schema';


async function testDB() {
	console.log('DATABASE_URL:', process.env.DATABASE_URL);

  const result = await db.select().from(users);
  console.log('📦 Пользователи в БД:', result);
}

testDB().then(() => process.exit(0)).catch((e) => {
  console.error('❌ Ошибка подключения к БД:', e);
  process.exit(1);
});
