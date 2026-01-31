import React, { useState } from 'react';
import { StyleSheet, View, FlatList, Keyboard, Platform, TouchableOpacity } from 'react-native';
import {
  Appbar,
  TextInput,
  Button,
  Card,
  List,
  Checkbox,
  IconButton,
  useTheme,
  Text,
  Chip,
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useTodos, Todo } from '../contexts/TodoContext';

const DueDateChip = ({
  date,
  onPress,
  editable,
}: {
  date: Date;
  onPress?: () => void;
  editable?: boolean;
}) => {
  const theme = useTheme();
  const now = new Date();
  const isPast = date < now;

  const displayDate = formatDistanceToNowStrict(date, { addSuffix: true, locale: ja });

  const content = (
    <Chip
      icon="calendar-clock"
      style={[styles.chip, isPast && styles.chipPast]}
      textStyle={[styles.chipText, isPast && styles.chipTextPast]}
      theme={{
        colors: { ...theme.colors, primary: isPast ? theme.colors.error : theme.colors.primary },
      }}
    >
      {displayDate}
    </Chip>
  );

  return editable && onPress ? (
    <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>
  ) : (
    content
  );
};

export default function TasksScreen() {
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo } = useTodos();
  const [newTodoText, setNewTodoText] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDueDate, setEditingDueDate] = useState<Date | undefined>(undefined);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false); // For new todo
  const [isEditingDatePickerVisible, setEditingDatePickerVisibility] = useState(false); // For editing existing todo
  const [newTodoDueDate, setNewTodoDueDate] = useState<Date | undefined>(undefined); // For new todo

  const theme = useTheme();

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const showEditingDatePicker = () => setEditingDatePickerVisibility(true);
  const hideEditingDatePicker = () => setEditingDatePickerVisibility(false);

  const handleConfirmNewTodoDate = (date: Date) => {
    setNewTodoDueDate(date);
    hideDatePicker();
  };

  const handleConfirmEditingTodoDate = (date: Date) => {
    setEditingDueDate(date);
    hideEditingDatePicker();
  };

  const handleAddTodo = () => {
    addTodo(newTodoText, newTodoDueDate);
    setNewTodoText('');
    setNewTodoDueDate(undefined);
    Keyboard.dismiss();
  };

  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
    setEditingDueDate(todo.dueDate); // Initialize with existing due date
  };

  const handleUpdate = () => {
    if (!editingTodoId) return;
    updateTodo(editingTodoId, editingText, editingDueDate); // Pass editingDueDate
    setEditingTodoId(null);
    setEditingText('');
    setEditingDueDate(undefined); // Clear editing state
  };

  const cancelEditing = () => {
    setEditingTodoId(null);
    setEditingText('');
    setEditingDueDate(undefined);
  };

  const renderTodo = ({ item }: { item: Todo }) => {
    const isEditing = editingTodoId === item.id;

    return (
      <Card style={styles.card}>
        <List.Item
          title={
            isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editingText}
                onChangeText={setEditingText}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleUpdate}
              />
            ) : (
              <Text
                style={[
                  styles.title,
                  { textDecorationLine: item.completed ? 'line-through' : 'none' },
                ]}
              >
                {item.text}
              </Text>
            )
          }
          description={() =>
            item.dueDate ? (
              <DueDateChip
                date={new Date(item.dueDate)}
                onPress={isEditing ? showEditingDatePicker : undefined}
                editable={isEditing}
              />
            ) : isEditing ? (
              <Button icon="calendar" onPress={showEditingDatePicker} compact mode="text">
                期限を設定
              </Button>
            ) : null
          }
          descriptionStyle={styles.description}
          onPress={() => !isEditing && startEditing(item)}
          left={() => (
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={item.completed ? 'checked' : 'unchecked'}
                onPress={() => toggleTodo(item.id)}
              />
            </View>
          )}
          right={() =>
            isEditing ? (
              <View style={{ flexDirection: 'row' }}>
                <IconButton icon="check" onPress={handleUpdate} size={20} />
                <IconButton icon="close" onPress={cancelEditing} size={20} />
              </View>
            ) : (
              <IconButton icon="delete" onPress={() => deleteTodo(item.id)} size={20} />
            )
          }
          style={styles.listItem}
        />
        {/* DateTimePicker for editing existing todo */}
        <DateTimePickerModal
          isVisible={isEditingDatePickerVisible && isEditing && editingTodoId === item.id}
          mode="datetime"
          onConfirm={handleConfirmEditingTodoDate}
          onCancel={hideEditingDatePicker}
          date={editingDueDate || new Date()} // Default to current or existing due date
        />
      </Card>
    );
  };

  return (
    <>
      <StatusBar
        style={Platform.OS === 'ios' ? 'light' : 'light'}
        backgroundColor={theme.colors.primary}
      />
      <Appbar.Header>
        <Appbar.Content title="タスク" />
      </Appbar.Header>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={styles.inputCard}>
          <TextInput
            label="新しいタスク"
            value={newTodoText}
            onChangeText={setNewTodoText}
            style={styles.input}
            mode="outlined"
          />
          <View style={styles.inputActions}>
            <Button icon="calendar" onPress={showDatePicker}>
              {newTodoDueDate ? format(newTodoDueDate, 'MM/dd HH:mm') : '期限を設定'}
            </Button>
            <Button mode="contained" onPress={handleAddTodo} style={styles.addButton}>
              追加
            </Button>
          </View>
        </Card>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={handleConfirmNewTodoDate}
          onCancel={hideDatePicker}
          date={newTodoDueDate || new Date()}
        />

        <FlatList
          data={todos}
          renderItem={renderTodo}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputCard: {
    margin: 8,
    padding: 12,
  },
  input: {
    marginBottom: 12,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {},
  list: {
    flex: 1,
    paddingHorizontal: 8,
  },
  card: {
    marginBottom: 8,
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
  },
  description: {
    marginTop: 8,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  chipPast: {
    backgroundColor: '#ffcdd2',
  },
  chipText: {},
  chipTextPast: {
    color: '#b71c1c',
  },
  checkboxContainer: {
    marginRight: -4,
    marginLeft: -8,
    transform: [{ scale: 0.8 }],
  },
  editInput: {
    height: 40,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
});
