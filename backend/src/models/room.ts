import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: text('name'),
  isGroup: boolean('is_group').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
