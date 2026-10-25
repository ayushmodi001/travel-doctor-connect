/**
 * Unit tests for helper utility functions.
 * Run with: npx jest --testPathPattern=helpers
 */

import {
  formatFee,
  formatDate,
  formatTime,
  timeAgo,
  truncate,
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
  getStatusBadge,
  isAppointmentJoinable,
  haversineDistance,
  calculateTriage,
} from '../../src/utils/helpers';

// ─── formatFee ────────────────────────────────────────────────────────────────

describe('formatFee', () => {
  it('formats USD fee with dollar sign', () => {
    expect(formatFee(150, 'USD')).toBe('$150');
  });
  it('formats EUR fee with euro sign', () => {
    expect(formatFee(80, 'EUR')).toBe('€80');
  });
  it('falls back to currency code for unknown currencies', () => {
    expect(formatFee(100, 'CHF')).toBe('CHF 100');
  });
  it('defaults to USD when no currency given', () => {
    expect(formatFee(200)).toBe('$200');
  });
});

// ─── formatDate & formatTime & timeAgo ────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date string', () => {
    const formatted = formatDate('2026-10-25T12:00:00Z');
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });
});

describe('formatTime', () => {
  it('formats 24h time to 12h AM/PM format', () => {
    expect(formatTime('14:30')).toBe('2:30 PM');
    expect(formatTime('09:15')).toBe('9:15 AM');
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
  });
});

describe('timeAgo', () => {
  it('returns Just now for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('Just now');
  });

  it('returns yesterday or relative days', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe('2d ago');
  });
});

describe('isAppointmentJoinable', () => {
  it('returns true when appointment is within 15 minutes', () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    expect(isAppointmentJoinable(dateStr, timeStr)).toBe(true);
  });

  it('returns false for past appointments beyond window', () => {
    expect(isAppointmentJoinable('2020-01-01', '10:00')).toBe(false);
  });
});

// ─── truncate ─────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns the original string if shorter than maxLength', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });
  it('truncates a string longer than maxLength and appends ellipsis', () => {
    const result = truncate('This is a long string', 10);
    expect(result.length).toBeLessThanOrEqual(11); // 10 chars + '…'
    expect(result.endsWith('…')).toBe(true);
  });
  it('handles exactly maxLength without truncation', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

// ─── isValidEmail ─────────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });
  it('rejects an email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });
  it('rejects an email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });
  it('accepts emails with subdomains', () => {
    expect(isValidEmail('user@mail.example.org')).toBe(true);
  });
});

// ─── isValidPassword ──────────────────────────────────────────────────────────

describe('isValidPassword', () => {
  it('rejects passwords shorter than 8 characters', () => {
    expect(isValidPassword('Abc1')).toBe(false);
  });
  it('rejects passwords without uppercase', () => {
    expect(isValidPassword('abcdefg1')).toBe(false);
  });
  it('rejects passwords without a number', () => {
    expect(isValidPassword('Abcdefgh')).toBe(false);
  });
  it('accepts a password meeting all criteria', () => {
    expect(isValidPassword('Abcdefg1')).toBe(true);
  });
});

// ─── getPasswordStrength ──────────────────────────────────────────────────────

describe('getPasswordStrength', () => {
  it('returns weak for short passwords', () => {
    expect(getPasswordStrength('abc')).toBe('weak');
  });
  it('returns medium for passwords with some complexity', () => {
    expect(getPasswordStrength('Abcdefg1')).toBe('medium');
  });
  it('returns strong for long passwords with full complexity', () => {
    expect(getPasswordStrength('Abcdefg1!secure')).toBe('strong');
  });
});

// ─── getStatusBadge ───────────────────────────────────────────────────────────

describe('getStatusBadge', () => {
  it('returns correct label for confirmed status', () => {
    const badge = getStatusBadge('confirmed');
    expect(badge.label).toBe('Confirmed');
  });
  it('returns correct label for cancelled status', () => {
    const badge = getStatusBadge('cancelled');
    expect(badge.label).toBe('Cancelled');
  });
  it('returns non-empty color values', () => {
    const badge = getStatusBadge('completed');
    expect(badge.color).toBeTruthy();
    expect(badge.bg).toBeTruthy();
  });
});

// ─── haversineDistance ────────────────────────────────────────────────────────

describe('haversineDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistance(37.7749, -122.4194, 37.7749, -122.4194)).toBe(0);
  });
  it('returns a positive distance for different coordinates', () => {
    const dist = haversineDistance(37.7749, -122.4194, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(0);
  });
  it('calculates approximately 559km from SF to LA', () => {
    const dist = haversineDistance(37.7749, -122.4194, 34.0522, -118.2437);
    expect(dist).toBeGreaterThan(550);
    expect(dist).toBeLessThan(570);
  });
});

// ─── calculateTriage ──────────────────────────────────────────────────────────

describe('calculateTriage', () => {
  it('returns critical severity for chest pain', () => {
    const result = calculateTriage('I have severe chest pain and difficulty breathing');
    expect(result.severity).toBe('critical');
    expect(result.shouldCallEmergency).toBe(true);
  });
  it('returns moderate severity for fever', () => {
    const result = calculateTriage('I have had a fever for 2 days');
    expect(result.severity).toBe('moderate');
    expect(result.shouldCallEmergency).toBe(false);
  });
  it('returns low severity for mild symptoms', () => {
    const result = calculateTriage('I feel slightly tired today');
    expect(result.severity).toBe('low');
    expect(result.shouldCallEmergency).toBe(false);
  });
  it('always includes a recommendation string', () => {
    const result = calculateTriage('sore throat');
    expect(typeof result.recommendation).toBe('string');
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});
