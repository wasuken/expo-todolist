import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Text } from 'react-native';
import {
  Appbar,
  List,
  Button,
  TextInput,
  IconButton,
  useTheme,
  Snackbar,
  Card,
  SegmentedButtons, // Import SegmentedButtons
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Preset, PresetTask } from '../types'; // Import from centralized types
import { Priority } from '../contexts/TodoContext'; // Import Priority
import ChecklistItemInput from './components/ChecklistItemInput'; // Import ChecklistItemInput

// --- 型定義 ---
type RootStackParamList = {
  MainTabs: undefined;
  PresetEdit: { presetId?: string };
};
type PresetEditScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PresetEdit'>;

const PRESETS_STORAGE_KEY = '@presets';

// --- メモ化されたコンポーネント ---

const TaskInputRow = ({
  item,
  index,
  onTaskTextChange,
  onDueHoursOffsetChange,
  onPriorityChange, // New prop for priority change
  onRemove,
  canRemove,
  onChecklistItemChange,
  onAddChecklistItem,
  onRemoveChecklistItem,
}: {
  item: PresetTask;
  index: number;
  onTaskTextChange: (index: number, text: string) => void;
  onDueHoursOffsetChange: (index: number, value: string) => void;
  onPriorityChange: (index: number, priority: Priority) => void; // New prop
  onRemove: (index: number) => void;
  canRemove: boolean;
  onChecklistItemChange: (taskIndex: number, itemIndex: number, text: string) => void;
  onAddChecklistItem: (taskIndex: number) => void;
  onRemoveChecklistItem: (taskIndex: number, itemIndex: number) => void;
}) => {
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

// --- メインコンポーネント ---
export default function PresetEditScreen() {
  const navigation = useNavigation<PresetEditScreenNavigationProp>();
  const route = useRoute<any>();
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [preset, setPreset] = useState<Partial<Preset>>({
    name: '',
    tasks: [
      {
        id: Math.random().toString(),
        text: '',
        dueHoursOffset: 24,
        checklist: [],
        priority: Priority.Medium,
      },
    ], // Default priority
  });
  const [isNew, setIsNew] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    const presetId = route.params?.presetId;
    if (presetId) {
      setIsNew(false);
      const loadPreset = async () => {
        try {
          const storedPresets = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
          if (storedPresets) {
            const presets: Preset[] = JSON.parse(storedPresets);
            const existingPreset = presets.find(p => p.id === presetId);
            if (existingPreset) {
              setPreset(existingPreset);
            }
          }
        } catch (error) {
          console.error('Failed to load the preset.', error);
        }
      };
      loadPreset();
    }
  }, [route.params?.presetId]);

  const handleSave = async () => {
    if (!preset.name || preset.name.trim() === '') {
      setSnackbarVisible(true);
      return;
    }
    try {
      const storedPresets = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
      let presets: Preset[] = storedPresets ? JSON.parse(storedPresets) : [];

      const tasks = (preset.tasks || [])
        .filter(t => t.text.trim() !== '')
        .map(t => ({
          ...t,
          checklist: (t.checklist || []).filter(c => c.trim() !== ''),
          priority: t.priority || Priority.Medium, // Ensure priority is set
        }));

      if (isNew) {
        const newPreset: Preset = {
          id: Date.now().toString(),
          name: preset.name.trim(),
          tasks: tasks,
          createdAt: new Date(),
        };
        presets.push(newPreset);
      } else {
        presets = presets.map(p =>
          p.id === preset.id ? { ...p, name: preset.name!.trim(), tasks } : p
        );
      }

      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save preset.', error);
    }
  };

  const scrollToEnd = () => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // --- タスク & チェックリストのハンドラ ---
  const updatePresetName = (name: string) => {
    setPreset(p => ({ ...p, name }));
  };

  const handleTaskChange = useCallback(
    <K extends keyof PresetTask>(index: number, key: K, value: PresetTask[K]) => {
      setPreset(p => {
        const newTasks = [...(p.tasks || [])];
        newTasks[index] = { ...newTasks[index], [key]: value };
        return { ...p, tasks: newTasks };
      });
    },
    []
  );

  const handleAddTaskInput = useCallback(() => {
    setPreset(p => ({
      ...p,
      tasks: [
        ...(p.tasks || []),
        {
          id: Math.random().toString(),
          text: '',
          dueHoursOffset: 24,
          checklist: [],
          priority: Priority.Medium,
        },
      ],
    }));
    scrollToEnd();
  }, []);

  const handleRemoveTaskInput = useCallback((index: number) => {
    setPreset(p => ({ ...p, tasks: (p.tasks || []).filter((_, i) => i !== index) }));
  }, []);

  const handleChecklistItemChange = useCallback(
    (taskIndex: number, itemIndex: number, text: string) => {
      setPreset(p => {
        const newTasks = [...(p.tasks || [])];
        const newChecklist = [...(newTasks[taskIndex].checklist || [])];
        newChecklist[itemIndex] = text;
        newTasks[taskIndex] = { ...newTasks[taskIndex], checklist: newChecklist };
        return { ...p, tasks: newTasks };
      });
    },
    []
  );

  const handleAddChecklistItem = useCallback((taskIndex: number) => {
    setPreset(p => {
      const newTasks = [...(p.tasks || [])];
      const newChecklist = [...(newTasks[taskIndex].checklist || []), ''];
      newTasks[taskIndex] = { ...newTasks[taskIndex], checklist: newChecklist };
      return { ...p, tasks: newTasks };
    });
    scrollToEnd();
  }, []);

  const handleRemoveChecklistItem = useCallback((taskIndex: number, itemIndex: number) => {
    setPreset(p => {
      const newTasks = [...(p.tasks || [])];
      const newChecklist = (newTasks[taskIndex].checklist || []).filter((_, i) => i !== itemIndex);
      newTasks[taskIndex] = { ...newTasks[taskIndex], checklist: newChecklist };
      return { ...p, tasks: newTasks };
    });
  }, []);

  // --- レンダリング ---
  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isNew ? '新規プリセット' : 'プリセットを編集'} />
        <Button color={theme.colors.primary} onPress={handleSave}>
          保存
        </Button>
      </Appbar.Header>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.content}>
            <TextInput
              label="プリセット名"
              value={preset.name}
              onChangeText={updatePresetName}
              mode="outlined"
              style={styles.input}
            />
            <List.Subheader>プリセットタスク</List.Subheader>
            {(preset.tasks || []).map((task, index) => (
              <TaskInputRow
                key={task.id}
                item={task}
                index={index}
                onTaskTextChange={text => handleTaskChange(index, 'text', text)}
                onDueHoursOffsetChange={value =>
                  handleTaskChange(
                    index,
                    'dueHoursOffset',
                    isNaN(Number(value)) ? undefined : Number(value)
                  )
                }
                onPriorityChange={priority => handleTaskChange(index, 'priority', priority)}
                onRemove={handleRemoveTaskInput}
                canRemove={(preset.tasks?.length || 0) > 1}
                onChecklistItemChange={handleChecklistItemChange}
                onAddChecklistItem={handleAddChecklistItem}
                onRemoveChecklistItem={handleRemoveChecklistItem}
              />
            ))}
            <Button
              icon="plus"
              mode="outlined"
              onPress={handleAddTaskInput}
              style={styles.addTaskButton}
            >
              タスクを追加
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={Snackbar.DURATION_SHORT}
      >
        プリセット名を入力してください。
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40, // スクロール領域の末尾に余白を追加
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  addTaskButton: {
    marginTop: 16,
  },
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
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistItemInput: {
    flex: 1,
    fontSize: 14,
    height: 32,
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
    marginVertical: 10,
  },
  priorityLabel: {
    marginRight: 8,
    fontSize: 14,
    color: 'gray',
  },
  priorityButtons: {
    flex: 1,
  },
});
