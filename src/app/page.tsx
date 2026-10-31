"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  logHabit,
  getAllEntries,
  deleteEntry,
  updateEntry,
  getHabits,
  type HabitEntry,
} from "@/lib/db";
import type { Habit } from "@/lib/habits";
import HabitEditor from "@/components/HabitEditor";

interface DailyCount {
  date: string;
  [key: string]: string | number;
}

function computeDailyCounts(
  entries: HabitEntry[],
  habits: Habit[]
): DailyCount[] {
  const byDate: Record<string, Record<string, number>> = {};
  for (const e of entries) {
    const date = new Date(e.timestamp).toLocaleDateString("en-CA");
    byDate[date] ??= {};
    byDate[date][e.habit] = (byDate[date][e.habit] || 0) + 1;
  }
  const dates = Object.keys(byDate).sort();
  return dates.map((date) => ({
    date,
    ...Object.fromEntries(
      habits.map((h) => [h.id, byDate[date][h.id] || 0])
    ),
  }));
}

function timeSinceLast(entries: HabitEntry[], habit: string): string {
  const last = entries.find((e) => e.habit === habit);
  if (!last) return "never";
  const ts = last.endTimestamp || last.timestamp;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

function formatDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m ${secs % 60}s`;
  return `${secs}s`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval>>(null);

  const refreshHabits = useCallback(async () => {
    const h = await getHabits();
    setHabits(h);
  }, []);

  const refreshEntries = useCallback(async () => {
    const all = await getAllEntries();
    setEntries(all.sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([refreshHabits(), refreshEntries()]);
  }, [refreshHabits, refreshEntries]);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Restore active timers from entries on load
  useEffect(() => {
    if (loading) return;
    const timers: Record<string, number> = {};
    for (const e of entries) {
      if (e.timestamp && !e.endTimestamp) {
        const habit = habits.find((h) => h.id === e.habit);
        if (habit?.type === "timed") {
          timers[e.habit] = e.id!;
        }
      }
    }
    setActiveTimers(timers);
  }, [loading, entries, habits]);

  async function handleCount(habitId: string) {
    await logHabit(habitId);
    await refreshEntries();
  }

  async function handleTimedToggle(habitId: string) {
    const activeEntryId = activeTimers[habitId];
    if (activeEntryId) {
      const entry = entries.find((e) => e.id === activeEntryId);
      if (entry) {
        await updateEntry({ ...entry, endTimestamp: Date.now() });
      }
      setActiveTimers((prev) => {
        const next = { ...prev };
        delete next[habitId];
        return next;
      });
      await refreshEntries();
    } else {
      const entry = await logHabit(habitId);
      setActiveTimers((prev) => ({ ...prev, [habitId]: entry.id! }));
      await refreshEntries();
    }
  }

  async function handleDelete(id: number) {
    await deleteEntry(id);
    await refreshEntries();
  }

  const dailyCounts = computeDailyCounts(entries, habits);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg opacity-60">Loading...</p>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="relative mb-8">
        <h1 className="text-3xl font-bold text-center">Habits</h1>
        <p className="text-center opacity-50">bad and good</p>
        <button
          onClick={() => setShowEditor(true)}
          className="absolute right-0 top-1 text-2xl opacity-40 hover:opacity-100 cursor-pointer"
          title="Manage habits"
        >
          ⚙
        </button>
      </div>

      {/* Habit buttons */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {habits.map((habit) => {
          const since = timeSinceLast(entries, habit.id);
          const isTimedActive = !!activeTimers[habit.id];
          const activeEntry = isTimedActive
            ? entries.find((e) => e.id === activeTimers[habit.id])
            : null;
          const elapsed = activeEntry
            ? Date.now() - activeEntry.timestamp
            : 0;

          return (
            <button
              key={habit.id}
              onClick={() =>
                habit.type === "timed"
                  ? handleTimedToggle(habit.id)
                  : handleCount(habit.id)
              }
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all
                hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: isTimedActive ? habit.color + "20" : habit.bgColor,
                borderColor: isTimedActive ? habit.color : habit.color + "40",
              }}
            >
              <span className="text-5xl">{habit.icon}</span>
              <span
                className="font-semibold text-lg"
                style={{ color: habit.color }}
              >
                {habit.label}
              </span>
              {isTimedActive ? (
                <span
                  className="text-lg font-mono font-bold"
                  style={{ color: habit.color }}
                >
                  {formatDuration(elapsed)}
                </span>
              ) : (
                <span
                  className="text-sm"
                  style={{ color: habit.color, opacity: 0.7 }}
                >
                  {since}
                </span>
              )}
              {habit.type === "timed" && (
                <span
                  className="text-xs font-medium"
                  style={{ color: habit.color, opacity: 0.6 }}
                >
                  {isTimedActive ? "■ stop" : "▶ start"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {dailyCounts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Usage Over Time</h2>
          <div
            className="rounded-xl border p-4 overflow-hidden"
            style={{ backgroundColor: "var(--background)" }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyCounts}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  tickFormatter={(v: string) =>
                    new Date(v + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(v) =>
                    new Date(String(v) + "T00:00:00").toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      }
                    )
                  }
                />
                <Legend
                  content={() => (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                      {habits.map((h) => (
                        <div key={h.id} className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-sm inline-block shrink-0"
                            style={{ backgroundColor: h.color }}
                          />
                          <span className="text-xs sm:text-sm whitespace-nowrap">{h.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                {habits.map((habit) => (
                  <Bar
                    key={habit.id}
                    dataKey={habit.id}
                    name={habit.label}
                    fill={habit.color}
                    radius={[3, 3, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Recent log with tabs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Log</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab(null)}
            className={`px-3 py-1 rounded-full text-sm transition-colors cursor-pointer ${
              activeTab === null
                ? "bg-foreground text-background"
                : "bg-gray-200 dark:bg-gray-800"
            }`}
          >
            All
          </button>
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => setActiveTab(h.id)}
              className="px-3 py-1 rounded-full text-sm transition-colors cursor-pointer"
              style={
                activeTab === h.id
                  ? { backgroundColor: h.color, color: "white" }
                  : { backgroundColor: h.bgColor, color: h.color }
              }
            >
              {h.label}
            </button>
          ))}
        </div>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {entries
            .filter((e) => !activeTab || e.habit === activeTab)
            .slice(0, 50)
            .map((e) => {
              const habit = habits.find((h) => h.id === e.habit);
              const duration =
                e.endTimestamp && e.timestamp
                  ? formatDuration(e.endTimestamp - e.timestamp)
                  : null;
              const isRunning = !e.endTimestamp && habit?.type === "timed";
              return (
                <li
                  key={e.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: (habit?.color || "#ccc") + "30" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: habit?.color }}
                    />
                    <span className="font-medium">{habit?.label}</span>
                    <span className="text-sm opacity-50">
                      {formatTime(e.timestamp)}
                    </span>
                    {duration && (
                      <span className="text-xs font-mono opacity-60">
                        {duration}
                      </span>
                    )}
                    {isRunning && (
                      <span className="text-xs font-mono" style={{ color: habit?.color }}>
                        {formatDuration(Date.now() - e.timestamp)}...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleDelete(e.id!);
                    }}
                    className="text-red-400 hover:text-red-600 text-sm cursor-pointer"
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          {entries.length === 0 && (
            <li className="text-center opacity-50 py-8">
              No entries yet. Tap a habit above to start tracking.
            </li>
          )}
        </ul>
      </section>

      {showEditor && (
        <HabitEditor
          habits={habits}
          onClose={() => setShowEditor(false)}
          onSave={() => {
            refresh();
          }}
        />
      )}
    </main>
  );
}
