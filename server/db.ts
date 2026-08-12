import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { birthProfiles, InsertBirthProfile, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

const legacyBirthProfileFields = {
  id: birthProfiles.id,
  userId: birthProfiles.userId,
  label: birthProfiles.label,
  birthDate: birthProfiles.birthDate,
  birthTime: birthProfiles.birthTime,
  calendar: birthProfiles.calendar,
  placeName: birthProfiles.placeName,
  latitude: birthProfiles.latitude,
  longitude: birthProfiles.longitude,
  timezone: birthProfiles.timezone,
  timeZoneId: birthProfiles.timeZoneId,
  ayanamsa: birthProfiles.ayanamsa,
  divisionalFactor: birthProfiles.divisionalFactor,
  notes: birthProfiles.notes,
  createdAt: birthProfiles.createdAt,
  updatedAt: birthProfiles.updatedAt,
};

export function isMissingGenderColumn(error: unknown) {
  const messages: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (current instanceof Error) {
      messages.push(current.message);
      current = (current as Error & { cause?: unknown }).cause;
      continue;
    }
    messages.push(String(current));
    break;
  }
  const joined = messages.join("\n");
  return /unknown column.*gender|column.*gender.*doesn't exist/i.test(joined)
    || (/failed query:/i.test(joined) && /birth_profiles/i.test(joined) && /gender/i.test(joined));
}

export async function withGenderFallback<T extends object>(primary: () => Promise<T[]>, legacy: () => Promise<Omit<T, "gender">[]>): Promise<T[]> {
  try {
    return await primary();
  } catch (error) {
    if (!isMissingGenderColumn(error)) throw error;
    const profiles = await legacy();
    return profiles.map(profile => ({ ...profile, gender: "UNSPECIFIED" })) as T[];
  }
}

export function isTransientDatabaseError(error: unknown) {
  const message = error instanceof Error ? `${error.message}\n${String((error as Error & { cause?: unknown }).cause ?? "")}` : String(error);
  return /ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENOTFOUND|unknown MySQL server host|DNS|network/i.test(message);
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("数据库连接暂时不稳定，请稍后重试。");
    this.name = "DatabaseUnavailableError";
  }
}

export function toSafeDatabaseError(error: unknown) {
  return isTransientDatabaseError(error) ? new DatabaseUnavailableError() : error;
}

export async function withDatabaseRetry<T>(operation: (db: NonNullable<Awaited<ReturnType<typeof getDb>>>) => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const db = await getDb();
    if (!db) throw new DatabaseUnavailableError();
    try {
      return await operation(db);
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error)) throw error;
      if (attempt === attempts - 1) {
        console.error("[Database] transient query failed after retry", error);
        throw toSafeDatabaseError(error);
      }
      console.warn("[Database] transient query failure; retrying once", { attempt: attempt + 1 });
      _db = null;
      await new Promise(resolve => setTimeout(resolve, 180));
    }
  }
  throw toSafeDatabaseError(lastError) instanceof Error ? toSafeDatabaseError(lastError) : new DatabaseUnavailableError();
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await withDatabaseRetry(db => db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet }));
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const result = await withDatabaseRetry(db => db.select().from(users).where(eq(users.openId, openId)).limit(1));
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const result = await withDatabaseRetry(db => db.select().from(users).where(eq(users.id, id)).limit(1));
  return result[0];
}

export async function getUserByUsername(username: string) {
  const result = await withDatabaseRetry(db => db.select().from(users).where(eq(users.username, username)).limit(1));
  return result[0];
}

export async function createLocalUser(username: string, passwordHash: string) {
  await withDatabaseRetry(db => db.insert(users).values({ openId: `local:${username}`, username, passwordHash, name: username, loginMethod: "password", lastSignedIn: new Date() }));
  return getUserByUsername(username);
}

export async function touchLocalUser(id: number) {
  await withDatabaseRetry(db => db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id)));
}

export async function listBirthProfiles(userId: number) {
  return withDatabaseRetry(db => withGenderFallback(
    () => db.select().from(birthProfiles).where(eq(birthProfiles.userId, userId)).orderBy(desc(birthProfiles.updatedAt)),
    () => db.select(legacyBirthProfileFields).from(birthProfiles).where(eq(birthProfiles.userId, userId)).orderBy(desc(birthProfiles.updatedAt)),
  ));
}

export async function createBirthProfile(values: InsertBirthProfile) {
  await withDatabaseRetry(async db => {
    try {
      await db.insert(birthProfiles).values(values);
    } catch (error) {
      if (!isMissingGenderColumn(error)) throw error;
      const { gender: _gender, ...legacyValues } = values;
      await db.insert(birthProfiles).values(legacyValues);
    }
  });
}

export async function updateBirthProfile(userId: number, profileId: number, values: Partial<InsertBirthProfile>) {
  await withDatabaseRetry(async db => {
    try {
      await db.update(birthProfiles).set(values).where(and(eq(birthProfiles.id, profileId), eq(birthProfiles.userId, userId)));
    } catch (error) {
      if (!isMissingGenderColumn(error)) throw error;
      const { gender: _gender, ...legacyValues } = values;
      await db.update(birthProfiles).set(legacyValues).where(and(eq(birthProfiles.id, profileId), eq(birthProfiles.userId, userId)));
    }
  });
}

export async function deleteBirthProfile(userId: number, profileId: number) {
  await withDatabaseRetry(db => db.delete(birthProfiles).where(and(eq(birthProfiles.id, profileId), eq(birthProfiles.userId, userId))));
}
