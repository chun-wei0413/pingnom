import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8082'; // Web frontend URL
const API_BASE_URL = 'http://localhost:8090'; // Backend API URL

// Test data
const FRANK_EMAIL = 'testuser@pingnom.app';
const FRANK_PASSWORD = 'TestPassword2024!';
const ALICE_EMAIL = 'alice@pingnom.app';
const ALICE_PASSWORD = 'AlicePassword2024!';

// Helper function to login
async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

// Helper function to get auth token from localStorage
async function getAuthToken(page) {
  return await page.evaluate(() => localStorage.getItem('authToken'));
}

// Helper function to create notification via API
async function createNotificationViaAPI(receiverToken, senderToken, type, title, message, data = {}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${senderToken}`,
    },
    body: JSON.stringify({
      receiver_id: receiverToken, // In real scenario, this would be user ID
      type,
      title,
      message,
      data,
    }),
  });
  return response.json();
}

test.describe('Notification System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure backend is running
    const healthResponse = await page.request.get(`${API_BASE_URL}/health`);
    expect(healthResponse.ok()).toBeTruthy();
  });

  test('User can view notifications page', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Verify notifications page elements
    await expect(page.locator('[data-testid="notifications-title"]')).toContainText('通知');
    await expect(page.locator('[data-testid="notifications-tab-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="notifications-tab-unread"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
  });

  test('User can send test notification', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Click test notification button
    await page.click('[data-testid="test-notification-button"]');

    // Wait for success alert
    await page.waitForSelector('.alert-success', { timeout: 5000 });
    await expect(page.locator('.alert-success')).toContainText('測試通知已發送');

    // Refresh the page to see the notification
    await page.reload();
    await page.waitForSelector('[data-testid="notification-item"]');

    // Verify test notification appears
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    await expect(notificationItem).toContainText('測試通知');
    await expect(notificationItem).toContainText('這是一個測試通知，確認通知系統正常運作');
  });

  test('User can mark notification as read', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Send test notification first
    await page.click('[data-testid="test-notification-button"]');
    await page.waitForSelector('.alert-success');
    await page.reload();

    // Verify unread count is updated
    const unreadTab = page.locator('[data-testid="notifications-tab-unread"]');
    await expect(unreadTab).toContainText('未讀通知 (1)');

    // Click on the notification to mark as read
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    await notificationItem.click();

    // Wait for mark as read action
    await page.waitForTimeout(1000);

    // Verify unread count is decremented
    await expect(unreadTab).toContainText('未讀通知 (0)');

    // Verify notification is no longer in unread list
    await page.click('[data-testid="notifications-tab-unread"]');
    await expect(page.locator('[data-testid="empty-notifications"]')).toContainText('沒有未讀通知');
  });

  test('User can mark all notifications as read', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Send multiple test notifications
    await page.click('[data-testid="test-notification-button"]');
    await page.waitForSelector('.alert-success');
    await page.waitForTimeout(1000);

    await page.click('[data-testid="test-notification-button"]');
    await page.waitForSelector('.alert-success');
    await page.reload();

    // Verify multiple unread notifications
    const unreadTab = page.locator('[data-testid="notifications-tab-unread"]');
    await expect(unreadTab).toContainText('未讀通知 (2)');

    // Click mark all as read button
    await page.click('[data-testid="mark-all-read-button"]');

    // Confirm in dialog
    await page.click('[data-testid="confirm-mark-all-read"]');

    // Wait for action to complete
    await page.waitForSelector('.alert-success');
    await expect(page.locator('.alert-success')).toContainText('已將所有通知標記為已讀');

    // Verify unread count is 0
    await expect(unreadTab).toContainText('未讀通知 (0)');
  });

  test('WebSocket connection status indicator works', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Check connection status
    const connectionStatus = page.locator('[data-testid="connection-status"]');

    // Should show either connected or disconnected
    await expect(connectionStatus).toContainText(/已連接|未連接/);

    // Check connection dot color
    const connectionDot = page.locator('[data-testid="connection-dot"]');
    const dotColor = await connectionDot.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should be either green (connected) or red (disconnected)
    expect(dotColor === 'rgb(74, 222, 128)' || dotColor === 'rgb(239, 68, 68)').toBeTruthy();
  });

  test('Notification tabs filter correctly', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Send test notification
    await page.click('[data-testid="test-notification-button"]');
    await page.waitForSelector('.alert-success');
    await page.reload();

    // Test "All" tab
    await page.click('[data-testid="notifications-tab-all"]');
    await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(1);

    // Test "Unread" tab
    await page.click('[data-testid="notifications-tab-unread"]');
    await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(1);

    // Mark as read
    await page.locator('[data-testid="notification-item"]').first().click();
    await page.waitForTimeout(1000);

    // Verify unread tab is empty
    await page.click('[data-testid="notifications-tab-unread"]');
    await expect(page.locator('[data-testid="empty-notifications"]')).toBeVisible();

    // Verify all tab still shows the notification
    await page.click('[data-testid="notifications-tab-all"]');
    await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(1);
  });

  test('Notification types display correct icons', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Send test notification (system type)
    await page.click('[data-testid="test-notification-button"]');
    await page.waitForSelector('.alert-success');
    await page.reload();

    // Verify system notification has correct icon
    const notificationIcon = page.locator('[data-testid="notification-icon"]').first();
    await expect(notificationIcon).toContainText('🔔');
  });

  test('Pull to refresh works', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Simulate pull to refresh (in web, this might be a refresh button)
    const refreshButton = page.locator('[data-testid="refresh-notifications"]');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Verify loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
    } else {
      // Fallback to page refresh
      await page.reload();
      await page.waitForSelector('[data-testid="notifications-screen"]');
    }
  });

  test('Error handling works correctly', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Mock network error by intercepting API calls
    await page.route(`${API_BASE_URL}/api/v1/notifications**`, route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Try to refresh notifications
    await page.reload();

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('錯誤');

    // Verify retry button is available
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();

    // Remove the mock and try retry
    await page.unroute(`${API_BASE_URL}/api/v1/notifications**`);
    await retryButton.click();

    // Should recover from error
    await page.waitForSelector('[data-testid="notifications-screen"]');
  });

  test('Unread count displays correctly', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // Initial state - should show 0 unread
    const statusText = page.locator('[data-testid="status-text"]');
    await expect(statusText).toContainText('未讀：0');

    // Send test notification
    await page.click('[data-testid="test-notification-button"]');
    await page.waitForSelector('.alert-success');
    await page.reload();

    // Should show 1 unread
    await expect(statusText).toContainText('未讀：1');

    // Mark as read
    await page.locator('[data-testid="notification-item"]').first().click();
    await page.waitForTimeout(1000);

    // Should show 0 unread
    await expect(statusText).toContainText('未讀：0');
  });
});

test.describe('Cross-User Notification Tests', () => {
  test('Friend request notification flow', async ({ browser }) => {
    // Create two browser contexts for two users
    const frankContext = await browser.newContext();
    const aliceContext = await browser.newContext();

    const frankPage = await frankContext.newPage();
    const alicePage = await aliceContext.newPage();

    try {
      // Login both users
      await login(frankPage, FRANK_EMAIL, FRANK_PASSWORD);
      await login(alicePage, ALICE_EMAIL, ALICE_PASSWORD);

      // Frank sends friend request to Alice
      await frankPage.goto(`${BASE_URL}/friends`);
      await frankPage.fill('[data-testid="search-friends"]', ALICE_EMAIL);
      await frankPage.click('[data-testid="search-button"]');
      await frankPage.waitForSelector('[data-testid="user-search-result"]');
      await frankPage.click('[data-testid="send-friend-request"]');

      // Wait for friend request to be sent
      await frankPage.waitForSelector('.alert-success');

      // Alice should receive notification
      await alicePage.goto(`${BASE_URL}/notifications`);
      await alicePage.reload(); // Refresh to get latest notifications

      // Verify Alice received friend request notification
      const notification = alicePage.locator('[data-testid="notification-item"]').first();
      await expect(notification).toContainText('新的好友邀請');
      await expect(notification).toContainText('Frank Li 想加您為好友');

      // Verify notification icon is correct for friend request
      const notificationIcon = alicePage.locator('[data-testid="notification-icon"]').first();
      await expect(notificationIcon).toContainText('👤');

    } finally {
      await frankContext.close();
      await aliceContext.close();
    }
  });

  test('Ping invitation notification flow', async ({ browser }) => {
    // Create two browser contexts for two users
    const frankContext = await browser.newContext();
    const aliceContext = await browser.newContext();

    const frankPage = await frankContext.newPage();
    const alicePage = await aliceContext.newPage();

    try {
      // Login both users
      await login(frankPage, FRANK_EMAIL, FRANK_PASSWORD);
      await login(alicePage, ALICE_EMAIL, ALICE_PASSWORD);

      // Ensure they are friends first (if not already)
      // This might require additional setup depending on current state

      // Frank creates a Ping invitation
      await frankPage.goto(`${BASE_URL}/dashboard`);
      await frankPage.click('[data-testid="quick-lunch-ping"]');

      // Wait for ping to be created
      await frankPage.waitForSelector('.alert-success', { timeout: 10000 });

      // Alice should receive ping notification
      await alicePage.goto(`${BASE_URL}/notifications`);
      await alicePage.reload(); // Refresh to get latest notifications

      // Verify Alice received ping invitation
      const notification = alicePage.locator('[data-testid="notification-item"]').first();
      await expect(notification).toContainText('新的 Ping 邀請');

      // Verify notification icon is correct for ping
      const notificationIcon = alicePage.locator('[data-testid="notification-icon"]').first();
      await expect(notificationIcon).toContainText('🍽️');

    } finally {
      await frankContext.close();
      await aliceContext.close();
    }
  });
});

test.describe('WebSocket Real-time Tests', () => {
  test('Real-time notification delivery', async ({ browser }) => {
    // This test requires WebSocket support in Playwright
    // For now, we'll simulate with API calls and page refreshes

    const frankContext = await browser.newContext();
    const aliceContext = await browser.newContext();

    const frankPage = await frankContext.newPage();
    const alicePage = await aliceContext.newPage();

    try {
      await login(frankPage, FRANK_EMAIL, FRANK_PASSWORD);
      await login(alicePage, ALICE_EMAIL, ALICE_PASSWORD);

      // Alice opens notifications page
      await alicePage.goto(`${BASE_URL}/notifications`);

      // Frank sends a test notification via API
      const frankToken = await getAuthToken(frankPage);
      await frankPage.goto(`${BASE_URL}/notifications`);
      await frankPage.click('[data-testid="test-notification-button"]');

      // For real WebSocket testing, we would expect the notification
      // to appear in Alice's page without refresh. For now, we simulate:
      await alicePage.reload();

      // Verify notification appears
      const notification = alicePage.locator('[data-testid="notification-item"]').first();
      await expect(notification).toContainText('測試通知');

    } finally {
      await frankContext.close();
      await aliceContext.close();
    }
  });
});

test.describe('Performance Tests', () => {
  test('Notification list loads quickly with many notifications', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');

    // Measure loading time
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="notifications-screen"]');
    const loadTime = Date.now() - startTime;

    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('Pagination works correctly', async ({ page }) => {
    await login(page, FRANK_EMAIL, FRANK_PASSWORD);

    // Navigate to notifications
    await page.click('[data-testid="notifications-tab"]');
    await page.waitForSelector('[data-testid="notifications-screen"]');

    // If there are more than 20 notifications, test pagination
    const loadMoreButton = page.locator('[data-testid="load-more-notifications"]');
    if (await loadMoreButton.isVisible()) {
      const initialCount = await page.locator('[data-testid="notification-item"]').count();

      await loadMoreButton.click();
      await page.waitForTimeout(1000);

      const newCount = await page.locator('[data-testid="notification-item"]').count();
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });
});