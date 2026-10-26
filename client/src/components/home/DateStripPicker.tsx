/**
 * DateStripPicker – signature Health.UI calendar date strip with active pill highlighting.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

interface DateItem {
  day: string;
  date: number;
  fullDate: string;
}

interface DateStripPickerProps {
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string;
}

export const DateStripPicker: React.FC<DateStripPickerProps> = ({
  onSelectDate,
  selectedDate: initialSelected,
}) => {
  // Generate 7 upcoming days
  const today = new Date();
  const days: DateItem[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = d.getDate();
    const iso = d.toISOString().split('T')[0];
    return { day: dayName, date: dayNumber, fullDate: iso };
  });

  const [activeDate, setActiveDate] = useState<string>(
    initialSelected || days[0].fullDate
  );

  const handleSelect = (item: DateItem) => {
    setActiveDate(item.fullDate);
    onSelectDate?.(item.fullDate);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {days.map((item) => {
          const isSelected = item.fullDate === activeDate;
          return (
            <TouchableOpacity
              key={item.fullDate}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${item.day} ${item.date}`}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                {item.day}
              </Text>
              <View style={[styles.dateCircle, isSelected && styles.dateCircleActive]}>
                <Text style={[styles.dateText, isSelected && styles.dateTextActive]}>
                  {item.date < 10 ? `0${item.date}` : item.date}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing[3],
  },
  scroll: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  pill: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    minWidth: 54,
    ...Shadows.sm,
  },
  pillActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
    ...Shadows.iris,
  },
  dayText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.neutral[400],
    marginBottom: 4,
  },
  dayTextActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dateText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.neutral[900],
  },
  dateTextActive: {
    color: Colors.white,
  },
});

export default DateStripPicker;
