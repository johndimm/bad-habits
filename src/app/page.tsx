"use client";

import { useEffect, useState, useCallback } from "react";
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
import { logHabit, getAllEntries, deleteEntry, type HabitEntry } from "@/lib/db";
import { HABITS } from "@/lib/habits";
import { HABIT_ICONS } from "@/components/HabitIcons";

interface DailyCount {
  date: string;
  [key: string]: string | number;
}

function computeDailyCounts(entries: HabitEntry[]): DailyCount[] {
  const byDate: Record<string, Record<string, number>> = {};
  for (const e of entries) {
    const date = new Date(e.timestamp).toLocaleDateString("en-CA");
    byDate[date] ??= {};
    byDate[date][e.habit] = (byDate[date][e.habit] || 0) + 1;
  }
  const dates = Object.keys(byDate).sort();
  return dates.map((date) => ({
    date,
    ...Object.fromEntries(HABITS.map((h) => [h.id, byDate[date][h.id] || 0])),
  }));
}

function getTrend(entries: HabitEntry[], habit: string): "up" | "down" | "flat" {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = entries.filter(
    (e) => e.habit === habit && e.timestamp > now - week
  ).length;
  const lastWeek = entries.filter(
    (e) =>
      e.habit === habit &&
      e.timestamp > now - 2 * week &&
      e.timestamp <= now - week
  ).length;
  if (thisWeek > lastWeek) return "up";
  if (thisWeek < lastWeek) return "down";
  return "flat";
}

function TrendArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up")
    return <span className="text-red-500 text-2xl font-bold" title="Usage up vs last week">↑</span>;
  if (direction === "down")
    return <span className="text-green-500 text-2xl font-bold" title="Usage down vs last week">↓</span>;
  return <span className="text-gray-400 text-2xl" title="Same as last week">→</span>;
}

function getWeekData(entries: HabitEntry[], habit: string): number[] {
  const now = new Date();
  const counts: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    const dayStr = day.toDateString();
    counts.push(
      entries.filter(
        (e) => e.habit === habit && new Date(e.timestamp).toDateString() === dayStr
      ).length
    );
  }
  return counts;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const daysWithData = data.filter((v) => v > 0).length;
  if (daysWithData <= 1) return null;

  const max = Math.max(...data, 1);
  const barWidth = 8;
  const gap = 3;
  const height = 32;
  const width = data.length * (barWidth + gap) - gap;

  return (
    <svg width={width} height={height} className="mt-1">
      {data.map((v, i) => {
        const barHeight = (v / max) * (height - 2);
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={2}
            fill={color}
            opacity={i === data.length - 1 ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
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
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const all = await getAllEntries();
    setEntries(all.sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [refresh]);

  async function handleLog(habit: string) {
    await logHabit(habit);
    await refresh();
  }

  async function handleDelete(id: number) {
    await deleteEntry(id);
    await refresh();
  }

  const dailyCounts = computeDailyCounts(entries);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg opacity-60">Loading...</p>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Bad Habits</h1>
      <p className="text-center opacity-50 mb-8">Track it to beat it</p>

      {/* Habit buttons */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {HABITS.map((habit) => {
          const Icon = HABIT_ICONS[habit.id];
          const trend = getTrend(entries, habit.id);
          const weekData = getWeekData(entries, habit.id);
          const todayCount = weekData[weekData.length - 1];

          return (
            <button
              key={habit.id}
              onClick={() => handleLog(habit.id)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all
                hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: habit.bgColor,
                borderColor: habit.color + "40",
              }}
            >
              <Icon size={48} />
              <span
                className="font-semibold text-lg"
                style={{ color: habit.color }}
              >
                {habit.label}
              </span>
              <Sparkline data={weekData} color={habit.color} />
              <div className="flex items-center gap-2">
                <TrendArrow direction={trend} />
                <span className="text-sm opacity-60">
                  {todayCount} today
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {dailyCounts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Usage Over Time</h2>
          <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--background)" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyCounts}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
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
                    new Date(String(v) + "T00:00:00").toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Legend
                  content={() => (
                    <div className="flex justify-center gap-4 mt-2">
                      {HABITS.map((h) => (
                        <div key={h.id} className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-sm inline-block"
                            style={{ backgroundColor: h.color }}
                          />
                          <span className="text-sm">{h.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
                {HABITS.map((habit) => (
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
          {HABITS.map((h) => (
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
              const habit = HABITS.find((h) => h.id === e.habit);
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
    </main>
  );
}
