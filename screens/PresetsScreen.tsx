import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, FAB, List, Button, IconButton, useTheme, Text, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTodos } from '../contexts/TodoContext';
import { addHours } from 'date-fns';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// --- データ構造と型の定義 ---
interface PresetTask {
  id: string;
  text: string;
  dueHoursOffset?: number;
  checklist?: string[];
}

interface Preset {
  id: string;
  name: string;
  tasks: PresetTask[];
  createdAt: Date;
}

type RootStackParamList = {
  MainTabs: undefined;
  PresetEdit: { presetId?: string };
};

type PresetsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const PRESETS_STORAGE_KEY = '@presets';

// --- メインコンポーネント ---
export default function PresetsScreen() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const { addTodo } = useTodos();
  const theme = useTheme();
  const navigation = useNavigation<PresetsScreenNavigationProp>();

  // プリセットをストレージから読み込む関数
  const loadPresets = useCallback(async () => {
    try {
      const storedPresets = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
      if (storedPresets !== null) {
        // 日付文字列をDateオブジェクトに変換
        const parsedPresets: Preset[] = JSON.parse(storedPresets).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }));
        // 作成日時の降順でソート
        parsedPresets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setPresets(parsedPresets);
      } else {
        setPresets([]);
      }
    } catch (error) {
      console.error('Failed to load presets.', error);
      setPresets([]); // エラー時は空にする
    }
  }, []);

  // 画面が表示されるたびにプリセットを再読み込みする
  useFocusEffect(
    useCallback(() => {
      loadPresets();
    }, [loadPresets])
  );

  const handleDelete = async (id: string) => {
    try {
      const updatedPresets = presets.filter(p => p.id !== id);
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
    } catch (error) {
      console.error('Failed to delete preset.', error);
    }
  };

  const handleLoadPreset = (tasks: PresetTask[]) => {
    const now = new Date();
    tasks.forEach(presetTask => {
      let dueDate: Date | undefined = undefined;
      if (presetTask.dueHoursOffset !== undefined) {
        dueDate = addHours(now, presetTask.dueHoursOffset);
      }
      addTodo(presetTask.text, dueDate, presetTask.checklist);
    });
  };

  const renderPreset = ({ item }: { item: Preset }) => (
    <Card style={styles.card}>
      <List.Item
        title={item.name}
        description={`タスク数: ${item.tasks.length} / チェックリスト項目: ${item.tasks.reduce((acc, task) => acc + (task.checklist?.length || 0), 0)}`}
        right={() => (
          <View style={styles.actions}>
            <Button
              mode="contained-tonal"
              style={styles.loadButton}
              onPress={() => handleLoadPreset(item.tasks)}
            >
              読み込み
            </Button>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => navigation.navigate('PresetEdit', { presetId: item.id })}
            />
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
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>プリセットはありません。作成しましょう！</Text>
            </View>
          }
          contentContainerStyle={presets.length === 0 ? { flexGrow: 1 } : null}
        />
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('PresetEdit')} // パラメータなしで新規作成
        />
      </View>
    </>
  );
}

// --- スタイル ---
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
});