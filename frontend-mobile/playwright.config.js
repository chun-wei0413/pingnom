// Playwright 配置檔案
// 適用於 Pingnom 帳單分攤功能的 UI 測試

const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* 測試並行執行 */
  fullyParallel: true,
  /* 在 CI 環境禁用重試 */
  forbidOnly: !!process.env.CI,
  /* CI 環境重試 2 次 */
  retries: process.env.CI ? 2 : 0,
  /* 限制並行工作數量 */
  workers: process.env.CI ? 1 : undefined,
  /* 測試報告設定 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],
  /* 全局測試設定 */
  use: {
    /* 失敗時截圖 */
    screenshot: 'only-on-failure',
    /* 失敗時錄影 */
    video: 'retain-on-failure',
    /* 測試追蹤 */
    trace: 'on-first-retry',
    /* 全局等待時間 */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* 測試專案配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* 行動裝置測試 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 測試伺服器設定 */
  webServer: [
    {
      // 前端服務 (當有 Web 版本時)
      command: 'npm run web',
      port: 8081,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      // 後端服務
      command: 'cd ../backend && go run cmd/api/main_inmemory.go',
      port: 8090,
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    },
  ],

  /* 測試檔案模式 */
  testMatch: [
    '**/tests/**/*.spec.js',
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/__tests__/**/*.test.js',
  ],

  /* 忽略檔案 */
  testIgnore: [
    '**/tests/**/*.jest.js',
    '**/tests/**/*jest*.js',
    '**/node_modules/**',
    '**/coverage/**',
  ],
});

// 環境變數設定
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';
process.env.BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8090';

console.log(`
🎭 Playwright 設定完成
📱 前端測試 URL: ${process.env.FRONTEND_URL}
🔗 後端 API URL: ${process.env.BACKEND_URL}
📋 測試模式: ${process.env.CI ? 'CI' : 'Development'}

注意: 目前專案是 React Native，Playwright 主要用於 Web 版本測試
如需要 React Native 測試，請使用 Jest + React Native Testing Library
`);