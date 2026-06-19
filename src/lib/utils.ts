import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const moods = [
  { id: 'calm', name: 'Calm', emoji: '😌', color: '#4ade80', description: 'Feeling peaceful and centered' },
  { id: 'happy', name: 'Happy', emoji: '😊', color: '#fbbf24', description: 'Feeling joyful and upbeat' },
  { id: 'anxious', name: 'Anxious', emoji: '😰', color: '#f87171', description: 'Feeling worried or nervous' },
  { id: 'overwhelmed', name: 'Overwhelmed', emoji: '🤯', color: '#a855f7', description: 'Feeling like too much is happening' },
  { id: 'focused', name: 'Focused', emoji: '🎯', color: '#3b82f6', description: 'Feeling concentrated and determined' },
  { id: 'tired', name: 'Tired', emoji: '😴', color: '#6b7280', description: 'Feeling low energy or sleepy' },
  { id: 'shutdown', name: 'Shutdown', emoji: '🔒', color: '#dc2626', description: 'Need to disconnect and take a break from everything' },
  { id: 'meltdown', name: 'Meltdown', emoji: '🌋', color: '#b91c1c', description: 'Feeling completely overwhelmed and need immediate support' },
] as const

export type MoodId = typeof moods[number]['id']