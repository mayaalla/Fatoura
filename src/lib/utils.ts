import { clsx, type ClassValue } from 'clsx'

/**
 * Merges Tailwind class names, deduplicating conflicts.
 * Uses clsx for conditional logic.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
