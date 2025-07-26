import { sql } from 'drizzle-orm';
import { timestamp, pgTable, serial, text, integer, pgEnum } from 'drizzle-orm/pg-core';

// Роли пользователей
export const userRoleEnum = pgEnum('user_role', ['student', 'mentor', 'teacher']);

// Сначала groups (т.к. users ссылается на неё)
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  accessCode: text('access_code').notNull().unique(),
  teacherId: integer('teacher_id'), // ссылку сделаем позже, чтобы избежать циклов
});

// Теперь users — с groupId
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: text('telegram_id').notNull().unique(),
  username: text('username'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  photoUrl: text('photo_url'),
  role: userRoleEnum('role'),
  groupId: integer('group_id').references(() => groups.id),
});

// Обратно добавим teacherId связь на users
// (если хочется полной связности — можно сделать позже)

export const trainingSlots = pgTable('training_slots', {
  id: serial('id').primaryKey(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  groupId: integer('group_id').references(() => groups.id).notNull(),
  mentorId: integer('mentor_id').references(() => users.id).notNull(),
  activityType: text('activity_type').notNull(),
});

export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  slotId: integer('slot_id').references(() => trainingSlots.id).notNull(),
  studentId: integer('student_id').references(() => users.id).notNull(),
  mentorId: integer('mentor_id').references(() => users.id).notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
