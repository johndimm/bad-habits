export interface Habit {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  type: "count" | "timed";
  order: number;
}
