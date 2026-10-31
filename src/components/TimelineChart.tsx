"use client";

import { useMemo } from "react";
import type { Habit } from "@/lib/habits";
import type { HabitEntry } from "@/lib/db";

interface Props {
  entries: HabitEntry[];
  habits: Habit[];
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

function formatDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m`;
}

export default function TimelineChart({ entries, habits }: Props) {
  const timedHabits = habits.filter((h) => h.type === "timed");
  const habitMap = Object.fromEntries(timedHabits.map((h) => [h.id, h]));

  const { days, minHour, maxHour } = useMemo(() => {
    const timedEntries = entries.filter(
      (e) => habitMap[e.habit] && (e.endTimestamp || !e.endTimestamp)
    );

    const byDate: Record<string, HabitEntry[]> = {};
    for (const e of timedEntries) {
      const date = new Date(e.timestamp).toLocaleDateString("en-CA");
      byDate[date] ??= [];
      byDate[date].push(e);
    }

    const dates = Object.keys(byDate).sort();

    let mn = 24;
    let mx = 0;
    for (const es of Object.values(byDate)) {
      for (const e of es) {
        const startH = new Date(e.timestamp).getHours();
        const end = e.endTimestamp || Date.now();
        const endH = new Date(end).getHours() + (new Date(end).getMinutes() > 0 ? 1 : 0);
        mn = Math.min(mn, startH);
        mx = Math.max(mx, endH);
      }
    }
    mn = Math.max(0, mn - 1);
    mx = Math.min(24, mx + 1);
    if (mn >= mx) { mn = 6; mx = 22; }

    return {
      days: dates.map((d) => ({ date: d, entries: byDate[d] })),
      minHour: mn,
      maxHour: mx,
    };
  }, [entries, habitMap]);

  if (days.length === 0) return null;

  const ROW_HEIGHT = 32;
  const PADDING_LEFT = 70;
  const PADDING_RIGHT = 12;
  const PADDING_TOP = 24;
  const PADDING_BOTTOM = 8;
  const chartHeight = PADDING_TOP + days.length * ROW_HEIGHT + PADDING_BOTTOM;
  const hourSpan = maxHour - minHour;

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4">Sessions</h2>
      <div
        className="rounded-xl border p-4 overflow-x-auto"
        style={{ backgroundColor: "var(--background)" }}
      >
        <svg
          width="100%"
          viewBox={`0 0 600 ${chartHeight}`}
          style={{ minWidth: 400 }}
        >
          {/* Hour grid lines and labels */}
          {Array.from({ length: hourSpan + 1 }, (_, i) => {
            const hour = minHour + i;
            const x = PADDING_LEFT + (i / hourSpan) * (600 - PADDING_LEFT - PADDING_RIGHT);
            return (
              <g key={hour}>
                <line
                  x1={x}
                  y1={PADDING_TOP - 4}
                  x2={x}
                  y2={chartHeight - PADDING_BOTTOM}
                  stroke="currentColor"
                  opacity={0.1}
                  strokeDasharray="3 3"
                />
                {i % 2 === 0 && (
                  <text
                    x={x}
                    y={PADDING_TOP - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    opacity={0.5}
                  >
                    {formatHour(hour)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Day rows */}
          {days.map((day, rowIdx) => {
            const y = PADDING_TOP + rowIdx * ROW_HEIGHT;
            const dateLabel = new Date(day.date + "T00:00:00").toLocaleDateString(
              undefined,
              { weekday: "short", month: "short", day: "numeric" }
            );
            return (
              <g key={day.date}>
                {/* Row background */}
                {rowIdx % 2 === 0 && (
                  <rect
                    x={PADDING_LEFT}
                    y={y}
                    width={600 - PADDING_LEFT - PADDING_RIGHT}
                    height={ROW_HEIGHT}
                    fill="currentColor"
                    opacity={0.03}
                  />
                )}
                {/* Date label */}
                <text
                  x={PADDING_LEFT - 6}
                  y={y + ROW_HEIGHT / 2 + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="currentColor"
                  opacity={0.6}
                >
                  {dateLabel}
                </text>
                {/* Lozenges */}
                {day.entries.map((e) => {
                  const habit = habitMap[e.habit];
                  if (!habit) return null;
                  const startDate = new Date(e.timestamp);
                  const endDate = new Date(e.endTimestamp || Date.now());
                  const startFrac =
                    (startDate.getHours() + startDate.getMinutes() / 60 - minHour) / hourSpan;
                  const endFrac =
                    (endDate.getHours() + endDate.getMinutes() / 60 - minHour) / hourSpan;
                  const chartWidth = 600 - PADDING_LEFT - PADDING_RIGHT;
                  const x1 = PADDING_LEFT + startFrac * chartWidth;
                  const w = Math.max((endFrac - startFrac) * chartWidth, 4);
                  const lozengeH = ROW_HEIGHT - 8;
                  const lozengeY = y + 4;
                  const dur = (e.endTimestamp || Date.now()) - e.timestamp;
                  const isRunning = !e.endTimestamp;
                  return (
                    <g key={e.id}>
                      <rect
                        x={x1}
                        y={lozengeY}
                        width={w}
                        height={lozengeH}
                        rx={lozengeH / 2}
                        fill={habit.color}
                        opacity={isRunning ? 0.5 : 0.75}
                      />
                      {w > 30 && (
                        <text
                          x={x1 + w / 2}
                          y={lozengeY + lozengeH / 2 + 4}
                          textAnchor="middle"
                          fontSize={9}
                          fill="white"
                          fontWeight="bold"
                        >
                          {formatDuration(dur)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
          {timedHabits.map((h) => (
            <div key={h.id} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full inline-block shrink-0"
                style={{ backgroundColor: h.color }}
              />
              <span className="text-xs sm:text-sm whitespace-nowrap">{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
