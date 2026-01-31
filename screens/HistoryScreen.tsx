import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, List, Text, useTheme } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { useTodos } from '../contexts/TodoContext';

type MarkedDates = {
  [key: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  };
};

const toYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function HistoryScreen() {
  const { todos } = useTodos();
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(toYYYYMMDD(new Date()));

  const completedTasksByDate = useMemo(() => {
    const groups: { [key: string]: typeof todos } = {};
    todos.forEach(todo => {
      if (todo.completed && todo.completedAt) {
        const dateStr = toYYYYMMDD(new Date(todo.completedAt));
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(todo);
      }
    });
    return groups;
  }, [todos]);

  const markedDates: MarkedDates = useMemo(() => {
    const marks: MarkedDates = {};
    for (const date in completedTasksByDate) {
      marks[date] = { marked: true, dotColor: theme.colors.primary };
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: theme.colors.primary,
    };
    return marks;
  }, [completedTasksByDate, selectedDate, theme.colors.primary]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const tasksForSelectedDate = completedTasksByDate[selectedDate] || [];

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title="履歴" />
      </Appbar.Header>
      <View style={styles.container}>
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: theme.colors.background,
              calendarBackground: theme.colors.background,
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.onSurface,
              textDisabledColor: '#d9e1e8',
              dotColor: theme.colors.primary,
              selectedDotColor: '#ffffff',
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.primary,
              indicatorColor: 'blue',
              textDayFontFamily: 'monospace',
              textMonthFontFamily: 'monospace',
              textDayHeaderFontFamily: 'monospace',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 16,
            }}
          />
        </View>
        <View style={styles.listContainer}>
          <List.Subheader>
            {new Date(selectedDate).toLocaleDateString()} に完了したタスク
          </List.Subheader>
          {tasksForSelectedDate.length > 0 ? (
            tasksForSelectedDate.map(item => (
              <List.Item
                key={item.id}
                title={item.text}
                description={`${new Date(item.completedAt!).toLocaleTimeString()} に完了`}
                left={() => <List.Icon icon="check" />}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>この日に完了したタスクはありません。</Text>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    flex: 3, // Approx 40%
  },
  listContainer: {
    flex: 3, // Approx 60%
    paddingHorizontal: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
  },
});
