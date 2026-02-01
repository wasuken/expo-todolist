describe('HistoryScreen', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // 履歴画面に移動
    await element(by.text('履歴')).tap();
  });

  it('should show history screen', async () => {
    await expect(element(by.text('履歴'))).toBeVisible();
    await expect(element(by.id('history-calendar'))).toBeVisible();
  });

  it('should show empty state for date with no completed tasks', async () => {
    // カレンダーで適当な日付をタップ (具体的な日付のセレクタは要調整)
    await expect(element(by.id('history-empty-text'))).toBeVisible();
    await expect(element(by.text('この日に完了したタスクはありません。'))).toBeVisible();
  });

  // Note: 完了タスクがある日付の選択テストは、
  // 事前にタスクを作成・完了させる必要があるため、
  // crossScreen.test.ts で実装する
});
