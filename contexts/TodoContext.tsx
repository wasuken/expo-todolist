import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Data structure for a single todo item
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
}

interface TodoContextData {
  todos: Todo[];
  addTodo: (text: string, dueDate?: Date) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, newText: string, newDueDate?: Date) => void;
}

const TodoContext = createContext<TodoContextData>({} as TodoContextData);

export const useTodos = () => useContext(TodoContext);

const STORAGE_KEY = '@todos';

let todoCounter = 0;

export const TodoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const loadAndCleanTodos = async () => {
      let loadedTodos: Todo[] = [];
      try {
        const storedTodos = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedTodos !== null) {
          loadedTodos = JSON.parse(storedTodos).map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          }));
        }
      } catch (error) {
        console.error('Failed to load todos.', error);
      }

      // Filter expired tasks after loading
      const now = new Date();
      const finalTodos = loadedTodos.filter(todo => {
        return todo.completed || !todo.dueDate || new Date(todo.dueDate) >= now;
      });

      setTodos(finalTodos);
    };

    loadAndCleanTodos();
  }, []);

  useEffect(() => {
    const saveTodos = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch (error) {
        console.error('Failed to save todos.', error);
      }
    };
    saveTodos();
  }, [todos]);

  // Set up the AppState listener for cleaning tasks when app becomes active
  useEffect(() => {
    const removeExpiredTasks = () => {
      const now = new Date();
      setTodos(prevTodos =>
        prevTodos.filter(todo => {
          // Keep the task if it's completed, has no due date, or the due date is in the future
          return todo.completed || !todo.dueDate || new Date(todo.dueDate) >= now;
        })
      );
    };

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        removeExpiredTasks();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const addTodo = (text: string, dueDate?: Date) => {
    if (text.trim() === '') return;
    todoCounter += 1;
    const newTodo: Todo = {
      id: `${Date.now()}-${todoCounter}-${Math.random()}`,
      text: text.trim(),
      completed: false,
      createdAt: new Date(),
      dueDate,
    };
    setTodos(prevTodos => [newTodo, ...prevTodos]);
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(todo => {
        if (todo.id === id) {
          const isCompleted = !todo.completed;
          return {
            ...todo,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : undefined,
          };
        }
        return todo;
      })
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const updateTodo = (id: string, newText: string, newDueDate?: Date) => {
    setTodos(
      todos.map(todo => {
        if (todo.id === id) {
          return {
            ...todo,
            text: newText,
            dueDate: newDueDate !== undefined ? newDueDate : todo.dueDate, // Update dueDate if provided
          };
        }
        return todo;
      })
    );
  };

  return (
    <TodoContext.Provider value={{ todos, addTodo, toggleTodo, deleteTodo, updateTodo }}>
      {children}
    </TodoContext.Provider>
  );
};
