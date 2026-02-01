import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Appbar,
  List,
  Button,
  TextInput,
  IconButton,
  useTheme,
  Snackbar,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// ナビゲーションの型定義
type RootStackParamList = {
  MainTabs: undefined;
  PresetEdit: { presetId?: string };
};
type PresetEditScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PresetEdit'>;

// データ構造の定義
interface PresetTask {
  id: string;
  text: string;
  dueDaysOffset?: number;
}

interface Preset {
  id: string;
  name: string;
  tasks: PresetTask[];
  createdAt: Date;
}

const PRESETS_STORAGE_KEY = '@presets';

// --- メモ化されたコンポーネント ---
const MemoizedTaskInputRow = React.memo(
  ({
    item,
    index,
    onTaskTextChange,
    onDueDaysOffsetChange,
    onRemove,
    canRemove,
  }: {
    item: PresetTask;
    index: number;
    onTaskTextChange: (index: number, text: string) => void;
    onDueDaysOffsetChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    canRemove: boolean;
  }) => {
    const theme = useTheme();
    return (
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
          label="期限(日数)"
          value={item.dueDaysOffset?.toString() || '0'}
          onChangeText={value => onDueDaysOffsetChange(index, value)}
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
    );
  }
);
// --- ここまでメモ化コンポーネント ---

export default function PresetEditScreen() {
  const navigation = useNavigation<PresetEditScreenNavigationProp>();
  const route = useRoute<any>();
  const theme = useTheme();

  const [preset, setPreset] = useState<Partial<Preset>>({
    name: '',
    tasks: [{ id: Math.random().toString(), text: '', dueDaysOffset: 1 }],
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
      const tasks = preset.tasks?.filter(t => t.text.trim() !== '') || [];

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

  const updatePresetName = (name: string) => {
    setPreset(p => ({ ...p, name }));
  };

  const handleTaskTextChange = useCallback((index: number, text: string) => {
    setPreset(p => {
      const newTasks = [...(p.tasks || [])];
      newTasks[index] = { ...newTasks[index], text };
      return { ...p, tasks: newTasks };
    });
  }, []);

  const handleDueDaysOffsetChange = useCallback((index: number, value: string) => {
    setPreset(p => {
      const newTasks = [...(p.tasks || [])];
      const offset = Number(value);
      newTasks[index] = { ...newTasks[index], dueDaysOffset: isNaN(offset) ? undefined : offset };
      return { ...p, tasks: newTasks };
    });
  }, []);

  const handleAddTaskInput = useCallback(() => {
    setPreset(p => ({
      ...p,
      tasks: [...(p.tasks || []), { id: Math.random().toString(), text: '', dueDaysOffset: 1 }],
    }));
  }, []);

  const handleRemoveTaskInput = useCallback((index: number) => {
    setPreset(p => ({ ...p, tasks: (p.tasks || []).filter((_, i) => i !== index) }));
  }, []);

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
        <ScrollView style={styles.scrollView}>
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
              <MemoizedTaskInputRow
                key={task.id}
                item={task}
                index={index}
                onTaskTextChange={handleTaskTextChange}
                onDueDaysOffsetChange={handleDueDaysOffsetChange}
                onRemove={handleRemoveTaskInput}
                canRemove={(preset.tasks?.length || 0) > 1}
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
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  addTaskButton: {
    marginTop: 16,
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
});
