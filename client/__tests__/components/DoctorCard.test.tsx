/**
 * Component snapshot test for DoctorCard.
 * Run with: npx jest --testPathPattern=DoctorCard
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import DoctorCard from '../../src/components/DoctorCard';
import { Doctor } from '../../src/types';

// ── Mock doctor data ──────────────────────────────────────────────────────────

const MOCK_DOCTOR: Doctor = {
  id: 'd-test-1',
  name: 'Dr. Jane Smith',
  specialty: 'General Practitioner',
  hospital: 'Test Medical Center',
  location: { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco' },
  rating: 4.8,
  reviewCount: 120,
  experience: 10,
  fee: 90,
  currency: 'USD',
  profileImage: 'https://randomuser.me/api/portraits/women/1.jpg',
  about: 'Experienced GP with focus on preventive care.',
  qualifications: ['MBBS'],
  languages: ['English'],
  availableSlots: [],
  isAvailableNow: true,
  consultationType: ['video', 'chat'],
  verified: true,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DoctorCard', () => {
  it('renders doctor name', async () => {
    await render(<DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />);
    expect(screen.getByText('Dr. Jane Smith')).toBeTruthy();
  });

  it('renders doctor specialty', async () => {
    await render(<DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />);
    expect(screen.getByText('General Practitioner')).toBeTruthy();
  });

  it('renders rating value', async () => {
    await render(<DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />);
    expect(screen.getByText('4.8')).toBeTruthy();
  });

  it('shows "Now" pill when doctor is available now', async () => {
    await render(<DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />);
    expect(screen.getByText('Now')).toBeTruthy();
  });

  it('does not show "Now" pill when doctor is unavailable', async () => {
    await render(
      <DoctorCard
        doctor={{ ...MOCK_DOCTOR, isAvailableNow: false }}
        onPress={() => {}}
      />
    );
    expect(screen.queryByText('Now')).toBeNull();
  });

  it('calls onPress when card is tapped', async () => {
    const onPress = jest.fn();
    await render(<DoctorCard doctor={MOCK_DOCTOR} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: /Dr\. Jane Smith/i }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onBookPress when Book button is tapped', async () => {
    const onBookPress = jest.fn();
    await render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} onBookPress={onBookPress} />
    );
    fireEvent.press(screen.getByText('Book'));
    expect(onBookPress).toHaveBeenCalledTimes(1);
  });

  it('renders compact variant without hospital name', async () => {
    await render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} variant="compact" />
    );
    expect(screen.queryByText('Test Medical Center')).toBeNull();
  });

  it('matches snapshot', async () => {
    await render(<DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />);
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
