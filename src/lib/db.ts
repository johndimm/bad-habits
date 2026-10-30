import { openDB, type DBSchema } from "idb";

export interface HabitEntry {
  id?: number;
  habit: string;
  timestamp: number;
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
}

const DB_NAME = "bad-habits";
const DB_VERSION = 1;

function getDB() {
  return openDB<BadHabitsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("entries", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("by-habit", "habit");
      store.createIndex("by-timestamp", "timestamp");
    },
  });
}

export async function logHabit(habit: string): Promise<HabitEntry> {
  const db = await getDB();
  const entry: HabitEntry = { habit, timestamp: Date.now() };
  const id = await db.add("entries", entry);
  return { ...entry, id };
}

export async function getEntriesForHabit(habit: string): Promise<HabitEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex("entries", "by-habit", habit);
}

export async function getAllEntries(): Promise<HabitEntry[]> {
  const db = await getDB();
  return db.getAll("entries");
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("entries", id);
}
