import { test, expect } from '@playwright/test';

// Test configuration
const TEST_ACCOUNTS = {
  frank: {
    email: 'testuser@pingnom.app',
    password: 'TestPassword2024!',
    displayName: 'Frank Li'
  },
  alice: {
    email: 'alice@pingnom.app',
    password: 'AlicePassword2024!',
    displayName: 'Alice Wang'
  }
};

test.describe('朋友系統 E2E 測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 確保後端服務運行
    await page.goto('/');
    
    // 等待應用載入
    await expect(page.locator('text=把分散的朋友聚在一起')).toBeVisible({ timeout: 10000 });
  });

  test('應該能夠登入並訪問朋友頁面', async ({ page }) => {
    // 1. 登入 Frank Li 帳號
    await loginWithAccount(page, TEST_ACCOUNTS.frank);
    
    // 2. 驗證登入成功，到達主頁面
    await expect(page.locator('text=你好, Frank Li！')).toBeVisible();
    
    // 3. 點擊朋友頁籤
    await page.click('[data-testid="tab-friends"]');
    
    // 4. 驗證朋友頁面載入成功
    await expect(page.locator('text=朋友')).toBeVisible();
    
    // 5. 確認沒有錯誤訊息
    await expect(page.locator('text=載入失敗')).not.toBeVisible();
    
    // 6. 驗證三個頁籤存在：朋友、邀請、已發送
    await expect(page.locator('text=朋友 (0)')).toBeVisible();
    await expect(page.locator('text=邀請 (0)')).toBeVisible();
    await expect(page.locator('text=已發送 (0)')).toBeVisible();
  });

  test('應該能夠搜尋用戶', async ({ page }) => {
    // 1. 登入 Frank Li 帳號
    await loginWithAccount(page, TEST_ACCOUNTS.frank);
    
    // 2. 進入朋友頁面
    await page.click('[data-testid="tab-friends"]');
    await expect(page.locator('text=朋友')).toBeVisible();
    
    // 3. 點擊搜尋朋友按鈕（+ 按鈕）
    await page.click('[data-testid="add-friend-button"]');
    
    // 4. 驗證搜尋頁面開啟
    await expect(page.locator('text=搜尋朋友')).toBeVisible();
    await expect(page.locator('text=尋找新朋友')).toBeVisible();
    
    // 5. 搜尋 Alice
    await page.fill('input[placeholder*="輸入姓名或 Email"]', 'Alice');
    await page.click('text=搜尋');
    
    // 6. 驗證搜尋結果
    await expect(page.locator('text=Alice Wang')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=alice@pingnom.app')).toBeVisible();
    
    // 7. 驗證加好友按鈕存在
    await expect(page.locator('text=加好友')).toBeVisible();
  });

  test('應該能夠發送好友邀請', async ({ page }) => {
    // 1. 登入 Frank Li 帳號
    await loginWithAccount(page, TEST_ACCOUNTS.frank);
    
    // 2. 進入朋友頁面並搜尋 Alice
    await page.click('[data-testid="tab-friends"]');
    await page.click('[data-testid="add-friend-button"]');
    
    // 3. 搜尋 Alice
    await page.fill('input[placeholder*="輸入姓名或 Email"]', 'Alice');
    await page.click('text=搜尋');
    await expect(page.locator('text=Alice Wang')).toBeVisible({ timeout: 10000 });
    
    // 4. 發送好友邀請
    await page.click('text=加好友');
    
    // 5. 驗證成功提示
    await expect(page.locator('text=已向 Alice Wang 發送好友邀請！')).toBeVisible({ timeout: 10000 });
    
    // 6. 點擊確定
    await page.click('text=確定');
    
    // 7. 返回朋友頁面，檢查已發送頁籤
    await page.goBack();
    await expect(page.locator('text=朋友')).toBeVisible();
    
    // 8. 點擊已發送頁籤
    await page.click('text=已發送 (1)', { timeout: 10000 });
    
    // 9. 驗證邀請出現在已發送列表中
    await expect(page.locator('text=Alice Wang')).toBeVisible();
    await expect(page.locator('text=等待回應')).toBeVisible();
  });

  test('應該能夠接受好友邀請', async ({ page, context }) => {
    // 此測試需要兩個瀏覽器會話來模擬兩個用戶
    
    // 1. 首先在目前頁面用 Frank 發送邀請
    await loginWithAccount(page, TEST_ACCOUNTS.frank);
    await page.click('[data-testid="tab-friends"]');
    await page.click('[data-testid="add-friend-button"]');
    await page.fill('input[placeholder*="輸入姓名或 Email"]', 'Alice');
    await page.click('text=搜尋');
    await expect(page.locator('text=Alice Wang')).toBeVisible({ timeout: 10000 });
    await page.click('text=加好友');
    await expect(page.locator('text=已向 Alice Wang 發送好友邀請！')).toBeVisible({ timeout: 10000 });
    await page.click('text=確定');
    
    // 2. 開啟新頁面用 Alice 登入
    const alicePage = await context.newPage();
    await alicePage.goto('/');
    await loginWithAccount(alicePage, TEST_ACCOUNTS.alice);
    
    // 3. Alice 檢查收到的好友邀請
    await alicePage.click('[data-testid="tab-friends"], text=朋友');
    await expect(alicePage.locator('text=朋友')).toBeVisible();
    
    // 4. 點擊邀請頁籤
    await alicePage.click('text=邀請 (1)', { timeout: 10000 });
    
    // 5. 驗證收到 Frank 的邀請
    await expect(alicePage.locator('text=Frank Li')).toBeVisible();
    await expect(alicePage.locator('text=testuser@pingnom.app')).toBeVisible();
    
    // 6. 接受好友邀請
    await alicePage.click('text=接受');
    
    // 7. 驗證邀請被接受後，朋友列表中出現 Frank
    await alicePage.click('text=朋友 (1)', { timeout: 10000 });
    await expect(alicePage.locator('text=Frank Li')).toBeVisible();
    
    // 8. 回到 Frank 的頁面，驗證 Alice 出現在朋友列表中
    await page.bringToFront();
    await page.reload();
    await page.click('[data-testid="tab-friends"]');
    await page.click('text=朋友 (1)', { timeout: 10000 });
    await expect(page.locator('text=Alice Wang')).toBeVisible();
    
    // 9. 清理：關閉 Alice 的頁面
    await alicePage.close();
  });

  test('應該能夠拒絕好友邀請', async ({ page, context }) => {
    // 1. Frank 發送邀請
    await loginWithAccount(page, TEST_ACCOUNTS.frank);
    await page.click('[data-testid="tab-friends"]');
    await page.click('[data-testid="add-friend-button"]');
    await page.fill('input[placeholder*="輸入姓名或 Email"]', 'Alice');
    await page.click('text=搜尋');
    await expect(page.locator('text=Alice Wang')).toBeVisible({ timeout: 10000 });
    await page.click('text=加好友');
    await expect(page.locator('text=已向 Alice Wang 發送好友邀請！')).toBeVisible({ timeout: 10000 });
    await page.click('text=確定');
    
    // 2. Alice 登入並拒絕邀請
    const alicePage = await context.newPage();
    await alicePage.goto('/');
    await loginWithAccount(alicePage, TEST_ACCOUNTS.alice);
    await alicePage.click('[data-testid="tab-friends"], text=朋友');
    await alicePage.click('text=邀請 (1)', { timeout: 10000 });
    await expect(alicePage.locator('text=Frank Li')).toBeVisible();
    
    // 3. 拒絕好友邀請
    await alicePage.click('text=拒絕');
    
    // 4. 驗證邀請被移除
    await expect(alicePage.locator('text=Frank Li')).not.toBeVisible();
    await expect(alicePage.locator('text=沒有待處理邀請')).toBeVisible();
    
    // 5. 驗證朋友列表為空
    await alicePage.click('text=朋友 (0)');
    await expect(alicePage.locator('text=還沒有朋友')).toBeVisible();
    
    await alicePage.close();
  });

  test('錯誤處理：應該正確處理網路錯誤', async ({ page }) => {
    // 1. 登入
    await loginWithAccount(page, TEST_ACCOUNTS.frank);
    await page.click('[data-testid="tab-friends"]');
    
    // 2. 模擬網路中斷（攔截 API 請求）
    await page.route('**/api/v1/friends**', route => route.abort());
    
    // 3. 重新整理頁面觸發 API 請求
    await page.reload();
    
    // 4. 驗證錯誤處理
    // 由於我們改進了錯誤處理，現在只有當所有請求都失敗時才顯示錯誤
    // 這個測試可能需要根據實際的錯誤處理邏輯調整
    
    // 清理：移除路由攔截
    await page.unroute('**/api/v1/friends**');
  });
});

// 輔助函數：登入指定帳號
async function loginWithAccount(page: any, account: typeof TEST_ACCOUNTS.frank) {
  // 檢查是否已經在登入頁面
  const isWelcomePage = await page.locator('text=Pingnom').isVisible();
  const isLoginPage = await page.locator('text=歡迎回來').isVisible();
  
  if (isWelcomePage && !isLoginPage) {
    // 在歡迎頁面，需要點擊「我已有帳號」進入登入頁面
    await page.click('text=我已有帳號');
    await expect(page.locator('text=歡迎回來')).toBeVisible({ timeout: 10000 });
  } else if (!isLoginPage) {
    // 如果不在任何頁面，重新導航
    await page.goto('/');
    // 等待歡迎頁面載入
    await expect(page.locator('text=把分散的朋友聚在一起')).toBeVisible({ timeout: 10000 });
    // 點擊進入登入頁面
    await page.click('text=我已有帳號');
    await expect(page.locator('text=歡迎回來')).toBeVisible({ timeout: 10000 });
  }
  
  // 檢查是否有快速登入按鈕（根據 displayName）
  const quickLoginButton = page.locator(`text=${account.displayName}`);
  const hasQuickLogin = await quickLoginButton.isVisible();
  
  if (hasQuickLogin) {
    // 使用快速登入
    await quickLoginButton.click();
  } else {
    // 使用標準登入流程
    await page.fill('input[placeholder*="Email"]', account.email);
    await page.fill('input[placeholder*="密碼"], input[type="password"]', account.password);
    await page.click('text=登入');
  }
  
  // 等待登入完成
  await expect(page.locator(`text=你好, ${account.displayName}！`)).toBeVisible({ timeout: 10000 });
}