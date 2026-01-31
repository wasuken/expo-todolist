# Gemini AI コーディングルール

## 一般原則
- 常に完全で動作するコードを提供する
- 必要なインポートはすべて含める
- すべての関数とコンポーネントにTypeScript型を追加する
- エラーハンドリングを含める
- クリーンで読みやすいコードと適切なコメントを書く

## Expo/React Native 特有の原則
- Expo SDK互換のパッケージのみを使用する
- Expoパッケージには`npm install`ではなく`npx expo install`を推奨する
- フックを使用した関数コンポーネントを使用する（クラスコンポーネントは使用しない）
- React Nativeのベストプラクティスに従う

## コードスタイル
- TypeScriptのstrictモードを使用する
- `let`よりも`const`を推奨する
- プロミスチェーンよりもasync/awaitを使用する
- すべてのデータ構造に適切なTypeScriptインターフェースを追加する

## 出力フォーマット
コードを生成する際は、常に以下を含める：
1. 完全なファイルの内容（スニペットではない）
2. すべての依存関係のインストールコマンド
3. コードを配置すべきファイルパス/名前
4. 実装に関する簡単な説明

## 依存関係
- 常に正確なパッケージ名を指定する
- パッケージがネイティブコードを必要とする場合は言及する（Expoの場合は可能な限り避ける）
- Expo互換パッケージを推奨する

## テスト
- コードはすぐにテスト可能で実行可能であること
- 必要に応じてサンプルデータやモックデータを含める
- 「// ここにロジックを追加」のようなプレースホルダーコードは含めない

## Git

- 勝手にCommitしない。
- 修正→問題ないと判断したらユーザーがCommitする。

## エラー発生時
- 完全なエラーメッセージを提供する
- コード例付きで具体的な修正案を提案する
- エラーが発生した理由を説明する

## URLと引用
- 常に公式ドキュメントのURLを含める
- 使用したベストプラクティスやパターンの情報源を引用する
- URLにアクセスできない場合は、明示的に「URLにアクセスできませんでした」と記載する

# Todoアプリ固有のルール

## 技術スタック (固定)
- ExpoとTypeScript
- UIにはReact Native Paper
- 永続化にはAsyncStorage
- 追加のステート管理ライブラリは使用しない（useState/useReducerを使用）

## コード構造
- 最小バージョンでは単一のApp.tsx
- リクエストがあった場合にのみコンポーネントを分離する
- シンプルで読みやすく保つ

## データモデル
```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}
```

## UI/UX ガイドライン
- React Native Paperによるマテリアルデザイン
- 最小限でクリーンなインターフェース
- TODOのインライン編集
- アクションに対する明確な視覚的フィードバック

# フェーズ1: ナビゲーションとUIの改善

## スクリーン構造
- React Navigation Bottom Tabsを使用
- 3つのタブ:
  1. "Tasks"（タスク） - メインのTODOリスト
  2. "Presets"（プリセット） - プリセット管理（現時点ではプレースホルダー）
  3. "History"（履歴） - カレンダービュー（現時点ではプレースホルダー）

## UI改善
- チェックボックスを小さくし、TODOテキストに近づける
- React Native PaperのCheckboxコンポーネントを使用する
- コンパクトなリストアイテムデザイン

## 実装
- 現在のTODOロジックをタスク画面に移動する
- プリセットと履歴のプレースホルダー画面を作成する
- アイコン付きのボトムタブナビゲーションを設定する
### 実装済み機能: タブバーのアイコンナビゲーション

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

## Expo固有のルール
- `react-native-vector-icons`ではなく`@expo/vector-icons`を使用する
- インポート例: `import { MaterialCommunityIcons } from '@expo/vector-icons';`
- ネイティブリンクを必要とするパッケージは絶対に使用しない（Expo SDKの同等品を使用する）

# フェーズ2: プリセット管理

## データ構造
```typescript
interface Preset {
  id: string;
  name: string;
  tasks: string[];
  createdAt: Date;
}
```

## 機能
- 名前とタスクリストで新しいプリセットを作成する
- 既存のプリセットを編集する
- プリセットを削除する
- プリセットを読み込む: プリセットのすべてのタスクをメインのTODOリストに追加する
- AsyncStorageにプリセットを永続化する

## UI要件 (PresetsScreen)
- 保存されたプリセットのリスト（React Native PaperのListを使用）
- 新しいプリセットを作成するためのFAB（フローティングアクションボタン）
- プリセット作成/編集のためのダイアログ/モーダル
- 各プリセットアイテムに以下を表示:
  - プリセット名
  - タスク数
  - 読み込みボタン（メインリストにタスクを追加）
  - 編集/削除アイコン

## 実装ノート
- プリセットはAsyncStorageキー「presets」に個別に保存する
- プリセットを読み込む際は、現在のタイムスタンプで新しいTODOを作成する
- プリセット名にはTextInputを使用する
- タスクリストには複数行のTextInputまたは入力配列を使用する

# フェーズ3: 履歴とカレンダービュー

## データ構造
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

## 機能
- TODOが完了とマークされたときに完了日を保存する
- 完了したタスクがある日付にマーカーを付けたカレンダーを表示する
- 選択した日付の完了したタスクをカレンダーの下に表示する
- デフォルトの選択日付: 今日

## UIレイアウト (上下分割)
```
┌─────────────────────┐
│  カレンダー (40%)   │ ← 完了マーカー付きの月間表示
│  マークされた日付   │
├─────────────────────┤
│  選択済み: 01/31    │ ← 選択された日付を示すヘッダー
│  ✓ タスク1          │ ← その日付の完了したタスクのリスト
│  ✓ タスク2          │
│  ✓ タスク3          │
└─────────────────────┘
```

## 実装要件
- react-native-calendarsライブラリを使用する
- 完了したタスクがある日付にドット/マーカーを付ける
- 日付選択時に、その日の完了したタスクをフィルタリングして表示する
- AsyncStorageに完了履歴を保存する
- TodoContextを更新してcompletedAtタイムスタンプを保存する

## カレンダー設定
- 完了した日付にドットを表示する
- 今日の日付には異なる色のドットを表示する
- 選択した日付をハイライトする

### 実装済み機能: 履歴とカレンダービュー

- **概要**: HistoryScreen に react-native-calendars を使用してカレンダー表示を実装しました。完了したタスクの日付にマーカーを表示し、選択した日付の完了タスク一覧を下部に表示する上下分割レイアウトを実装しました。TodoContext に completedAt フィールドを追加し、タスク完了時に日時を保存するようにしました。

- **使用したライブラリとバージョン**:
    - `react-native-calendars`: `^1.1306.0`
    - `@react-native-async-storage/async-storage`: (既存)
    - `react-native-paper`: `^5.14.5`

- **ハマったポイントと解決策**:
    - **ハマったポイント1**: MarkedDates の型定義が TypeScript で必要だった。`{ [key: string]: { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string; } }` という型を明示的に定義する必要がありました。
    - **ハマったポイント2**: List.Subheader の配置位置。当初リストの最後に配置していたが、表示が不自然だったため、リストの最初（tasksForSelectedDate.map の前）に移動しました。
    - **ハマったポイント3**: description プロパティの記法。`description=\"...\"` ではなく `description={\"...\"}` と {} で囲む必要がありました。

- **次回への引き継ぎ事項**:
    - カレンダーのテーマカラーは theme.colors.primary に統一済み
    - 日付フォーマットは YYYY-MM-DD 形式（toISOString().split('T')[0]）を使用
    - 完了タスクは completedAt フィールドで管理、未完了タスクには completedAt がない
