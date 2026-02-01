import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import {
  Appbar,
  FAB,
  List,
  Button,
  Dialog,
  Portal,
  TextInput,
  IconButton,
  useTheme,
  Text,
  Card,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTodos } from '../contexts/TodoContext';
import { addDays } from 'date-fns';

interface PresetTask {
  text: string;
  dueDaysOffset?: number; // Number of days from current date
}

interface Preset {
  id: string;
  name: string;
  tasks: PresetTask[];
  createdAt: Date;
}

const PRESETS_STORAGE_KEY = '@presets';

const PresetNameInput = React.memo(({ value, onBlur }) => {
  const [localName, setLocalName] = useState(value);
   // 親の task.text が変わったときに同期
  useEffect(() => {
    setLocalName(value);
  }, [value]);

  // 親に変更を伝えるのは blur 時だけ
  const handleBlur = () => {
    onBlur(localName);
  };

  return (
    <TextInput
      label="プリセット名"
      value={localName}
      onChangeText={setLocalName}
      onBlur={handleBlur}
      mode="outlined"
      style={styles.input}
      autoComplete="off"
      autoCorrect={false}
    />
  );
});

// 子コンポーネント
const TaskInput = React.memo(
  ({ task, index, onTextChange, onOffsetChange, onRemove, showRemove }) => {
    const theme = useTheme();
    const [localText, setLocalText] = useState(task.text);
    // 親の task.text が変わったときに同期
    useEffect(() => {
      setLocalText(task.text);
    }, [task.text]);

    // 親に変更を伝えるのは blur 時だけ
    const handleBlur = () => {
      onTextChange(localText, index);
    };

    return (
      <View style={styles.taskInputRow}>
        <TextInput
          label={`タスク ${index + 1}`}
          value={localText}
          onChangeText={setLocalText}
          onBlur={handleBlur}
          mode="outlined"
          style={styles.taskTextInput}
        />
        <TextInput
          label="期限(日数)"
          value={task.dueDaysOffset?.toString() || '0'}
          onChangeText={value => onOffsetChange(value, index)}
          keyboardType="numeric"
          mode="outlined"
          style={styles.dueOffsetInput}
        />
        {showRemove && (
          <IconButton icon="close-circle" onPress={onRemove} size={20} color={theme.colors.error} />
        )}
      </View>
    );
  }
);

export default function PresetsScreen() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');
  const [dialogTasks, setDialogTasks] = useState<PresetTask[]>([{ text: '', dueDaysOffset: 0 }]);

  const { addTodo } = useTodos(); // Changed from addTodos to addTodo
  const theme = useTheme();

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const storedPresets = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
        if (storedPresets !== null) {
          const parsedPresets: Preset[] = JSON.parse(storedPresets).map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            tasks: p.tasks.map((task: any) => {
              // Handle old string[] format
              if (typeof task === 'string') {
                return { text: task, dueDaysOffset: 0 };
              }
              return {
                ...task,
                dueDaysOffset:
                  task.dueDaysOffset === null || task.dueDaysOffset === undefined
                    ? 0
                    : Number(task.dueDaysOffset),
              };
            }),
          }));
          setPresets(parsedPresets);
        }
      } catch (error) {
        console.error('Failed to load presets.', error);
      }
    };
    loadPresets();
  }, []);

  useEffect(() => {
    const savePresets = async () => {
      try {
        await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
      } catch (error) {
        console.error('Failed to save presets.', error);
      }
    };
    savePresets();
  }, [presets]);

  const showDialog = () => setVisible(true);
  const hideDialog = () => {
    setVisible(false);
    setIsEditing(null);
    setPresetName('');
    setDialogTasks([{ text: '', dueDaysOffset: 0 }]); // Reset dialog tasks
  };

  const handleSavePreset = () => {
    if (presetName.trim() === '') return;
    const filteredTasks = dialogTasks.filter(task => task.text.trim() !== '');

    if (isEditing) {
      setPresets(
        presets.map(p =>
          p.id === isEditing ? { ...p, name: presetName, tasks: filteredTasks } : p
        )
      );
    } else {
      const newPreset: Preset = {
        id: Date.now().toString(),
        name: presetName.trim(),
        tasks: filteredTasks,
        createdAt: new Date(),
      };
      setPresets([newPreset, ...presets]);
    }
    hideDialog();
  };

  const handleEdit = (preset: Preset) => {
    setIsEditing(preset.id);
    setPresetName(preset.name);
    setDialogTasks(preset.tasks.length > 0 ? preset.tasks : [{ text: '', dueDaysOffset: 0 }]);
    showDialog();
  };

  const handleDelete = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  const handleLoadPreset = (tasks: PresetTask[]) => {
    const now = new Date();
    tasks.forEach(presetTask => {
      let dueDate: Date | undefined = undefined;
      if (presetTask.dueDaysOffset !== undefined) {
        dueDate = addDays(now, presetTask.dueDaysOffset);
      }
      addTodo(presetTask.text, dueDate);
    });
  };

  const handleAddTaskInput = () => {
    setDialogTasks([...dialogTasks, { text: '', dueDaysOffset: 1 }]);
  };

  const handleRemoveTaskInput = (index: number) => {
    const newTasks = [...dialogTasks];
    newTasks.splice(index, 1);
    console.log("debug", index, dialogTasks, newTasks);
    setDialogTasks(newTasks);
  };

  const handleTaskTextChange = (text: string, index: number) => {
    const newTasks = [...dialogTasks];
    newTasks[index].text = text;
    setDialogTasks(newTasks);
  };

  const handleDueDaysOffsetChange = (value: string, index: number) => {
    const newTasks = [...dialogTasks];
    const offset = Number(value);
    newTasks[index].dueDaysOffset = isNaN(offset) ? undefined : offset;
    setDialogTasks(newTasks);
  };

  const renderPreset = ({ item }: { item: Preset }) => (
    <Card style={styles.card}>
      <List.Item
        title={item.name}
        description={`タスク数: ${item.tasks.length}`}
        right={() => (
          <View style={styles.actions}>
            <Button
              mode="contained-tonal"
              style={styles.loadButton}
              onPress={() => handleLoadPreset(item.tasks)}
            >
              読み込み
            </Button>
            <IconButton icon="pencil" size={20} onPress={() => handleEdit(item)} />
            <IconButton icon="delete" size={20} onPress={() => handleDelete(item.id)} />
          </View>
        )}
      />
    </Card>
  );

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title="プリセット" />
      </Appbar.Header>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={presets}
          renderItem={renderPreset}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>プリセットはありません。作成しましょう！</Text>
          }
          contentContainerStyle={presets.length === 0 ? styles.emptyContainer : null}
        />
        <Portal>
          <Dialog visible={visible} onDismiss={hideDialog} style={{ maxHeight: '80%' }}>
            <Dialog.Title>{isEditing ? 'プリセットを編集' : '新規プリセット'}</Dialog.Title>
            <Dialog.Content style={{ flexGrow: 1 }}>
              <ScrollView>
<PresetNameInput
  value={presetName}
  onBlur={(name) => setPresetName(name)}
/>
                <List.Subheader>プリセットタスク</List.Subheader>
                {dialogTasks.map((task, index) => (
                  <TaskInput
                    key={index}
                    task={task}
                    index={index}
                    onTextChange={handleTaskTextChange}
                    onOffsetChange={handleDueDaysOffsetChange}
                    onRemove={() => handleRemoveTaskInput(index)}
                    showRemove={dialogTasks.length > 1}
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
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDialog}>キャンセル</Button>
              <Button onPress={handleSavePreset}>保存</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <FAB icon="plus" style={styles.fab} onPress={showDialog} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadButton: {
    marginRight: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
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
    marginRight: 8,
  },
  addTaskButton: {
    marginTop: 8,
  },
});
