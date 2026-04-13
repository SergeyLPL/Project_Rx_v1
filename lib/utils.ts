import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Объединяет классы Tailwind с правильным приоритетом
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
