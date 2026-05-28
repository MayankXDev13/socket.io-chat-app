import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';
import { rooms } from './room';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').notNull().references(() => rooms.id),
  senderId: integer('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
