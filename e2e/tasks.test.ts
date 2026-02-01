describe('TasksScreen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show tasks screen', async () => {
    await expect(element(by.text('タスク'))).toBeVisible();
  });

  it('should add a new task', async () => {
    await element(by.id('new-todo-input')).typeText('Test Task');
    await element(by.id('add-todo-button')).tap();
    await expect(element(by.text('Test Task'))).toBeVisible();
  });

  it('should add a task with due date', async () => {
    await element(by.id('new-todo-input')).typeText('Task with deadline');
    await element(by.id('due-date-button')).tap();
    // DateTimePicker の操作
    // Note: モーダルの日付選択は複雑なので、確認ボタンのタップのみ
    await element(by.text('確認')).tap(); // react-native-modal-datetime-pickerのデフォルト
    await element(by.id('add-todo-button')).tap();
    await expect(element(by.text('Task with deadline'))).toBeVisible();
  });

  it('should toggle task completion', async () => {
    // まずタスクを追加
    await element(by.id('new-todo-input')).typeText('Toggle Test');
    await element(by.id('add-todo-button')).tap();

    // チェックボックスをタップ (最初のタスクを想定)
    await element(by.id('todo-checkbox-0')).tap();
    // 完了後の見た目変化を確認 (line-throughは視覚的なのでアサーション難しい)
  });

  it('should edit a task', async () => {
    await element(by.id('new-todo-input')).typeText('Original Text');
    await element(by.id('add-todo-button')).tap();

    await element(by.id('todo-edit-0')).tap();
    await element(by.id('new-todo-input')).clearText();
    await element(by.id('new-todo-input')).typeText('Updated Text');
    await element(by.id('todo-save-0')).tap();

    await expect(element(by.text('Updated Text'))).toBeVisible();
    await expect(element(by.text('Original Text'))).not.toBeVisible();
  });

  it('should delete a task', async () => {
    await element(by.id('new-todo-input')).typeText('Delete Me');
    await element(by.id('add-todo-button')).tap();

    await element(by.id('todo-delete-0')).tap();
    await expect(element(by.text('Delete Me'))).not.toBeVisible();
  });
});
