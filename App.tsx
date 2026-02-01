import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import { MaterialCommunityIcons } from '@expo/vector-icons';

import { TodoProvider } from './contexts/TodoContext';
import TasksScreen from './screens/TasksScreen';
import PresetsScreen from './screens/PresetsScreen';
import HistoryScreen from './screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac4', // Adjusted from accent
    background: '#ffffee',
    surface: '#ffffee',
    onSurface: '#000ee0',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <TodoProvider>
        <NavigationContainer>
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
        </NavigationContainer>
      </TodoProvider>
    </PaperProvider>
  );
}
