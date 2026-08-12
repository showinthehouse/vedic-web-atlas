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

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function createLocalUser(username: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("数据库暂时不可用，请稍后再试。");
  await db.insert(users).values({ openId: `local:${username}`, username, passwordHash, name: username, loginMethod: "password", lastSignedIn: new Date() });
  return getUserByUsername(username);
}

export async function touchLocalUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function listBirthProfiles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return withGenderFallback(
    () => db.select().from(birthProfiles).where(eq(birthProfiles.userId, userId)).orderBy(desc(birthProfiles.updatedAt)),
    () => db.select(legacyBirthProfileFields).from(birthProfiles).where(eq(birthProfiles.userId, userId)).orderBy(desc(birthProfiles.updatedAt)),
  );
}

export async function createBirthProfile(values: InsertBirthProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    await db.insert(birthProfiles).values(values);
  } catch (error) {
    if (!isMissingGenderColumn(error)) throw error;
    const { gender: _gender, ...legacyValues } = values;
    await db.insert(birthProfiles).values(legacyValues);
  }
}

export async function updateBirthProfile(userId: number, profileId: number, values: Partial<InsertBirthProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    await db.update(birthProfiles).set(values).where(and(eq(birthProfiles.id, profileId), eq(birthProfiles.userId, userId)));
  } catch (error) {
    if (!isMissingGenderColumn(error)) throw error;
    const { gender: _gender, ...legacyValues } = values;
    await db.update(birthProfiles).set(legacyValues).where(and(eq(birthProfiles.id, profileId), eq(birthProfiles.userId, userId)));
  }
}

export async function deleteBirthProfile(userId: number, profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(birthProfiles).where(and(eq(birthProfiles.id, profileId), eq(birthProfiles.userId, userId)));
}
