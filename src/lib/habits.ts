import habitsData from "../../habits.json";

export interface Habit {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const HABITS: Habit[] = habitsData;
