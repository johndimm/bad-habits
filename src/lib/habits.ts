export interface Habit {
  id: string;
  label: string;
  color: string;
  bgColor: string;
}

export const HABITS: Habit[] = [
  { id: "espresso", label: "Espresso", color: "#8B4513", bgColor: "#F5E6D3" },
  { id: "beer", label: "Beer", color: "#E6A817", bgColor: "#FFF8E1" },
  { id: "vape", label: "Vape", color: "#607D8B", bgColor: "#ECEFF1" },
  { id: "pot", label: "Pot", color: "#4CAF50", bgColor: "#E8F5E9" },
];
