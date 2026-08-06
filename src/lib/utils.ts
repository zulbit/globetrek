import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateReadable(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.trim().split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(m, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${d.padStart(2, "0")} ${months[monthIdx]} ${y}`;
    }
  }
  return dateStr;
}
