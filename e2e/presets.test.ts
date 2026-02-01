describe('PresetsScreen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // プリセット画面に移動
    await element(by.text('プリセット')).tap();
  });

  it('should show presets screen', async () => {
    await expect(element(by.text('プリセット'))).toBeVisible();
  });

  it('should create a new preset', async () => {
    await element(by.id('preset-fab')).tap();

    await element(by.id('preset-name-input')).typeText('Morning Routine');
    await element(by.id('preset-task-input-0')).typeText('Wake up');

    await element(by.id('preset-add-task-button')).tap();
    await element(by.id('preset-task-input-1')).typeText('Breakfast');

    await element(by.id('preset-save-button')).tap();

    await expect(element(by.text('Morning Routine'))).toBeVisible();
    await expect(element(by.text('タスク数: 2'))).toBeVisible();
  });

  it('should edit a preset', async () => {
    // 前提: プリセットが1つ存在する
    await element(by.id('preset-edit-0')).tap();

    await element(by.id('preset-name-input')).clearText();
    await element(by.id('preset-name-input')).typeText('Evening Routine');

    await element(by.id('preset-save-button')).tap();

    await expect(element(by.text('Evening Routine'))).toBeVisible();
  });

  it('should delete a preset', async () => {
    // 前提: プリセットが1つ存在する
    const presetName = 'To Be Deleted';

    await element(by.id('preset-fab')).tap();
    await element(by.id('preset-name-input')).typeText(presetName);
    await element(by.id('preset-task-input-0')).typeText('Task 1');
    await element(by.id('preset-save-button')).tap();

    await element(by.id('preset-delete-0')).tap();
    await expect(element(by.text(presetName))).not.toBeVisible();
  });

  it('should set due date offset for tasks', async () => {
    await element(by.id('preset-fab')).tap();

    await element(by.id('preset-name-input')).typeText('Deadline Test');
    await element(by.id('preset-task-input-0')).typeText('Task with offset');
    await element(by.id('preset-task-offset-0')).clearText();
    await element(by.id('preset-task-offset-0')).typeText('7');

    await element(by.id('preset-save-button')).tap();

    await expect(element(by.text('Deadline Test'))).toBeVisible();
  });
});
