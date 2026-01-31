# Gemini AI Coding Rules

## General Principles
- Always provide complete, working code
- Include all necessary imports
- Add TypeScript types for all functions and components
- Include error handling
- Write clean, readable code with proper comments

## Expo/React Native Specific
- Use Expo SDK compatible packages only
- Prefer `npx expo install` over `npm install` for expo packages
- Use functional components with hooks (no class components)
- Follow React Native best practices

## Code Style
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over promises chains
- Add proper TypeScript interfaces for all data structures

## Output Format
When generating code, always include:
1. Complete file content (not snippets)
2. Installation commands for all dependencies
3. File path/name where code should be placed
4. Brief explanation of implementation

## Dependencies
- Always specify exact package names
- Mention if package requires native code (avoid if possible for Expo)
- Prefer Expo-compatible packages

## Testing
- Code should be testable and runnable immediately
- Include sample data or mock data if needed
- No placeholder code like "// Add your logic here"

## When Errors Occur
- Provide complete error messages
- Suggest specific fixes with code examples
- Explain why the error happened

## URL and Citations
- Always include official documentation URLs
- Cite sources for best practices or patterns used
- If a URL is inaccessible, explicitly state "URL could not be accessed"

# Todo App Specific Rules

## Tech Stack (Fixed)
- Expo with TypeScript
- React Native Paper for UI
- AsyncStorage for persistence
- No additional state management libraries (use useState/useReducer)

## Code Structure
- Single App.tsx for minimal version
- Separate components only when requested
- Keep it simple and readable

## Data Model
```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}
```

## UI/UX Guidelines
- Material Design via React Native Paper
- Minimal and clean interface
- Inline editing for todos
- Clear visual feedback for actions


# Phase 1: Navigation & UI Improvements

## Screen Structure
- Use React Navigation Bottom Tabs
- 3 tabs:
  1. "Tasks" - Main todo list
  2. "Presets" - Preset management (placeholder for now)
  3. "History" - Calendar view (placeholder for now)

## UI Improvements
- Make checkboxes smaller and closer to todo text
- Use React Native Paper's Checkbox component
- Compact list item design

## Implementation
- Move current todo logic to Tasks screen
- Create placeholder screens for Presets and History
- Set up bottom tab navigation with icons
### Implemented Feature: Tab Bar Icons for Navigation

- **概要**: `App.tsx`のフッタータブにアイコンが表示されるように修正しました。`Tab.Navigator`の`screenOptions`内にある`tabBarIcon`プロパティで、`route.name`の比較文字列を日本語のタブ名に一致させるように変更しました。また、`iconName`の型をより厳密にし、どのタブにも一致しない場合のデフォルトアイコンを設定することで、コードの安全性とUXを向上させました。
- **使用したライブラリとバージョン**:
    - `@react-navigation/bottom-tabs`: `^7.10.1`
    - `react-native-paper`: `^5.14.5`
    - `@expo/vector-icons`: (Expo SDKに含まれるため、バージョンはExpoのものが適用されます。`expo`のバージョンは`~54.0.32`)
- **ハマったポイントと解決策**:
    - **ハマったポイント**: `tabBarIcon`プロパティ内の`route.name`の比較が、`Tab.Screen`で設定されている日本語のタブ名（例: `'タスク'`）ではなく、初期の英語のスクリーン名（例: `'Tasks'`）を参照していたため、アイコンが正しく表示されませんでした。
    - **解決策**: `route.name`の比較文字列を日本語のタブ名（「タスク」「プリセット」「履歴」）に修正することで、アイコンが期待通りに表示されるようになりました。また、`iconName`の型を`React.ComponentProps<typeof MaterialCommunityIcons>['name']`と厳密に指定し、安全性を高めました。
- **次回への引き継ぎ事項**:
    - `tabBarIcon`でデフォルトのアイコンとして`'help-circle-outline'`を設定しましたが、もし該当するルート名がない場合にどのように表示するか、より具体的なUI/UXの検討が必要かもしれません。

## Expo Specific Rules
- Use `@expo/vector-icons` instead of `react-native-vector-icons`
- Import example: `import { MaterialCommunityIcons } from '@expo/vector-icons';`
- Never use packages that require native linking (use Expo SDK equivalents)

# Phase 2: Preset Management

## Data Structure
```typescript
interface Preset {
  id: string;
  name: string;
  tasks: string[];
  createdAt: Date;
}
```

## Features
- Create new preset with name and task list
- Edit existing preset
- Delete preset
- Load preset: Add all tasks from preset to main todo list
- Persist presets in AsyncStorage

## UI Requirements (PresetsScreen)
- List of saved presets (use React Native Paper List)
- FAB (Floating Action Button) to create new preset
- Dialog/Modal for creating/editing preset
- Each preset item shows:
  - Preset name
  - Number of tasks
  - Load button (adds tasks to main list)
  - Edit/Delete icons

## Implementation Notes
- Store presets separately in AsyncStorage key 'presets'
- When loading preset, create new todos with current timestamp
- Use TextInput for preset name
- Use multi-line TextInput or array of inputs for task list


# Phase 3: History & Calendar View

## Data Structure
```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;  // 完了日時を追加
}

interface CompletionHistory {
  [date: string]: Todo[];  // 'YYYY-MM-DD' をキーにした辞書
}
```

## Features
- Save completion date when todo is marked as completed
- Display calendar with markers on dates that have completed tasks
- Show completed tasks for selected date below calendar
- Default selected date: today

## UI Layout (Top-Bottom Split)
```
┌─────────────────────┐
│  Calendar (40%)     │ ← Month view with completion markers
│  Marked dates       │
├─────────────────────┤
│  Selected: 01/31    │ ← Header showing selected date
│  ✓ Task 1          │ ← List of completed tasks
│  ✓ Task 2          │   for that date
│  ✓ Task 3          │
└─────────────────────┘
```

## Implementation Requirements
- Use react-native-calendars library
- Mark dates with completed tasks using dots/markers
- On date selection, filter and display that day's completed tasks
- Store completion history in AsyncStorage
- Update TodoContext to save completedAt timestamp

## Calendar Config
- Show dots on dates with completions
- Different color dot for today
- Highlight selected date

### Implemented Feature: History & Calendar View

- **概要**: HistoryScreen に react-native-calendars を使用してカレンダー表示を実装しました。完了したタスクの日付にマーカーを表示し、選択した日付の完了タスク一覧を下部に表示する上下分割レイアウトを実装しました。TodoContext に completedAt フィールドを追加し、タスク完了時に日時を保存するようにしました。

- **使用したライブラリとバージョン**:
    - `react-native-calendars`: `^1.1306.0`
    - `@react-native-async-storage/async-storage`: (既存)
    - `react-native-paper`: `^5.14.5`

- **ハマったポイントと解決策**:
    - **ハマったポイント1**: MarkedDates の型定義が TypeScript で必要だった。`{ [key: string]: { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string; } }` という型を明示的に定義する必要がありました。
    - **ハマったポイント2**: List.Subheader の配置位置。当初リストの最後に配置していたが、表示が不自然だったため、リストの最初（tasksForSelectedDate.map の前）に移動しました。
    - **ハマったポイント3**: description プロパティの記法。`description=\`...\`` ではなく `description={\`...\`}` と {} で囲む必要がありました。

- **次回への引き継ぎ事項**:
    - カレンダーのテーマカラーは theme.colors.primary に統一済み
    - 日付フォーマットは YYYY-MM-DD 形式（toISOString().split('T')[0]）を使用
    - 完了タスクは completedAt フィールドで管理、未完了タスクには completedAt がない
