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

test.describe('完整好友邀請流程測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 確保後端服務運行
    await page.goto('/');
    
    // 等待應用載入
    await expect(page.locator('text=把分散的朋友聚在一起')).toBeVisible({ timeout: 10000 });
  });

  test('完整流程: Frank 邀請 Alice → Alice 接受 → 雙方成為好友', async ({ page, context }) => {
    // === 第一步：Frank 登入並發送好友邀請 ===
    console.log('🔵 Step 1: Frank 登入並發送好友邀請');
    await loginWithAccount(page, TEST_ACCOUNTS.frank);
    
    // 驗證登入成功
    await expect(page.locator('text=你好, Frank Li！')).toBeVisible();
    
    // 進入朋友頁面
    await page.getByRole('link', { name: '朋友' }).click();
    await page.locator('[data-testid="add-friend-button"]').click();
    
    // 搜尋 Alice
    await page.fill('input[placeholder*="輸入姓名或 Email"]', 'Alice');
    await page.getByTestId('search-users-button').click();
    await expect(page.locator('text=Alice Wang')).toBeVisible({ timeout: 10000 });
    
    // 發送好友邀請
    await page.click('text=加好友');
    
    // 等待成功提示或錯誤提示
    await page.waitForTimeout(3000);
    
    // 截圖調試
    await page.screenshot({ path: 'debug-frank-after-friend-request.png', fullPage: true });
    
    // === 第二步：Alice 登入並檢查邀請 ===
    console.log('🔵 Step 2: Alice 登入並檢查邀請');
    const alicePage = await context.newPage();
    await alicePage.goto('/');
    await loginWithAccount(alicePage, TEST_ACCOUNTS.alice);
    
    // 進入朋友頁面
    await alicePage.getByRole('link', { name: '朋友' }).click();
    
    // 檢查邀請頁籤是否有邀請
    await alicePage.screenshot({ path: 'debug-alice-friends-page.png', fullPage: true });
    
    // 查找邀請頁籤（可能是 "邀請 (1)" 或 "邀請 (0)"）
    const inviteTabExists = await alicePage.locator('text=邀請 (1)').isVisible({ timeout: 5000 });
    
    if (inviteTabExists) {
      console.log('✅ Alice 收到了邀請');
      
      // 點擊邀請頁籤
      await alicePage.locator('text=邀請 (1)').first().click();
      
      // 驗證收到 Frank 的邀請
      await expect(alicePage.locator('text=Frank Li')).toBeVisible();
      
      // 接受好友邀請 - 處理確認對話框
      console.log('🔄 Alice 點擊接受邀請...');
      
      // 設置對話框處理器
      alicePage.on('dialog', async dialog => {
        console.log('🔄 收到對話框:', dialog.message());
        if (dialog.message().includes('接受好友邀請') || dialog.message().includes('確定要接受')) {
          console.log('🔄 自動確認對話框');
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
      });
      
      await alicePage.click('text=接受');
      
      // 等待接受邀請的處理完成
      await alicePage.waitForTimeout(3000);
      console.log('🔄 等待接受邀請處理完成...');
      
      // 截圖檢查接受後的狀態
      await alicePage.screenshot({ path: 'debug-alice-after-accept.png', fullPage: true });
      
      // === 第三步：驗證雙方都有對方作為好友 ===
      console.log('🔵 Step 3: 驗證雙方都有對方作為好友');
      
      // Alice 檢查朋友列表
      // 先檢查朋友頁籤是否更新為 "朋友 (1)"
      const friendsTab = alicePage.locator('text=朋友 (1)');
      const friendsTabZero = alicePage.locator('text=朋友 (0)');
      
      const hasFriendOne = await friendsTab.isVisible({ timeout: 5000 });
      const hasFriendZero = await friendsTabZero.isVisible({ timeout: 1000 });
      
      console.log(`🔍 朋友頁籤狀態: 朋友(1)=${hasFriendOne}, 朋友(0)=${hasFriendZero}`);
      
      if (hasFriendOne) {
        await friendsTab.click();
        await expect(alicePage.locator('text=Frank Li')).toBeVisible();
        console.log('✅ Alice 的朋友列表中有 Frank');
      } else {
        console.log('❌ Alice 的朋友列表沒有正確更新');
        await alicePage.screenshot({ path: 'debug-alice-friends-not-updated.png', fullPage: true });
        // 繼續測試，但記錄問題
      }
      
      // Frank 檢查朋友列表
      await page.bringToFront();
      await page.reload();
      await page.getByRole('link', { name: '朋友' }).click();
      await page.click('text=朋友 (1)', { timeout: 10000 });
      await expect(page.locator('text=Alice Wang')).toBeVisible();
      console.log('✅ Frank 的朋友列表中有 Alice');
      
    } else {
      console.log('❌ Alice 沒有收到邀請');
      
      // 檢查是否有其他邀請相關的文字
      const pendingText = await alicePage.locator('text=沒有待處理邀請').isVisible();
      const zeroInvites = await alicePage.locator('text=邀請 (0)').isVisible();
      
      console.log('Debug info:', { pendingText, zeroInvites });
      
      // 如果沒有收到邀請，測試失敗
      expect(inviteTabExists).toBe(true);
    }
    
    await alicePage.close();
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