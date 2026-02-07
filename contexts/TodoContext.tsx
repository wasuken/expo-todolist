import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

// Data structure for a single todo item
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  checklist?: ChecklistItem[];
}

interface TodoContextData {
  todos: Todo[];
  addTodo: (text: string, dueDate?: Date, checklist?: string[]) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, newText: string, newDueDate?: Date, newChecklistItem?: string) => void;
  toggleChecklistItem: (todoId: string, checklistItemId: string) => void;
}

const TodoContext = createContext<TodoContextData>({} as TodoContextData);

export const useTodos = () => useContext(TodoContext);

const STORAGE_KEY = '@todos';

let todoCounter = 0;

// Todoアイテムをソートする関数
const sortTodos = (todos: Todo[]): Todo[] => {
  return [...todos].sort((a, b) => {
    // 1. completed: false (未完了) を completed: true (完了) より前に
    if (a.completed && !b.completed) return 1; // aが完了、bが未完了 => aはbより後
    if (!a.completed && b.completed) return -1; // aが未完了、bが完了 => aはbより前

    // 2. 同じ完了ステータスの場合は、createdAtの降順 (新しいものが上)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
};

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
            checklist: t.checklist || [], // 古いデータのためにフォールバック
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

      setTodos(sortTodos(finalTodos)); // ここでソートを適用
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
        sortTodos( // ここでソートを適用
          prevTodos.filter(todo => {
            // Keep the task if it's completed, has no due date, or the due date is in the future
            return todo.completed || !todo.dueDate || new Date(todo.dueDate) >= now;
          })
        )
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

  const addTodo = (text: string, dueDate?: Date, checklist?: string[]) => {
    if (text.trim() === '') return;
    todoCounter += 1;
    const newTodo: Todo = {
      id: `${Date.now()}-${todoCounter}-${Math.random()}`,
      text: text.trim(),
      completed: false,
      createdAt: new Date(),
      dueDate,
      checklist:
        checklist?.map(
          (item, index) =>
            ({
              id: `${Date.now()}-cl-${index}-${Math.random()}`,
              text: item,
              completed: false,
            } as ChecklistItem)
        ) || [],
    };
    setTodos(prevTodos => sortTodos([newTodo, ...prevTodos])); // ここでソートを適用
  };

  const toggleTodo = (id: string) => {
    setTodos(prevTodos => {
      const updatedTodos = prevTodos.map(todo => {
        if (todo.id === id) {
          const isCompleted = !todo.completed;
          // 親タスクの完了状態に合わせてチェックリストも更新
          const newChecklist =
            todo.checklist?.map(item => ({ ...item, completed: isCompleted })) || [];
          return {
            ...todo,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : undefined,
            checklist: newChecklist,
          };
        }
        return todo;
      });
      return sortTodos(updatedTodos); // ここでソートを適用
    });
  };

  const toggleChecklistItem = (todoId: string, checklistItemId: string) => {
    setTodos(prevTodos => {
      const updatedTodos = prevTodos.map(todo => {
        if (todo.id === todoId) {
          const newChecklist =
            todo.checklist?.map(item => {
              if (item.id === checklistItemId) {
                return { ...item, completed: !item.completed };
              }
              return item;
            }) || [];
          // すべてのチェックリスト項目が完了したら親タスクも完了にする
          const allCompleted = newChecklist.every(item => item.completed);
          return {
            ...todo,
            checklist: newChecklist,
            completed: allCompleted,
            completedAt: allCompleted ? new Date() : undefined,
          };
        }
        return todo;
      });
      return sortTodos(updatedTodos);
    });
  };

  const deleteTodo = (id: string) => {
    setTodos(prevTodos => sortTodos(prevTodos.filter(todo => todo.id !== id))); // ここでソートを適用
  };

  const updateTodo = (
    id: string,
    newText: string,
    newDueDate?: Date,
    newChecklistItem?: string
  ) => {
    setTodos(prevTodos => {
      const updatedTodos = prevTodos.map(todo => {
        if (todo.id === id) {
          const updatedTodo = { ...todo, text: newText, dueDate: newDueDate };
          if (newChecklistItem && newChecklistItem.trim() !== '') {
            const newItem: ChecklistItem = {
              id: `${Date.now()}-cl-${Math.random()}`,
              text: newChecklistItem.trim(),
              completed: false,
            };
            updatedTodo.checklist = [...(updatedTodo.checklist || []), newItem];
          }
          return updatedTodo;
        }
        return todo;
      });
      return sortTodos(updatedTodos); // ここでソートを適用
    });
  };

  return (
    <TodoContext.Provider
      value={{ todos, addTodo, toggleTodo, deleteTodo, updateTodo, toggleChecklistItem }}
    >
      {children}
    </TodoContext.Provider>
  );
};