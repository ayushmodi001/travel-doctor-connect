/**
 * Component snapshot test for DoctorCard.
 * Run with: npx jest --testPathPattern=DoctorCard
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
  it('renders doctor name', () => {
    const { getByText } = render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />
    );
    expect(getByText('Dr. Jane Smith')).toBeTruthy();
  });

  it('renders doctor specialty', () => {
    const { getByText } = render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />
    );
    expect(getByText('General Practitioner')).toBeTruthy();
  });

  it('renders rating value', () => {
    const { getByText } = render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />
    );
    expect(getByText('4.8')).toBeTruthy();
  });

  it('shows "Now" pill when doctor is available now', () => {
    const { getByText } = render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />
    );
    expect(getByText('Now')).toBeTruthy();
  });

  it('does not show "Now" pill when doctor is unavailable', () => {
    const { queryByText } = render(
      <DoctorCard
        doctor={{ ...MOCK_DOCTOR, isAvailableNow: false }}
        onPress={() => {}}
      />
    );
    expect(queryByText('Now')).toBeNull();
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={onPress} />
    );
    fireEvent.press(getByRole('button', { name: /Dr\. Jane Smith/i }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onBookPress when Book button is tapped', () => {
    const onBookPress = jest.fn();
    const { getByText } = render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} onBookPress={onBookPress} />
    );
    fireEvent.press(getByText('Book'));
    expect(onBookPress).toHaveBeenCalledTimes(1);
  });

  it('renders compact variant without hospital name', () => {
    const { queryByText } = render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} variant="compact" />
    );
    expect(queryByText('Test Medical Center')).toBeNull();
  });

  it('matches snapshot', () => {
    const tree = render(
      <DoctorCard doctor={MOCK_DOCTOR} onPress={() => {}} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
