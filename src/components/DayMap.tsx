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

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

interface PlacedEvent {
  entry: HabitEntry;
  habit: Habit;
  x: number;
  width: number;
  label: string;
  above: boolean;
  tier: number;
}

export default function DayMap({ entries, habits }: Props) {
  const habitMap = useMemo(
    () => Object.fromEntries(habits.map((h) => [h.id, h])),
    [habits]
  );

  const { events, minHour, maxHour, hasEntries } = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const todayEntries = entries
      .filter((e) => {
        const d = new Date(e.timestamp).toLocaleDateString("en-CA");
        return d === todayStr && habitMap[e.habit];
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    if (todayEntries.length === 0) {
      return { events: [] as PlacedEvent[], minHour: 6, maxHour: 22, hasEntries: false };
    }

    // Compute hour range
    let mn = 24;
    let mx = 0;
    for (const e of todayEntries) {
      const startH = new Date(e.timestamp).getHours();
      const end = e.endTimestamp || Date.now();
      const endD = new Date(end);
      const endH = endD.getHours() + (endD.getMinutes() > 0 ? 1 : 0);
      mn = Math.min(mn, startH);
      mx = Math.max(mx, endH);
    }
    mn = Math.max(0, mn - 1);
    mx = Math.min(24, mx + 1);
    if (mx - mn < 3) {
      mn = Math.max(0, mn - 1);
      mx = Math.min(24, mx + 1);
    }

    // Count occurrences per habit for ordinals
    const counts: Record<string, number> = {};

    const placed: PlacedEvent[] = todayEntries.map((e) => {
      const habit = habitMap[e.habit];
      counts[e.habit] = (counts[e.habit] || 0) + 1;
      const n = counts[e.habit];
      const isTimed = habit.type === "timed";

      const d = new Date(e.timestamp);
      const startFrac = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

      let widthFrac = 0;
      if (isTimed) {
        const endTs = e.endTimestamp || Date.now();
        const endD = new Date(endTs);
        const endFrac = endD.getHours() + endD.getMinutes() / 60 + endD.getSeconds() / 3600;
        widthFrac = endFrac - startFrac;
      }

      const hourSpan = mx - mn;
      const x = (startFrac - mn) / hourSpan;
      const w = widthFrac / hourSpan;

      const dur = isTimed
        ? formatDuration((e.endTimestamp || Date.now()) - e.timestamp)
        : "";
      const labelText = `${ordinal(n)} ${habit.label.toLowerCase()}${dur ? ` (${dur})` : ""}`;

      return {
        entry: e,
        habit,
        x,
        width: w,
        label: labelText,
        above: false,
        tier: 0,
      };
    });

    // Alternate labels above/below, stacking into tiers to avoid overlap
    // Events are already sorted by time
    const aboveTiers: number[] = []; // rightmost x of each tier above
    const belowTiers: number[] = [];

    for (let i = 0; i < placed.length; i++) {
      const ev = placed[i];
      const evCenter = ev.x + ev.width / 2;
      const labelWidth = ev.label.length * 0.012; // rough fraction of total width

      const tryPlace = (tiers: number[]): number => {
        for (let t = 0; t < tiers.length; t++) {
          if (evCenter - labelWidth / 2 > tiers[t] + 0.01) {
            tiers[t] = evCenter + labelWidth / 2;
            return t;
          }
        }
        tiers.push(evCenter + labelWidth / 2);
        return tiers.length - 1;
      };

      // Try alternating: even index above, odd below
      if (i % 2 === 0) {
        ev.above = true;
        ev.tier = tryPlace(aboveTiers);
      } else {
        ev.above = false;
        ev.tier = tryPlace(belowTiers);
      }
    }

    return { events: placed, minHour: mn, maxHour: mx, hasEntries: true };
  }, [entries, habitMap]);

  if (!hasEntries) return null;

  const WIDTH = 600;
  const PADDING_LEFT = 12;
  const PADDING_RIGHT = 12;
  const TRACK_Y = 150;
  const TRACK_HEIGHT = 16;
  const TIER_HEIGHT = 28;
  const LABEL_AREA_ABOVE = 120;
  const LABEL_AREA_BELOW = 100;
  const HOUR_LABEL_Y = TRACK_Y + TRACK_HEIGHT + 18;
  const chartWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const totalHeight = TRACK_Y + TRACK_HEIGHT + LABEL_AREA_BELOW + 20;
  const hourSpan = maxHour - minHour;

  function fracToX(frac: number): number {
    return PADDING_LEFT + frac * chartWidth;
  }

  function hourToX(h: number): number {
    return fracToX((h - minHour) / hourSpan);
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4">Today</h2>
      <div
        className="rounded-xl border p-4 overflow-x-auto"
        style={{ backgroundColor: "var(--background)" }}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${WIDTH} ${totalHeight}`}
          style={{ minWidth: 320 }}
        >
          {/* Track background */}
          <rect
            x={PADDING_LEFT}
            y={TRACK_Y}
            width={chartWidth}
            height={TRACK_HEIGHT}
            rx={TRACK_HEIGHT / 2}
            fill="currentColor"
            opacity={0.06}
          />

          {/* Hour ticks and labels */}
          {Array.from({ length: hourSpan + 1 }, (_, i) => {
            const hour = minHour + i;
            const x = hourToX(hour);
            return (
              <g key={hour}>
                <line
                  x1={x} y1={TRACK_Y + TRACK_HEIGHT}
                  x2={x} y2={TRACK_Y + TRACK_HEIGHT + 4}
                  stroke="currentColor"
                  opacity={0.2}
                />
                {(hourSpan <= 10 || i % 2 === 0) && (
                  <text
                    x={x} y={HOUR_LABEL_Y}
                    textAnchor="middle"
                    fontSize={10}
                    fill="currentColor"
                    opacity={0.4}
                  >
                    {formatHour(hour)}
                  </text>
                )}
              </g>
            );
          })}

          {/* "now" marker */}
          {(() => {
            const now = new Date();
            const nowH = now.getHours() + now.getMinutes() / 60;
            if (nowH < minHour || nowH > maxHour) return null;
            const x = hourToX(nowH);
            return (
              <g>
                <line
                  x1={x} y1={TRACK_Y - 3}
                  x2={x} y2={TRACK_Y + TRACK_HEIGHT + 3}
                  stroke="#e53e3e"
                  strokeWidth={2}
                  opacity={0.5}
                />
                <polygon
                  points={`${x - 4},${TRACK_Y - 3} ${x + 4},${TRACK_Y - 3} ${x},${TRACK_Y + 2}`}
                  fill="#e53e3e"
                  opacity={0.5}
                />
              </g>
            );
          })()}

          {/* Events */}
          {events.map((ev) => {
            const isTimed = ev.habit.type === "timed";
            const cx = fracToX(ev.x + ev.width / 2);
            const labelX = cx;

            // Extender line endpoint
            const extenderGap = 6;
            let labelY: number;
            let lineY1: number;
            let lineY2: number;

            if (ev.above) {
              lineY1 = TRACK_Y - extenderGap;
              labelY = TRACK_Y - extenderGap - 8 - ev.tier * TIER_HEIGHT;
              lineY2 = labelY + 5;
            } else {
              lineY1 = TRACK_Y + TRACK_HEIGHT + extenderGap;
              labelY = HOUR_LABEL_Y + 16 + ev.tier * TIER_HEIGHT;
              lineY2 = labelY - 9;
            }

            return (
              <g key={ev.entry.id}>
                {/* Event shape on track */}
                {isTimed ? (
                  <rect
                    x={fracToX(ev.x)}
                    y={TRACK_Y + 2}
                    width={Math.max(ev.width * chartWidth, 6)}
                    height={TRACK_HEIGHT - 4}
                    rx={(TRACK_HEIGHT - 4) / 2}
                    fill={ev.habit.color}
                    opacity={ev.entry.endTimestamp ? 0.8 : 0.5}
                  />
                ) : (
                  <circle
                    cx={fracToX(ev.x)}
                    cy={TRACK_Y + TRACK_HEIGHT / 2}
                    r={7}
                    fill={ev.habit.color}
                    opacity={0.85}
                  />
                )}

                {/* Emoji at event */}
                <text
                  x={isTimed ? fracToX(ev.x) + Math.max(ev.width * chartWidth, 6) / 2 : fracToX(ev.x)}
                  y={TRACK_Y + TRACK_HEIGHT / 2 + 4}
                  textAnchor="middle"
                  fontSize={10}
                >
                  {ev.habit.icon}
                </text>

                {/* Extender line */}
                <line
                  x1={labelX} y1={lineY1}
                  x2={labelX} y2={lineY2}
                  stroke={ev.habit.color}
                  strokeWidth={1}
                  opacity={0.4}
                />

                {/* Label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={10}
                  fill={ev.habit.color}
                  fontWeight="600"
                >
                  {ev.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
