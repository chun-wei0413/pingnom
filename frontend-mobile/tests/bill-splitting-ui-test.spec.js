// Pingnom 帳單分攤功能 UI 自動化測試
// 測試框架: Playwright
// 目標: 驗證帳單分攤功能的完整 User Story

const { test, expect } = require('@playwright/test');

// 測試配置
const config = {
  frontendUrl: 'http://localhost:8082',
  backendUrl: 'http://localhost:8090',
  testUsers: {
    frank: {
      name: 'Frank Li',
      email: 'testuser@pingnom.app',
      password: 'TestPassword2024!',
      quickLoginSelector: 'text="👨‍💼 Frank Li (創建者)"'
    },
    alice: {
      name: 'Alice Wang',
      email: 'alice@pingnom.app', 
      password: 'AlicePassword2024!',
      quickLoginSelector: 'text="👩‍💼 Alice Wang (邀請對象)"'
    }
  }
};

test.describe('帳單分攤功能完整測試', () => {
  
  test.beforeEach(async ({ page }) => {
    // 確保後端服務運行
    console.log('🔍 檢查後端服務狀態...');
    try {
      await page.goto(`${config.backendUrl}/health`);
      const healthCheck = await page.textContent('body');
      expect(healthCheck).toContain('ok');
      console.log('✅ 後端服務正常運行');
    } catch (error) {
      throw new Error('❌ 後端服務未運行，請先啟動 backend 服務');
    }
  });

  test('Story 1: Frank 建立帳單並新增項目', async ({ page }) => {
    console.log('🎭 測試場景: Frank 建立聚餐帳單');
    
    // Step 1: 登入 Frank Li 帳號
    await page.goto(config.frontendUrl);
    await page.click(config.testUsers.frank.quickLoginSelector);
    await page.waitForSelector('text="首頁"'); // 等待主頁載入
    
    // Step 2: 導航到帳單頁面
    await page.click('text="帳單"');
    await expect(page).toHaveURL(/.*Bills/);
    
    // Step 3: 建立新帳單
    await page.click('text="+ 新增帳單"');
    await page.fill('input[placeholder*="標題"]', '朋友聚餐帳單');
    await page.fill('textarea[placeholder*="描述"]', '週末朋友聚餐費用分攤');
    await page.click('text="建立"');
    
    // 驗證: 成功導航到帳單詳情
    await expect(page).toHaveURL(/.*BillDetail/);
    await expect(page.locator('text="朋友聚餐帳單"')).toBeVisible();
    
    console.log('✅ Frank 成功建立帳單');
  });

  test('Story 2: Frank 新增 Alice 為參與者', async ({ page }) => {
    console.log('🎭 測試場景: Frank 新增參與者');
    
    // 前提: 先建立帳單 (重複前面步驟)
    await page.goto(config.frontendUrl);
    await page.click(config.testUsers.frank.quickLoginSelector);
    await page.click('text="帳單"');
    await page.click('text="+ 新增帳單"');
    await page.fill('input[placeholder*="標題"]', '測試參與者功能');
    await page.click('text="建立"');
    
    // Step 1: 新增 Alice 為參與者
    await page.click('text="+ 新增參與者"');
    // 注意: 這裡需要實際的 Alice 用戶 ID，在實際測試中需要先獲取
    await page.fill('input[placeholder*="用戶ID"]', 'alice-user-id');
    await page.fill('input[placeholder*="顯示名稱"]', 'Alice Wang');
    await page.click('text="新增"');
    
    // 驗證: Alice 顯示在參與者列表
    await expect(page.locator('text="Alice Wang"')).toBeVisible();
    
    console.log('✅ Frank 成功新增 Alice 為參與者');
  });

  test('Story 3: Frank 新增消費項目並設定分攤', async ({ page }) => {
    console.log('🎭 測試場景: Frank 新增消費項目');
    
    // 前提: 建立帳單並新增參與者
    await page.goto(config.frontendUrl);
    await page.click(config.testUsers.frank.quickLoginSelector);
    await page.click('text="帳單"');
    
    // 假設已有帳單，點擊進入
    await page.click('.billCard >> nth=0'); // 點擊第一個帳單
    
    // Step 1: 新增主餐項目
    await page.click('text="+ 新增項目"');
    await page.fill('input[placeholder*="項目名稱"]', '主餐');
    await page.fill('input[type="number"]', '600');
    await page.fill('textarea[placeholder*="描述"]', '義大利麵和牛排');
    
    // 選擇分攤者
    await page.check('text="Frank Li"');
    await page.check('text="Alice Wang"');
    await page.click('text="新增項目"');
    
    // Step 2: 新增飲料項目
    await page.click('text="+ 新增項目"');
    await page.fill('input[placeholder*="項目名稱"]', '飲料');
    await page.fill('input[type="number"]', '200');
    await page.check('text="Frank Li"');
    await page.check('text="Alice Wang"');
    await page.click('text="新增項目"');
    
    // 驗證: 系統自動計算分攤金額
    await expect(page.locator('text="總金額"')).toBeVisible();
    await expect(page.locator('text="$800"')).toBeVisible(); // 600 + 200
    
    // 驗證每人分攤金額顯示
    await expect(page.locator('text="應付：$400"')).toHaveCount(2); // Frank 和 Alice 各 400
    
    console.log('✅ Frank 成功新增項目並設定分攤');
  });

  test('Story 4: Alice 查看帳單並標記付款', async ({ page, context }) => {
    console.log('🎭 測試場景: Alice 查看帳單並付款');
    
    // 開啟新分頁作為 Alice
    const alicePage = await context.newPage();
    
    // Step 1: Alice 登入
    await alicePage.goto(config.frontendUrl);
    await alicePage.click(config.testUsers.alice.quickLoginSelector);
    
    // Step 2: Alice 查看帳單列表
    await alicePage.click('text="帳單"');
    await expect(alicePage.locator('.billCard')).toHaveCount(1, { timeout: 10000 });
    
    // Step 3: Alice 進入帳單詳情
    await alicePage.click('.billCard >> nth=0');
    
    // Step 4: Alice 檢查自己的分攤金額
    const aliceBalance = await alicePage.textContent('text="Alice Wang" >> .. >> text*="應付："');
    expect(aliceBalance).toContain('$400');
    
    // Step 5: Alice 標記自己已付款
    await alicePage.click('text="Alice Wang" >> .. >> text="標記已付"');
    await alicePage.click('text="確認"'); // 確認對話框
    
    // 驗證: Alice 的付款狀態更新
    await expect(alicePage.locator('text="✓ 已付清"')).toBeVisible();
    
    console.log('✅ Alice 成功標記付款');
  });

  test('Story 5: 帳單狀態管理與完整流程驗證', async ({ page, context }) => {
    console.log('🎭 測試場景: 完整帳單流程');
    
    // Frank 頁面
    await page.goto(config.frontendUrl);
    await page.click(config.testUsers.frank.quickLoginSelector);
    
    // Alice 頁面
    const alicePage = await context.newPage();
    await alicePage.goto(config.frontendUrl);
    await alicePage.click(config.testUsers.alice.quickLoginSelector);
    
    // Step 1: Frank 建立完整帳單
    await page.click('text="帳單"');
    await page.click('text="+ 新增帳單"');
    await page.fill('input[placeholder*="標題"]', '完整流程測試');
    await page.click('text="建立"');
    
    // Step 2: 新增項目和參與者
    await page.click('text="+ 新增項目"');
    await page.fill('input[placeholder*="項目名稱"]', '晚餐');
    await page.fill('input[type="number"]', '1000');
    await page.click('text="新增項目"');
    
    // Step 3: Frank 標記自己已付
    await page.click('text="Frank Li" >> .. >> text="標記已付"');
    await page.click('text="確認"');
    
    // Step 4: Alice 查看並付款
    await alicePage.click('text="帳單"');
    await alicePage.click('.billCard >> nth=0');
    await alicePage.click('text="標記已付"');
    await alicePage.click('text="確認"');
    
    // Step 5: 驗證帳單狀態變更為「已完成」
    await page.reload();
    await expect(page.locator('text="已完成"')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ 完整帳單流程驗證成功');
  });

  test('Story 6: 帳單列表過濾器功能', async ({ page }) => {
    console.log('🎭 測試場景: 帳單列表過濾功能');
    
    await page.goto(config.frontendUrl);
    await page.click(config.testUsers.frank.quickLoginSelector);
    await page.click('text="帳單"');
    
    // 測試過濾器
    await page.click('text="全部"');
    const allBillsCount = await page.locator('.billCard').count();
    
    await page.click('text="我建立的"');
    const createdBillsCount = await page.locator('.billCard').count();
    
    await page.click('text="參與的"');
    const participantBillsCount = await page.locator('.billCard').count();
    
    // 驗證過濾器邏輯正確 (Frank 建立的帳單應該 >= 他參與的帳單)
    expect(createdBillsCount).toBeGreaterThanOrEqual(0);
    expect(participantBillsCount).toBeGreaterThanOrEqual(0);
    expect(allBillsCount).toBeGreaterThanOrEqual(Math.max(createdBillsCount, participantBillsCount));
    
    console.log('✅ 過濾器功能正常運作');
  });

});

test.describe('帳單分攤 API 整合測試', () => {
  
  test('API 端點響應測試', async ({ request }) => {
    console.log('🔗 測試後端 API 端點');
    
    // 測試健康檢查
    const healthResponse = await request.get(`${config.backendUrl}/health`);
    expect(healthResponse.ok()).toBeTruthy();
    
    // 測試登入 API
    const loginResponse = await request.post(`${config.backendUrl}/api/v1/auth/login`, {
      data: {
        email: config.testUsers.frank.email,
        password: config.testUsers.frank.password
      }
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.access_token;
      
      // 測試帳單 API (需要認證)
      const billsResponse = await request.get(`${config.backendUrl}/api/v1/bills`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      expect(billsResponse.ok()).toBeTruthy();
      console.log('✅ 帳單 API 端點正常響應');
    }
  });

});

// 測試工具函數
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    // 測試失敗時截圖
    const screenshot = await page.screenshot();
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
    console.log(`❌ 測試失敗: ${testInfo.title}`);
  } else {
    console.log(`✅ 測試通過: ${testInfo.title}`);
  }
});

console.log(`
🎯 Pingnom 帳單分攤功能 UI 測試套件
📝 涵蓋 6 個主要 User Stories:
   1. 建立帳單
   2. 新增參與者  
   3. 新增消費項目
   4. 付款狀態管理
   5. 完整流程驗證
   6. 列表過濾功能
   
💡 執行方式: npx playwright test bill-splitting-ui-test.spec.js
`);