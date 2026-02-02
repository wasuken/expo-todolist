import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { TodoProvider } from './contexts/TodoContext';
import TasksScreen from './screens/TasksScreen';
import PresetsScreen from './screens/PresetsScreen';
import HistoryScreen from './screens/HistoryScreen';
import PresetEditScreen from './screens/PresetEditScreen'; // 新しいスクリーンをインポート

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac4',
    background: '#ffffee',
    surface: '#999999',
    onSurface: '#ffffee',
  },
};

// メインのタブナビゲーションコンポーネント
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] =
            'help-circle-outline';

          if (route.name === 'タスク') {
            iconName = 'check-circle-outline';
          } else if (route.name === 'プリセット') {
            iconName = 'tune';
          } else if (route.name === '履歴') {
            iconName = 'history';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="タスク" component={TasksScreen} />
      <Tab.Screen name="プリセット" component={PresetsScreen} />
      <Tab.Screen name="履歴" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

// アプリ全体のナビゲーションスタック
export default function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <TodoProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="PresetEdit"
              component={PresetEditScreen}
              options={{ presentation: 'modal' }} // モーダルとして表示
            />
          </Stack.Navigator>
        </NavigationContainer>
      </TodoProvider>
    </PaperProvider>
  );
}
