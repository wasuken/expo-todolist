import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Keyboard,
  Platform,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
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
  Divider,
  SegmentedButtons,
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, formatDistanceToNowStrict, addHours } from 'date-fns';
import { ja } from 'date-fns/locale';

import {
  useTodos,
  Todo,
  ChecklistItem as ChecklistItemType,
  Priority,
} from '../contexts/TodoContext';

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
  const dueDate = new Date(date); // Ensure it's a Date object
  const isPast = dueDate < now;
  const eightHoursFromNow = addHours(now, 8);
  const isUrgent = !isPast && dueDate < eightHoursFromNow; // Urgent if not past and within 8 hours

  const displayDate = formatDistanceToNowStrict(dueDate, { addSuffix: true, locale: ja });

  let iconColor = theme.colors.onSurfaceVariant; // Default icon color

  if (isPast) {
    // Original past styling
    iconColor = theme.colors.error; // Keep red for past due
  } else if (isUrgent) {
    iconColor = '#EF5350'; // Explicitly set to a vibrant red for urgent tasks
  }

  const content = (
    <Chip
      icon="calendar-clock"
      style={[styles.chip, isPast && styles.chipPast]} // Revert to original chip styles
      textStyle={[styles.chipText, isPast && styles.chipTextPast]} // Revert to original chipText styles
      iconColor={iconColor} // Set icon color based on urgency
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

const ChecklistItem = ({
  item,
  todoId,
  onToggle,
}: {
  item: ChecklistItemType;
  todoId: string;
  onToggle: (todoId: string, itemId: string) => void;
}) => {
  return (
    <List.Item
      title={item.text}
      titleStyle={{
        textDecorationLine: item.completed ? 'line-through' : 'none',
        fontSize: 14,
        marginLeft: -10,
      }}
      left={() => (
        <Checkbox
          status={item.completed ? 'checked' : 'unchecked'}
          onPress={() => onToggle(todoId, item.id)}
        />
      )}
      style={styles.checklistItem}
    />
  );
};

export default function TasksScreen() {
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo, toggleChecklistItem } = useTodos();
  const [newTodoText, setNewTodoText] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDueDate, setEditingDueDate] = useState<Date | undefined>(undefined);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<Priority>(Priority.Medium); // New state for new todo priority
  const [editingPriority, setEditingPriority] = useState<Priority | undefined>(undefined); // New state for editing todo priority

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isEditingDatePickerVisible, setEditingDatePickerVisibility] = useState(false);
  const [newTodoDueDate, setNewTodoDueDate] = useState<Date | undefined>(undefined);

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
    addTodo(newTodoText, newTodoDueDate, undefined, newTodoPriority); // Pass priority
    setNewTodoText('');
    setNewTodoDueDate(undefined);
    setNewTodoPriority(Priority.Medium); // Reset to default
    Keyboard.dismiss();
  };

  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
    setEditingDueDate(todo.dueDate);
    setEditingPriority(todo.priority || Priority.Medium); // Set editing priority, default to Medium
  };

  const handleAddChecklistItem = () => {
    if (!editingTodoId || newChecklistItemText.trim() === '') return;
    // 編集中のテキストや日付はそのままに、チェックリスト項目のみ追加
    updateTodo(editingTodoId, editingText, editingDueDate, newChecklistItemText);
    setNewChecklistItemText(''); // 入力フィールドをクリアして次の入力を促す
  };

  const handleUpdate = () => {
    if (!editingTodoId) return;
    // 最後に残っているかもしれないチェックリスト項目を追加
    if (newChecklistItemText.trim() !== '') {
      updateTodo(editingTodoId, editingText, editingDueDate, newChecklistItemText, editingPriority);
    } else {
      // チェックリスト項目がなければ、テキストと日付と優先度のみ更新
      updateTodo(editingTodoId, editingText, editingDueDate, undefined, editingPriority);
    }

    // 編集モードを終了
    setEditingTodoId(null);
    setEditingText('');
    setEditingDueDate(undefined);
    setNewChecklistItemText('');
    setEditingPriority(undefined);
  };

  const cancelEditing = () => {
    setEditingTodoId(null);
    setEditingText('');
    setEditingDueDate(undefined);
    setNewChecklistItemText('');
    setEditingPriority(undefined);
  };

  const renderTodo = ({ item }: { item: Todo }) => {
    const isEditing = editingTodoId === item.id;
    const hasChecklist = item.checklist && item.checklist.length > 0;

    return (
      <Card
        style={[
          styles.card,
          PriorityWeight[item.priority || Priority.Medium],
          { marginLeft: PriorityIndentation[item.priority || Priority.Medium] },
        ]}
      >
        <List.Item
          title={
            isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editingText}
                onChangeText={setEditingText}
                autoFocus
                returnKeyType="next" // 連続追加できるように
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
          description={() => (
            <>
              {item.dueDate && (
                <DueDateChip
                  date={new Date(item.dueDate)}
                  onPress={isEditing ? showEditingDatePicker : undefined}
                  editable={isEditing}
                />
              )}
              {isEditing && !item.dueDate && (
                <Button icon="calendar" onPress={showEditingDatePicker} compact mode="text">
                  期限を設定
                </Button>
              )}
              {isEditing && (
                <View style={styles.prioritySelectionContainer}>
                  <Text style={styles.priorityLabel}>優先度:</Text>
                  <SegmentedButtons
                    value={editingPriority || Priority.Medium}
                    onValueChange={value => setEditingPriority(value as Priority)}
                    buttons={[
                      { value: Priority.High, label: Priority.High, style: { flex: 1 } },
                      { value: Priority.Medium, label: Priority.Medium, style: { flex: 1 } },
                      { value: Priority.Low, label: Priority.Low, style: { flex: 1 } },
                    ]}
                    style={styles.priorityButtons}
                  />
                </View>
              )}
            </>
          )}
          descriptionStyle={styles.description}
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
              <View style={styles.row}>
                <IconButton icon="check" onPress={handleUpdate} size={20} />
                <IconButton icon="close" onPress={cancelEditing} size={20} />
              </View>
            ) : (
              <View style={styles.row}>
                <IconButton icon="pencil" onPress={() => startEditing(item)} size={20} />
                <IconButton icon="delete" onPress={() => deleteTodo(item.id)} size={20} />
              </View>
            )
          }
          style={styles.listItem}
        />
        {hasChecklist && <Divider />}
        {hasChecklist &&
          item.checklist?.map(checklistItem => (
            <ChecklistItem
              key={checklistItem.id}
              item={checklistItem}
              todoId={item.id}
              onToggle={toggleChecklistItem}
            />
          ))}
        {isEditing && (
          <View style={styles.addChecklistItemContainer}>
            <TextInput
              label="新しいチェックリスト項目"
              value={newChecklistItemText}
              onChangeText={setNewChecklistItemText}
              dense
              style={styles.addChecklistItemInput}
              onSubmitEditing={handleAddChecklistItem} // Enterでも追加
              returnKeyType="done"
            />
            <IconButton icon="plus" onPress={handleAddChecklistItem} size={20} />
          </View>
        )}
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
            testID="new-todo-input"
            autoComplete="off"
            autoCorrect={false}
          />
          <View style={styles.inputActions}>
            <Button icon="calendar" onPress={showDatePicker}>
              {newTodoDueDate ? format(newTodoDueDate, 'MM/dd HH:mm') : '期限を設定'}
            </Button>
            <Button mode="contained" onPress={handleAddTodo} style={styles.addButton}>
              追加
            </Button>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.prioritySelectionContainer}>
            <Text style={styles.priorityLabel}>優先度:</Text>
            <SegmentedButtons
              value={newTodoPriority}
              onValueChange={value => setNewTodoPriority(value as Priority)}
              buttons={[
                { value: Priority.High, label: Priority.High, style: { flex: 1 } },
                { value: Priority.Medium, label: Priority.Medium, style: { flex: 1 } },
                { value: Priority.Low, label: Priority.Low, style: { flex: 1 } },
              ]}
              style={styles.priorityButtons}
            />
          </View>
        </Card>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={handleConfirmNewTodoDate}
          onCancel={hideDatePicker}
          date={newTodoDueDate || new Date()}
        />
        <DateTimePickerModal
          isVisible={isEditingDatePickerVisible}
          mode="datetime"
          onConfirm={handleConfirmEditingTodoDate}
          onCancel={hideEditingDatePicker}
          date={editingDueDate || new Date()}
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
  container: { flex: 1 },
  inputCard: { margin: 8, padding: 12 },
  input: { marginBottom: 12 },
  inputActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addButton: {
    minWidth: 120,
  },
  list: { flex: 1, paddingHorizontal: 8 },
  card: { marginBottom: 8 },
  listItem: { paddingVertical: 8, paddingHorizontal: 8 },
  title: { fontSize: 16 },
  description: { marginTop: 4 },
  chip: { alignSelf: 'flex-start' },
  chipPast: { backgroundColor: '#ffcdd2' },
  chipText: {},
  chipTextPast: { color: '#b71c1c' },
  checkboxContainer: { marginRight: -4, marginLeft: -8, transform: [{ scale: 0.8 }] },
  editInput: {
    height: 40,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  row: { flexDirection: 'row' },
  checklistItem: { paddingVertical: 0, paddingLeft: 32 },
  addChecklistItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addChecklistItemInput: {
    flex: 1,
  },
  titlePriorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  prioritySelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  priorityLabel: {
    marginRight: 8,
    fontSize: 14,
    color: 'gray',
  },
  priorityButtons: {
    flex: 1,
  },
  divider: {
    marginTop: 12,
    marginBottom: 8,
  },
  high: {
    backgroundColor: '#ffcdd2', // 濃いめの赤
  },
  medium: {
    backgroundColor: '#fff9c4', // 中くらいの黄色
  },
  low: {
    backgroundColor: '#e8f5e9', // 薄い緑
  },
});

export const PriorityWeight: Record<Priority, ViewStyle> = {
  [Priority.High]: styles.high,
  [Priority.Medium]: styles.medium,
  [Priority.Low]: styles.low, // これもlowにした方がいいのでは？
};

const PriorityIndentation: Record<Priority, number> = {
  [Priority.High]: 0,
  [Priority.Medium]: 10,
  [Priority.Low]: 20,
};
