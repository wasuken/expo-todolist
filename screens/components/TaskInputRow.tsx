import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Button,
  TextInput,
  IconButton,
  useTheme,
  Card,
  SegmentedButtons,
  List,
  Text,
} from 'react-native-paper';
import ChecklistItemInput from './ChecklistItemInput'; // Import ChecklistItemInput
import { PresetTask } from '../../types'; // Import PresetTask from centralized types
import { Priority } from '../../contexts/TodoContext'; // Import Priority

interface TaskInputRowProps {
  item: PresetTask;
  index: number;
  onTaskTextChange: (index: number, text: string) => void;
  onDueHoursOffsetChange: (index: number, value: string) => void;
  onPriorityChange: (index: number, priority: Priority) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  onChecklistItemChange: (taskIndex: number, itemIndex: number, text: string) => void;
  onAddChecklistItem: (taskIndex: number) => void;
  onRemoveChecklistItem: (taskIndex: number, itemIndex: number) => void;
}

const TaskInputRow: React.FC<TaskInputRowProps> = (props) => {
  const {
    item,
    index,
    onTaskTextChange,
    onDueHoursOffsetChange,
    onPriorityChange,
    onRemove,
    canRemove,
    onChecklistItemChange,
    onAddChecklistItem,
    onRemoveChecklistItem,
  } = props;

  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={styles.taskCard}>
      <View style={styles.taskInputRow}>
        <TextInput
          label={`タスク ${index + 1}`}
          value={item.text}
          onChangeText={text => onTaskTextChange(index, text)}
          mode="outlined"
          style={styles.taskTextInput}
          autoComplete="off"
          autoCorrect={false}
        />
        <TextInput
          label="期限(時間)"
          value={item.dueHoursOffset?.toString() || '0'}
          onChangeText={value => onDueHoursOffsetChange(index, value)}
          keyboardType="numeric"
          mode="outlined"
          style={styles.dueOffsetInput}
        />
        {canRemove && (
          <IconButton
            icon="close-circle"
            onPress={() => onRemove(index)}
            size={20}
            color={theme.colors.error}
          />
        )}
      </View>
      <View style={styles.prioritySelectionContainer}>
        <Text style={styles.priorityLabel}>優先度:</Text>
        <SegmentedButtons
          value={item.priority || Priority.Medium}
          onValueChange={value => onPriorityChange(index, value as Priority)}
          buttons={[
            { value: Priority.High, label: Priority.High, style: { flex: 1 } },
            { value: Priority.Medium, label: Priority.Medium, style: { flex: 1 } },
            { value: Priority.Low, label: Priority.Low, style: { flex: 1 } },
          ]}
          style={styles.priorityButtons}
        />
      </View>
      <List.Accordion
        title="チェックリスト"
        left={props => <List.Icon {...props} icon="format-list-checks" />}
        expanded={expanded}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.checklistContainer}>
          {(item.checklist || []).map((checklistItem, itemIndex) => (
            <ChecklistItemInput
              key={itemIndex}
              value={checklistItem}
              taskIndex={index}
              itemIndex={itemIndex}
              onChecklistItemChange={onChecklistItemChange}
              onRemove={onRemoveChecklistItem}
            />
          ))}
          <Button
            icon="plus"
            mode="text"
            onPress={() => onAddChecklistItem(index)}
            style={styles.addChecklistItemButton}
          >
            項目を追加
          </Button>
        </View>
      </List.Accordion>
    </Card>
  );
};

export default TaskInputRow;

const styles = StyleSheet.create({
  taskCard: {
    marginBottom: 12,
    padding: 8,
  },
  taskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTextInput: {
    flex: 1,
    marginRight: 8,
  },
  dueOffsetInput: {
    width: 100,
  },
  checklistContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addChecklistItemButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  prioritySelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    paddingHorizontal: 8,
  },
  priorityLabel: {
    marginRight: 8,
    fontSize: 14,
    color: 'gray',
  },
  priorityButtons: {
    flex: 1,
    height: 30, // Adjust height to make them smaller
  },
});