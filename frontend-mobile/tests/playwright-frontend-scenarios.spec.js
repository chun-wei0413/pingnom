// Pingnom 前端功能場景測試
// 使用 Playwright 模擬用戶操作進行前端驗收測試

const { test, expect } = require('@playwright/test');

// 測試配置
const FRONTEND_URL = 'http://localhost:8082';
const BACKEND_URL = 'http://localhost:8090';

// 測試帳號
const FRANK_ACCOUNT = {
  email: 'testuser@pingnom.app',
  password: 'TestPassword2024!',
  displayName: 'Frank Li'
};

const ALICE_ACCOUNT = {
  email: 'alice@pingnom.app', 
  password: 'AlicePassword2024!',
  displayName: 'Alice Wang'
};

test.describe('Pingnom 前端功能場景驗收', () => {

  test.beforeEach(async ({ page }) => {
    // 檢查後端服務是否運行
    const healthCheck = await fetch(`${BACKEND_URL}/health`);
    expect(healthCheck.status).toBe(200);
    
    // 導航到前端應用
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
  });

  test('場景 1: 用戶認證系統完整流程', async ({ page }) => {
    test.setTimeout(60000);

    // 1.1 檢查登入頁面載入
    await expect(page).toHaveTitle(/Pingnom|Expo/);
    
    // 1.2 測試 Frank Li 快速登入
    const frankLoginButton = page.locator('text=Frank Li');
    if (await frankLoginButton.isVisible()) {
      await frankLoginButton.click();
    } else {
      // 手動輸入登入資訊
      await page.fill('[placeholder*="email"]', FRANK_ACCOUNT.email);
      await page.fill('[placeholder*="password"]', FRANK_ACCOUNT.password);
      await page.click('button[type="submit"]');
    }

    // 1.3 驗證登入成功，進入主頁面
    await expect(page.locator('text=首頁')).toBeVisible({ timeout: 10000 });
    
    // 1.4 導航到個人資料頁面
    await page.click('text=個人');
    await expect(page.locator('text=Frank Li')).toBeVisible();
    
    // 1.5 測試個人資料顯示正確性
    await expect(page.locator('text=testuser@pingnom.app')).toBeVisible();
  });

  test('場景 2: 聚餐功能導航修復驗證', async ({ page }) => {
    test.setTimeout(60000);
    
    // 2.1 登入 Frank Li
    await loginAsFrank(page);
    
    // 2.2 導航到聚餐頁面
    await page.click('text=聚餐');
    await expect(page.locator('text=聚餐計畫')).toBeVisible();
    
    // 2.3 點擊「建立聚餐計畫」按鈕 (測試導航修復的核心功能)
    const createButton = page.locator('text=建立');
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // 2.4 驗證成功導航到建立聚餐計畫頁面
    await expect(page.locator('text=建立聚餐計畫')).toBeVisible({ timeout: 5000 });
    
    // 2.5 填寫聚餐計畫資訊
    await page.fill('[placeholder*="標題"]', '前端測試聚餐');
    await page.fill('[placeholder*="描述"]', '驗收前端聚餐功能');
    
    // 2.6 提交聚餐計畫
    await page.click('button[type="submit"]');
    
    // 2.7 驗證聚餐計畫創建成功
    await expect(page.locator('text=成功')).toBeVisible({ timeout: 10000 });
  });

  test('場景 3: 好友系統完整流程驗證', async ({ page, context }) => {
    test.setTimeout(90000);
    
    // 3.1 Frank 登入並搜尋 Alice
    await loginAsFrank(page);
    await page.click('text=朋友');
    
    // 3.2 搜尋 Alice Wang
    const searchInput = page.locator('[placeholder*="搜尋"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Alice');
      await page.keyboard.press('Enter');
      
      // 3.3 發送好友邀請
      const inviteButton = page.locator('text=邀請');
      if (await inviteButton.isVisible()) {
        await inviteButton.click();
        await expect(page.locator('text=邀請已發送')).toBeVisible();
      }
    }
    
    // 3.4 切換到 Alice 帳號測試
    const alicePage = await context.newPage();
    await alicePage.goto(FRONTEND_URL);
    await loginAsAlice(alicePage);
    
    // 3.5 Alice 查看並接受好友邀請
    await alicePage.click('text=朋友');
    const pendingTab = alicePage.locator('text=待處理');
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      
      const acceptButton = alicePage.locator('text=接受');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await expect(alicePage.locator('text=已接受')).toBeVisible();
      }
    }
    
    // 3.6 驗證好友關係建立
    await alicePage.click('text=好友');
    await expect(alicePage.locator('text=Frank Li')).toBeVisible();
  });

  test('場景 4: 聚餐計畫詳情與管理功能', async ({ page }) => {
    test.setTimeout(60000);
    
    // 4.1 登入並創建聚餐計畫
    await loginAsFrank(page);
    await createGroupDiningPlan(page, '詳情測試聚餐');
    
    // 4.2 進入聚餐計畫詳情頁面
    const planCard = page.locator('text=詳情測試聚餐').first();
    await planCard.click();
    
    // 4.3 驗證聚餐計畫詳情顯示
    await expect(page.locator('text=詳情測試聚餐')).toBeVisible();
    await expect(page.locator('text=規劃中')).toBeVisible();
    
    // 4.4 測試新增功能按鈕
    const addTimeButton = page.locator('text=新增時間');
    const addRestaurantButton = page.locator('text=新增餐廳');
    
    if (await addTimeButton.isVisible()) {
      await addTimeButton.click();
      // 目前顯示 Alert，驗證功能提示
      await expect(page.locator('text=功能開發中')).toBeVisible();
    }
  });

  test('場景 5: 前端錯誤處理與載入狀態', async ({ page }) => {
    test.setTimeout(30000);
    
    // 5.1 測試未登入狀態訪問受保護頁面
    await page.goto(`${FRONTEND_URL}/group-dining`);
    // 應該重定向到登入頁面或顯示錯誤
    
    // 5.2 測試無效登入
    await page.fill('[placeholder*="email"]', 'invalid@email.com');
    await page.fill('[placeholder*="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 5.3 驗證錯誤訊息顯示
    await expect(page.locator('text=登入失敗')).toBeVisible({ timeout: 5000 });
  });

});

// 輔助函數
async function loginAsFrank(page) {
  const frankButton = page.locator('text=Frank Li');
  if (await frankButton.isVisible()) {
    await frankButton.click();
  } else {
    await page.fill('[placeholder*="email"]', FRANK_ACCOUNT.email);
    await page.fill('[placeholder*="password"]', FRANK_ACCOUNT.password);
    await page.click('button[type="submit"]');
  }
  await expect(page.locator('text=首頁')).toBeVisible({ timeout: 10000 });
}

async function loginAsAlice(page) {
  const aliceButton = page.locator('text=Alice Wang');
  if (await aliceButton.isVisible()) {
    await aliceButton.click();
  } else {
    await page.fill('[placeholder*="email"]', ALICE_ACCOUNT.email);
    await page.fill('[placeholder*="password"]', ALICE_ACCOUNT.password);
    await page.click('button[type="submit"]');
  }
  await expect(page.locator('text=首頁')).toBeVisible({ timeout: 10000 });
}

async function createGroupDiningPlan(page, title) {
  await page.click('text=聚餐');
  await page.click('text=建立');
  await expect(page.locator('text=建立聚餐計畫')).toBeVisible();
  await page.fill('[placeholder*="標題"]', title);
  await page.fill('[placeholder*="描述"]', '測試聚餐描述');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=成功')).toBeVisible({ timeout: 10000 });
  
  // 返回聚餐列表
  await page.click('button:has-text("確定")');
  await page.goBack();
}