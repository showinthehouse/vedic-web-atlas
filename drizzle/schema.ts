import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 48 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const birthProfiles = mysqlTable("birth_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 120 }).notNull(),
  birthDate: varchar("birthDate", { length: 10 }).notNull(),
  birthTime: varchar("birthTime", { length: 5 }).notNull(),
  calendar: mysqlEnum("calendar", ["GREGORIAN", "JULIAN"]).notNull().default("GREGORIAN"),
  placeName: varchar("placeName", { length: 180 }).notNull(),
  latitude: decimal("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 9, scale: 6 }).notNull(),
  timezone: decimal("timezone", { precision: 5, scale: 2 }).notNull(),
  timeZoneId: varchar("timeZoneId", { length: 80 }),
  ayanamsa: mysqlEnum("ayanamsa", ["LAHIRI", "RAMAN", "KP", "TRUE_PUSHYA"]).notNull().default("LAHIRI"),
  divisionalFactor: int("divisionalFactor").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("birth_profiles_user_updated_idx").on(table.userId, table.updatedAt)]);

export type BirthProfile = typeof birthProfiles.$inferSelect;
export type InsertBirthProfile = typeof birthProfiles.$inferInsert;
