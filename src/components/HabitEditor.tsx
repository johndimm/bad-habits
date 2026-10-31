"use client";

import { useState, useMemo } from "react";
import type { Habit } from "@/lib/habits";
import { saveHabit, deleteHabit } from "@/lib/db";
import emojiData from "unicode-emoji-json";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DEFAULT_COLORS = [
  { color: "#8B4513", bg: "#F5E6D3" },
  { color: "#E6A817", bg: "#FFF8E1" },
  { color: "#607D8B", bg: "#ECEFF1" },
  { color: "#4CAF50", bg: "#E8F5E9" },
  { color: "#E91E63", bg: "#FCE4EC" },
  { color: "#9C27B0", bg: "#F3E5F5" },
  { color: "#2196F3", bg: "#E3F2FD" },
  { color: "#FF5722", bg: "#FBE9E7" },
];

interface Props {
  habits: Habit[];
  onClose: () => void;
  onSave: () => void;
}

const emojiEntries = Object.entries(emojiData as Record<string, { name: string }>);

const SUGGESTED_EMOJI = ["☕","🍺","💨","🚬","🍃","🎹","🎸","📖","🏃","🧘","💪","🚴",
  "🍔","🍕","🍩","🍫","🥤","💊","😴","📱","🎮","💰","🛒","✍️"];

function SortableHabitRow({
  habit,
  onEdit,
  onDelete,
  confirmDelete,
  onConfirmDelete,
}: {
  habit: Habit;
  onEdit: () => void;
  onDelete: () => void;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: habit.color + "30",
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 rounded-xl border"
    >
      <div className="flex items-center gap-3">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-lg opacity-30 hover:opacity-70 touch-none select-none"
        >
          ⠿
        </span>
        <span className="text-2xl">{habit.icon}</span>
        <div>
          <span className="font-medium" style={{ color: habit.color }}>{habit.label}</span>
          <span className="text-xs opacity-50 ml-2">
            {habit.type === "timed" ? "timed" : "count"}
          </span>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={onEdit}
          className="px-2 py-1 text-sm rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Edit
        </button>
        {confirmDelete ? (
          <button
            onClick={onDelete}
            className="px-2 py-1 text-sm rounded cursor-pointer text-red-600 font-medium"
          >
            Confirm?
          </button>
        ) : (
          <button
            onClick={onConfirmDelete}
            className="px-2 py-1 text-sm rounded cursor-pointer text-red-400 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function HabitEditor({ habits, onClose, onSave }: Props) {
  const [editing, setEditing] = useState<Habit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [emojiSearch, setEmojiSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const emojiResults = useMemo(() => {
    if (!emojiSearch.trim()) return null;
    const q = emojiSearch.toLowerCase();
    return emojiEntries
      .filter(([, v]) => v.name.includes(q))
      .slice(0, 30)
      .map(([emoji, v]) => ({ emoji, name: v.name }));
  }, [emojiSearch]);

  function startNew() {
    const maxOrder = habits.reduce((max, h) => Math.max(max, h.order ?? 0), -1);
    setEditing({
      id: "",
      label: "",
      icon: "⭐",
      color: DEFAULT_COLORS[habits.length % DEFAULT_COLORS.length].color,
      bgColor: DEFAULT_COLORS[habits.length % DEFAULT_COLORS.length].bg,
      type: "count",
      order: maxOrder + 1,
    });
  }

  function startEdit(h: Habit) {
    setEditing({ ...h });
  }

  async function handleSave() {
    if (!editing || !editing.label.trim()) return;
    const habit: Habit = {
      ...editing,
      id: editing.id || editing.label.toLowerCase().replace(/\s+/g, "-"),
    };
    await saveHabit(habit);
    setEditing(null);
    onSave();
  }

  async function handleDelete(id: string) {
    await deleteHabit(id);
    setConfirmDelete(null);
    onSave();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = habits.findIndex((h) => h.id === active.id);
    const newIndex = habits.findIndex((h) => h.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...habits];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const saves = reordered.map((h, i) => saveHabit({ ...h, order: i }));
    await Promise.all(saves);
    onSave();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {editing ? (editing.id ? "Edit Habit" : "New Habit") : "Manage Habits"}
          </h2>
          <button onClick={onClose} className="text-2xl opacity-50 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
                placeholder="e.g. Piano Practice"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <div className="flex gap-2 items-center mb-2">
                <span className="text-4xl w-12 text-center">{editing.icon}</span>
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
                  placeholder='Search emoji, e.g. "piano"'
                />
              </div>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                {emojiResults
                  ? emojiResults.map((r) => (
                      <button
                        key={r.emoji}
                        type="button"
                        onClick={() => {
                          setEditing({ ...editing, icon: r.emoji });
                          setEmojiSearch("");
                        }}
                        className="text-xl w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        title={r.name}
                      >
                        {r.emoji}
                      </button>
                    ))
                  : SUGGESTED_EMOJI.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEditing({ ...editing, icon: e })}
                        className="text-xl w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        {e}
                      </button>
                    ))}
                {emojiResults && emojiResults.length === 0 && (
                  <span className="text-sm opacity-50 py-1">No emoji found</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing({ ...editing, type: "count" })}
                  className="flex-1 py-2 rounded-lg border cursor-pointer transition-colors"
                  style={
                    editing.type === "count"
                      ? { backgroundColor: editing.color, color: "white" }
                      : {}
                  }
                >
                  Count (tap to log)
                </button>
                <button
                  onClick={() => setEditing({ ...editing, type: "timed" })}
                  className="flex-1 py-2 rounded-lg border cursor-pointer transition-colors"
                  style={
                    editing.type === "timed"
                      ? { backgroundColor: editing.color, color: "white" }
                      : {}
                  }
                >
                  Timed (start/stop)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Goal</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={0}
                  value={editing.goalCount ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      goalCount: e.target.value === "" ? undefined : Number(e.target.value),
                      goalPeriod: editing.goalPeriod || "day",
                    })
                  }
                  className="w-20 px-3 py-2 rounded-lg border text-center"
                  style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
                  placeholder="0"
                />
                <span className="text-sm opacity-60">
                  {editing.type === "timed" ? "min" : "times"} per
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditing({ ...editing, goalPeriod: "day" })}
                    className="px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm"
                    style={
                      (editing.goalPeriod || "day") === "day"
                        ? { backgroundColor: editing.color, color: "white" }
                        : {}
                    }
                  >
                    day
                  </button>
                  <button
                    onClick={() => setEditing({ ...editing, goalPeriod: "week" })}
                    className="px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm"
                    style={
                      editing.goalPeriod === "week"
                        ? { backgroundColor: editing.color, color: "white" }
                        : {}
                    }
                  >
                    week
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => setEditing({ ...editing, goalDirection: "atMost" })}
                  className="flex-1 py-2 rounded-lg border cursor-pointer transition-colors text-sm"
                  style={
                    (editing.goalDirection || "atMost") === "atMost"
                      ? { backgroundColor: editing.color, color: "white" }
                      : {}
                  }
                >
                  at most (limit)
                </button>
                <button
                  onClick={() => setEditing({ ...editing, goalDirection: "atLeast" })}
                  className="flex-1 py-2 rounded-lg border cursor-pointer transition-colors text-sm"
                  style={
                    editing.goalDirection === "atLeast"
                      ? { backgroundColor: editing.color, color: "white" }
                      : {}
                  }
                >
                  at least (target)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setEditing({ ...editing, color: c.color, bgColor: c.bg })}
                    className="w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.color,
                      outlineStyle: editing.color === c.color ? "solid" : "none",
                      outlineWidth: "3px",
                      outlineColor: c.color,
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-4 rounded-xl border-2 mt-4"
              style={{ backgroundColor: editing.bgColor, borderColor: editing.color + "40" }}
            >
              <span className="text-3xl">{editing.icon}</span>
              <span className="font-semibold" style={{ color: editing.color }}>
                {editing.label || "Preview"}
              </span>
              <div className="ml-auto text-right">
                {editing.goalCount != null && (
                  <span className="text-xs block opacity-60" style={{ color: editing.color }}>
                    0/{editing.goalCount}{editing.type === "timed" ? "m" : ""} {(editing.goalPeriod || "day") === "day" ? "today" : "this week"}
                  </span>
                )}
                <span className="text-xs opacity-60" style={{ color: editing.color }}>
                  {editing.type === "timed" ? "▶ start" : "tap to log"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2 rounded-lg border cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg cursor-pointer text-white font-medium"
                style={{ backgroundColor: editing.color }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={habits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                {habits.map((h) => (
                  <SortableHabitRow
                    key={h.id}
                    habit={h}
                    onEdit={() => startEdit(h)}
                    onDelete={() => handleDelete(h.id)}
                    confirmDelete={confirmDelete === h.id}
                    onConfirmDelete={() => setConfirmDelete(h.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              onClick={startNew}
              className="w-full py-3 rounded-xl border-2 border-dashed cursor-pointer
                hover:border-solid transition-all opacity-60 hover:opacity-100"
            >
              + Add Habit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
