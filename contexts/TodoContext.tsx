import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHours } from 'date-fns';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export enum Priority {
  High = '高',
  Medium = '中',
  Low = '低',
}

export const PriorityWeight: Record<Priority, number> = {
  [Priority.High]: 1,
  [Priority.Medium]: 2,
  [Priority.Low]: 3,
};

export type TodoStatus = 'todo' | 'in_progress' | 'done';

// Data structure for a single todo item
export interface Todo {
  id: string;
  text: string;
  status: TodoStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  checklist?: ChecklistItem[];
  priority?: Priority;
}

interface TodoContextData {
  todos: Todo[];
  addTodo: (text: string, dueDate?: Date, checklist?: string[], priority?: Priority) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (
    id: string,
    newText?: string,
    newDueDate?: Date,
    newChecklistItem?: string,
    newPriority?: Priority
  ) => void;
  updateTodoStatus: (id: string, status: TodoStatus) => void;
  toggleChecklistItem: (todoId: string, checklistItemId: string) => void;
}

const TodoContext = createContext<TodoContextData>({} as TodoContextData);

export const useTodos = () => useContext(TodoContext);

const STORAGE_KEY = '@todos';

let todoCounter = 0;

// Function to get the due date group for a todo
const getDueDateGroup = (todo: Todo, now: Date): number => {
  if (todo.status === 'done') return 4; // Completed tasks are in their own group
  if (!todo.dueDate) return 3; // No due date

  const dueDate = new Date(todo.dueDate);
  if (dueDate < now) return 0; // Overdue
  if (dueDate < addHours(now, 8)) return 1; // Urgent (within 8 hours)
  return 2; // Later
};

const StatusWeight: Record<TodoStatus, number> = {
  in_progress: 1,
  todo: 2,
  done: 3,
};

// New sorting function
const sortTodos = (todos: Todo[]): Todo[] => {
  const now = new Date();

  return [...todos].sort((a, b) => {
    // 1. Status
    const statusA = StatusWeight[a.status];
    const statusB = StatusWeight[b.status];
    if (statusA !== statusB) {
      return statusA - statusB;
    }

    // 2. Due date group
    const groupA = getDueDateGroup(a, now);
    const groupB = getDueDateGroup(b, now);
    if (groupA !== groupB) {
      return groupA - groupB;
    }

    // 3. Priority
    const priorityA = a.priority ? PriorityWeight[a.priority] : PriorityWeight[Priority.Medium];
    const priorityB = b.priority ? PriorityWeight[b.priority] : PriorityWeight[Priority.Medium];
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 4. Due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    return 0; // Keep original order if all else is equal
  });
};

export const TodoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const loadAndCleanTodos = async () => {
      try {
        // Clear storage for a fresh start as requested
        await AsyncStorage.removeItem(STORAGE_KEY);
        // This part is for initial testing, in a real app you would load existing data
        const storedTodos = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedTodos !== null) {
          const loadedTodos = JSON.parse(storedTodos).map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            startedAt: t.startedAt ? new Date(t.startedAt) : undefined,
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            checklist: t.checklist || [],
            priority: t.priority || Priority.Medium,
            status: t.status || 'todo',
          }));
          setTodos(loadedTodos);
        }
      } catch (error) {
        console.error('Failed to load todos.', error);
      }
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
          return todo.status === 'done' || !todo.dueDate || new Date(todo.dueDate) >= now;
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

  const addTodo = (
    text: string,
    dueDate?: Date,
    checklist?: string[],
    priority: Priority = Priority.Medium
  ) => {
    if (text.trim() === '') return;
    todoCounter += 1;
    const newTodo: Todo = {
      id: `${Date.now()}-${todoCounter}-${Math.random()}`,
      text: text.trim(),
      status: 'todo',
      createdAt: new Date(),
      dueDate,
      checklist:
        checklist?.map(
          (item, index) =>
            ({
              id: `${Date.now()}-cl-${index}-${Math.random()}`,
              text: item,
              completed: false,
            }) as ChecklistItem
        ) || [],
      priority,
    };
    setTodos(prevTodos => [newTodo, ...prevTodos]);
  };

  const updateTodoStatus = (id: string, status: TodoStatus) => {
    setTodos(prevTodos =>
      prevTodos.map(todo => {
        if (todo.id === id) {
          const updatedTodo = { ...todo, status };
          if (status === 'in_progress' && !todo.startedAt) {
            updatedTodo.startedAt = new Date();
          }
          if (status === 'done') {
            updatedTodo.completedAt = new Date();
          } else {
            updatedTodo.completedAt = undefined;
          }
          return updatedTodo;
        }
        return todo;
      })
    );
  };

  const toggleChecklistItem = (todoId: string, checklistItemId: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo => {
        if (todo.id === todoId) {
          const newChecklist =
            todo.checklist?.map(item => {
              if (item.id === checklistItemId) {
                return { ...item, completed: !item.completed };
              }
              return item;
            }) || [];
          return {
            ...todo,
            checklist: newChecklist,
          };
        }
        return todo;
      })
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  const updateTodo = (
    id: string,
    newText?: string,
    newDueDate?: Date,
    newChecklistItem?: string,
    newPriority?: Priority
  ) => {
    setTodos(prevTodos =>
      prevTodos.map(todo => {
        if (todo.id === id) {
          const updatedTodo = { ...todo };
          if (newText !== undefined) {
            updatedTodo.text = newText;
          }
          if (newDueDate !== undefined) {
            updatedTodo.dueDate = newDueDate;
          }
          if (newPriority !== undefined) {
            updatedTodo.priority = newPriority;
          }
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
      })
    );
  };

  const sortedTodos = React.useMemo(() => sortTodos(todos), [todos]);

  return (
    <TodoContext.Provider
      value={{
        todos: sortedTodos,
        addTodo,
        deleteTodo,
        updateTodo,
        updateTodoStatus,
        toggleChecklistItem,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};
