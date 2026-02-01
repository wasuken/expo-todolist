describe('Cross-Screen Workflows', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should load preset and verify tasks appear in TasksScreen', async () => {
    // 1. プリセット作成
    await element(by.text('プリセット')).tap();
    await element(by.id('preset-fab')).tap();

    await element(by.id('preset-name-input')).typeText('Test Preset');
    await element(by.id('preset-task-input-0')).typeText('Preset Task 1');
    await element(by.id('preset-add-task-button')).tap();
    await element(by.id('preset-task-input-1')).typeText('Preset Task 2');
    await element(by.id('preset-save-button')).tap();

    // 2. プリセット読み込み
    await element(by.id('preset-load-0')).tap();

    // 3. タスク画面に移動して確認
    await element(by.text('タスク')).tap();
    await expect(element(by.text('Preset Task 1'))).toBeVisible();
    await expect(element(by.text('Preset Task 2'))).toBeVisible();
  });

  it('should complete task and verify in HistoryScreen', async () => {
    // 1. タスク追加
    await element(by.text('タスク')).tap();
    await element(by.id('new-todo-input')).typeText('Complete Me');
    await element(by.id('add-todo-button')).tap();

    // 2. タスク完了
    await element(by.id('todo-checkbox-0')).tap();

    // 3. 履歴画面で確認
    await element(by.text('履歴')).tap();

    // 今日の日付を選択 (カレンダーの今日は自動選択されているはず)
    await expect(element(by.text('Complete Me'))).toBeVisible();
  });

  it('should create preset with due date offset and verify task deadline', async () => {
    // 1. オフセット付きプリセット作成
    await element(by.text('プリセット')).tap();
    await element(by.id('preset-fab')).tap();

    await element(by.id('preset-name-input')).typeText('Deadline Preset');
    await element(by.id('preset-task-input-0')).typeText('Due in 3 days');
    await element(by.id('preset-task-offset-0')).clearText();
    await element(by.id('preset-task-offset-0')).typeText('3');
    await element(by.id('preset-save-button')).tap();

    // 2. プリセット読み込み
    await element(by.id('preset-load-0')).tap();

    // 3. タスク画面で期限表示確認
    await element(by.text('タスク')).tap();
    await expect(element(by.text('Due in 3 days'))).toBeVisible();
    // Chipの存在確認 (正確な文言は date-fns の formatDistanceToNowStrict に依存)
    await expect(element(by.text('3日後'))).toBeVisible(); // 日本語ロケールの場合
  });
});
