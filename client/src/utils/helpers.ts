/**
 * Utility functions used throughout the MediConnect app.
 * These are pure functions with no side effects.
 */

import { AppointmentStatus } from '../types';
import { Colors } from '../theme';

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Formats a fee amount with its currency symbol.
 * @example formatFee(150, 'USD') → '$150'
 */
export function formatFee(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$',
  };
  const symbol = symbols[currency] ?? currency + ' ';
  return `${symbol}${amount}`;
}

/**
 * Formats a date string to a human-readable format.
 * @example formatDate('2026-10-25') → 'Sat, Oct 25, 2026'
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a time string to 12-hour format with AM/PM.
 * @example formatTime('14:30') → '2:30 PM'
 */
export function formatTime(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

/**
 * Returns a relative time string from an ISO timestamp.
 * @example timeAgo('2026-10-24T14:00:00Z') → '2 hours ago'
 */
export function timeAgo(isoString: string): string {
  const now  = Date.now();
  const past = new Date(isoString).getTime();
  const diffMs = now - past;

  const minutes = Math.floor(diffMs / 60_000);
  const hours   = Math.floor(diffMs / 3_600_000);
  const days    = Math.floor(diffMs / 86_400_000);

  if (minutes < 1)  return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24)   return `${hours}h ago`;
  if (days === 1)   return 'Yesterday';
  return `${days}d ago`;
}

/**
 * Truncates a string to a given max length, appending '…'.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates an email address using a standard regex.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a password: minimum 8 characters, one uppercase, one number.
 */
export function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Returns a human-readable password strength label.
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 6) return 'weak';
  const hasUpper   = /[A-Z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (password.length >= 12 && score === 3) return 'strong';
  if (password.length >= 8 && score >= 1)   return 'medium';
  return 'weak';
}

// ─── Appointment helpers ──────────────────────────────────────────────────────

/**
 * Returns the colour and label for an appointment status badge.
 */
export function getStatusBadge(
  status: AppointmentStatus
): { color: string; bg: string; label: string } {
  const map: Record<AppointmentStatus, { color: string; bg: string; label: string }> = {
    pending:     { color: Colors.warning.dark,  bg: Colors.warning.light,  label: 'Pending' },
    confirmed:   { color: Colors.info.dark,     bg: Colors.info.light,     label: 'Confirmed' },
    'in-progress': { color: Colors.primary[700], bg: Colors.primary[100], label: 'In Progress' },
    completed:   { color: Colors.success.dark,  bg: Colors.success.light,  label: 'Completed' },
    cancelled:   { color: Colors.error.dark,    bg: Colors.error.light,    label: 'Cancelled' },
  };
  return map[status];
}

/**
 * Checks whether an appointment is joinable (confirmed + within 15 min of start time).
 */
export function isAppointmentJoinable(date: string, startTime: string): boolean {
  const appointmentTime = new Date(`${date}T${startTime}:00`);
  const now = new Date();
  const diffMin = (appointmentTime.getTime() - now.getTime()) / 60_000;
  return diffMin <= 15 && diffMin > -60; // joinable 15 min before to 60 min after start
}

// ─── Distance ─────────────────────────────────────────────────────────────────

/**
 * Calculates the distance in kilometres between two geographic coordinates
 * using the Haversine formula.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R  = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ─── Triage ───────────────────────────────────────────────────────────────────

/**
 * Simple keyword-based triage severity calculator.
 * In production this would call an NLP service.
 */
export function calculateTriage(symptoms: string): {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  shouldCallEmergency: boolean;
} {
  const s = symptoms.toLowerCase();

  const criticalKeywords = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding', 'stroke', 'heart attack'];
  const highKeywords     = ['high fever', 'severe pain', 'vomiting blood', 'fainting'];
  const moderateKeywords = ['fever', 'persistent cough', 'dizziness', 'moderate pain'];

  if (criticalKeywords.some(k => s.includes(k))) {
    return { severity: 'critical', recommendation: 'Call emergency services immediately.', shouldCallEmergency: true };
  }
  if (highKeywords.some(k => s.includes(k))) {
    return { severity: 'high', recommendation: 'Seek medical attention today.', shouldCallEmergency: false };
  }
  if (moderateKeywords.some(k => s.includes(k))) {
    return { severity: 'moderate', recommendation: 'Consult a doctor within 24–48 hours.', shouldCallEmergency: false };
  }
  return { severity: 'low', recommendation: 'Monitor symptoms; self-care may be sufficient.', shouldCallEmergency: false };
}
