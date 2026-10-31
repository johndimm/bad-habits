import { openDB, type DBSchema } from "idb";
import type { Habit } from "./habits";
import defaultHabits from "../../habits.json";

export interface HabitEntry {
  id?: number;
  habit: string;
  timestamp: number;
  endTimestamp?: number;
}

interface BadHabitsDB extends DBSchema {
  entries: {
    key: number;
    value: HabitEntry;
    indexes: {
      "by-habit": string;
      "by-timestamp": number;
    };
  };
  habits: {
    key: string;
    value: Habit;
  };
}

const DB_NAME = "bad-habits";
const DB_VERSION = 2;

function getDB() {
  return openDB<BadHabitsDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore("entries", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by-habit", "habit");
        store.createIndex("by-timestamp", "timestamp");
      }
      if (oldVersion < 2) {
        db.createObjectStore("habits", { keyPath: "id" });
      }
    },
  });
}

export async function getHabits(): Promise<Habit[]> {
  const db = await getDB();
  let habits = await db.getAll("habits");
  if (habits.length === 0) {
    const seeded = defaultHabits as Habit[];
    const tx = db.transaction("habits", "readwrite");
    for (const h of seeded) {
      await tx.store.put(h);
    }
    await tx.done;
    habits = seeded;
  } else {
    const defaults = new Map((defaultHabits as Habit[]).map((h) => [h.id, h]));
    let needsUpdate = false;
    habits = habits.map((h) => {
      const def = defaults.get(h.id);
      if (def && h.goalCount == null && def.goalCount != null) {
        needsUpdate = true;
        return { ...h, goalCount: def.goalCount, goalPeriod: def.goalPeriod, goalDirection: def.goalDirection };
      }
      return h;
    });
    if (needsUpdate) {
      const tx = db.transaction("habits", "readwrite");
      for (const h of habits) {
        await tx.store.put(h);
      }
      await tx.done;
    }
  }
  return habits.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function saveHabit(habit: Habit): Promise<void> {
  const db = await getDB();
  await db.put("habits", habit);
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("habits", id);
}

export async function logHabit(habit: string): Promise<HabitEntry> {
  const db = await getDB();
  const entry: HabitEntry = { habit, timestamp: Date.now() };
  const id = await db.add("entries", entry);
  return { ...entry, id };
}

export async function updateEntry(entry: HabitEntry): Promise<void> {
  const db = await getDB();
  await db.put("entries", entry);
}

export async function getAllEntries(): Promise<HabitEntry[]> {
  const db = await getDB();
  return db.getAll("entries");
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("entries", id);
}
