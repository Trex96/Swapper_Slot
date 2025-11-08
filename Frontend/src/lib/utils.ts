import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import type { EventStatus } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'EEE, MMM d, yyyy')
  } catch {
    return 'Invalid Date'
  }
}


export function formatTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'h:mm a')
  } catch {
    return 'Invalid Time'
  }
}


export function formatDateTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'EEE, MMM d, yyyy h:mm a')
  } catch {
    return 'Invalid Date/Time'
  }
}


export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  try {
    const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate
    const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate
    
    // If same day, show date once with time range
    if (format(startObj, 'yyyy-MM-dd') === format(endObj, 'yyyy-MM-dd')) {
      return `${format(startObj, 'MMM d, yyyy')} ${format(startObj, 'h:mm a')} - ${format(endObj, 'h:mm a')}`
    } else {
      // If different days, show both dates
      return `${format(startObj, 'MMM d, h:mm a')} - ${format(endObj, 'MMM d, h:mm a')}`
    }
  } catch {
    return 'Invalid Date Range'
  }
}


export function getStatusColor(status: EventStatus): string {
  switch (status) {
    case 'BUSY':
      return 'bg-gray-100 text-gray-800'
    case 'SWAPPABLE':
      return 'bg-green-100 text-green-800'
    case 'SWAPPED':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}


export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return '??'
  }
  
  const names = name.trim().split(' ')
  if (names.length === 0) {
    return '??'
  }
  
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }
  
  const firstInitial = names[0].charAt(0).toUpperCase()
  const lastInitial = names[names.length - 1].charAt(0).toUpperCase()
  
  return `${firstInitial}${lastInitial}`
}