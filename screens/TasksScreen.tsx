import React, { useState, useMemo } from 'react';
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
  TodoStatus,
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
    iconColor = theme.colors.error; // Keep red for past due
  } else if (isUrgent) {
    iconColor = '#EF5350'; // Explicitly set to a vibrant red for urgent tasks
  }
  const content = (
    <Chip
      icon="calendar-clock"
      style={[styles.chip, isPast && styles.chipPast]}
      textStyle={[styles.chipText, isPast && styles.chipTextPast]}
      iconColor={iconColor}
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

const PriorityChip = ({ priority }: { priority: Priority }) => {
  const theme = useTheme();
  let chipColor = theme.colors.onSurfaceVariant; // Default color
  let textColor = theme.colors.onSurface;

  switch (priority) {
    case Priority.High:
      chipColor = '#EF5350'; // Red
      textColor = '#ffffff';
      break;
    case Priority.Medium:
      chipColor = '#FFCA28'; // Amber
      textColor = '#000000';
      break;
    case Priority.Low:
      chipColor = '#66BB6A'; // Green
      textColor = '#ffffff';
      break;
  }

  return (
    <Chip style={{ backgroundColor: chipColor, marginRight: 8 }} textStyle={{ color: textColor }}>
      {priority}
    </Chip>
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
        <IconButton
          icon={item.completed ? 'checkbox-marked' : 'checkbox-blank-outline'}
          onPress={() => onToggle(todoId, item.id)}
          size={20}
        />
      )}
      style={styles.checklistItem}
    />
  );
};
export default function TasksScreen() {
  const { todos, addTodo, deleteTodo, updateTodo, toggleChecklistItem, updateTodoStatus } =
    useTodos();
  const [newTodoText, setNewTodoText] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDueDate, setEditingDueDate] = useState<Date | undefined>(undefined);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<Priority>(Priority.Medium);
  const [editingPriority, setEditingPriority] = useState<Priority | undefined>(undefined);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isEditingDatePickerVisible, setEditingDatePickerVisibility] = useState(false);
  const [newTodoDueDate, setNewTodoDueDate] = useState<Date | undefined>(undefined);
  const [showCompleted, setShowCompleted] = useState<'all' | 'active'>('active'); // New state
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
    addTodo(newTodoText, newTodoDueDate, undefined, newTodoPriority);
    setNewTodoText('');
    setNewTodoDueDate(undefined);
    setNewTodoPriority(Priority.Medium);
    Keyboard.dismiss();
  };
  const startEditing = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
    setEditingDueDate(todo.dueDate);
    setEditingPriority(todo.priority || Priority.Medium);
  };
  const handleAddChecklistItem = () => {
    if (!editingTodoId || newChecklistItemText.trim() === '') return;
    updateTodo(editingTodoId, editingText, editingDueDate, newChecklistItemText);
    setNewChecklistItemText('');
  };
  const handleUpdate = () => {
    if (!editingTodoId) return;
    if (newChecklistItemText.trim() !== '') {
      updateTodo(editingTodoId, editingText, editingDueDate, newChecklistItemText, editingPriority);
    } else {
      updateTodo(editingTodoId, editingText, editingDueDate, undefined, editingPriority);
    }
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
  const filteredTodos = useMemo(() => {
    if (showCompleted === 'active') {
      return todos.filter(todo => todo.status !== 'done');
    }
    return todos;
  }, [todos, showCompleted]);
  const renderTodo = ({ item }: { item: Todo }) => {
    const isEditing = editingTodoId === item.id;
    const hasChecklist = item.checklist && item.checklist.length > 0;
    const statusStyle = StatusStyles[item.status];
    return (
      <Card style={[styles.card, statusStyle]}>
        <List.Item
          title={
            isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editingText}
                onChangeText={setEditingText}
                autoFocus
                returnKeyType="next"
              />
            ) : (
              <Text
                style={[
                  styles.title,
                  { textDecorationLine: item.status === 'done' ? 'line-through' : 'none' },
                ]}
              >
                {item.text}
              </Text>
            )
          }
          description={() => (
            <View style={styles.descriptionContainer}>
              <View style={styles.row}>
                {item.priority && <PriorityChip priority={item.priority} />}
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
              </View>
              {(item.startedAt || item.completedAt) && (
                <View style={styles.dateContainer}>
                  {item.startedAt && (
                    <Text style={styles.dateText}>
                      開始: {format(new Date(item.startedAt), 'MM/dd HH:mm')}
                    </Text>
                  )}
                  {item.completedAt && (
                    <Text style={styles.dateText}>
                      完了: {format(new Date(item.completedAt), 'MM/dd HH:mm')}
                    </Text>
                  )}
                </View>
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
            </View>
          )}
          descriptionStyle={styles.description}
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

        <Card.Actions>
          <SegmentedButtons
            value={item.status}
            onValueChange={value => updateTodoStatus(item.id, value as TodoStatus)}
            density="small"
            buttons={[
              { value: 'todo', label: 'Todo' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
            ]}
            style={styles.statusButtons}
          />
        </Card.Actions>

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
              onSubmitEditing={handleAddChecklistItem}
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
        <SegmentedButtons
          value={showCompleted}
          onValueChange={value => setShowCompleted(value as 'all' | 'active')}
          buttons={[
            { value: 'active', label: 'アクティブ' },
            { value: 'all', label: '全て' },
          ]}
          style={styles.visibilityButtons}
        />
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
          data={filteredTodos}
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
  addButton: { minWidth: 120 },
  list: { flex: 1, paddingHorizontal: 8 },
  card: { marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  listItem: { paddingVertical: 4, paddingHorizontal: 8 },
  title: { fontSize: 16 },
  description: { marginTop: 4 },
  chip: { alignSelf: 'flex-start' },
  chipPast: { backgroundColor: '#ffcdd2' },
  chipText: {},
  chipTextPast: { color: '#b71c1c' },
  editInput: {
    height: 40,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  checklistItem: { paddingVertical: 0, paddingLeft: 32 },
  addChecklistItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addChecklistItemInput: { flex: 1 },
  prioritySelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  priorityLabel: { marginRight: 8, fontSize: 14, color: 'gray' },
  priorityButtons: { flex: 1 },
  divider: { marginTop: 12, marginBottom: 8 },
  descriptionContainer: {
    marginTop: 4,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  dateContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: 'gray',
    marginRight: 8,
  },
  statusButtons: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  statusTodo: {
    backgroundColor: '#e8f5e9', // Light Green
  },
  statusInProgress: {
    backgroundColor: '#fff9c4', // Light Yellow
  },
  statusDone: {
    backgroundColor: '#f5f5f5', // Light Grey
    borderColor: '#e0e0e0',
  },
  visibilityButtons: {
    width: 200,
  },
});
const StatusStyles: Record<TodoStatus, ViewStyle> = {
  todo: styles.statusTodo,
  in_progress: styles.statusInProgress,
  done: styles.statusDone,
};
