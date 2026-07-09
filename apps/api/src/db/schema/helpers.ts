import { serial, timestamp, uuid } from 'drizzle-orm/pg-core';

export const id = () => serial('id').primaryKey();

export const publicUuid = () => uuid('uuid').defaultRandom().notNull().unique();

export const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());
