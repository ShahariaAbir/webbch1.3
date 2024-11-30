import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatError(error: any): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
}

// Predefined gradient combinations for consistent, beautiful colors
const gradients = [
  'from-pink-500 via-purple-500 to-indigo-500',
  'from-cyan-500 via-blue-500 to-purple-500',
  'from-green-500 via-emerald-500 to-teal-500',
  'from-orange-500 via-amber-500 to-yellow-500',
  'from-blue-500 via-indigo-500 to-violet-500',
  'from-rose-500 via-pink-500 to-fuchsia-500',
  'from-teal-500 via-cyan-500 to-blue-500',
  'from-fuchsia-500 via-purple-500 to-pink-500',
  'from-amber-500 via-orange-500 to-red-500',
  'from-violet-500 via-purple-500 to-indigo-500'
];

export function getGradientForUser(identifier: string): string {
  // Create a simple hash of the identifier
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to select a gradient
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}