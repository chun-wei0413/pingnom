# 🤖 Pingnom Robot Framework 測試

## 📋 概述

本目錄包含使用 **Robot Framework** 實作的 BDD (Behavior Driven Development) 風格 UI 測試，用於測試 Pingnom 應用的朋友系統功能。

## 🏗️ 測試架構

```
tests/robot/
├── features/           # BDD 測試特性檔案
│   ├── friend_system.robot         # 朋友系統基礎功能測試
│   └── friend_request_flow.robot   # 完整好友邀請流程測試
├── keywords/           # 可重用的測試關鍵字
│   └── common_keywords.robot       # 通用測試關鍵字
├── variables/          # 測試變數和配置
│   └── test_config.robot           # 測試配置檔案
├── results/           # 測試結果和報告 (執行時生成)
├── robot.yaml         # Robot Framework 配置檔案
├── run_tests.bat      # Windows 測試執行腳本
├── run_tests.sh       # Linux/macOS 測試執行腳本
└── README.md          # 本檔案
```

## 🔧 環境設定

### 依賴需求

1. **Python 3.8+**
2. **Robot Framework** 和相關庫：
   ```bash
   pip install robotframework robotframework-seleniumlibrary robotframework-requests
   ```
3. **WebDriver** (Selenium 會自動管理)

### 服務需求

測試執行前需要啟動：
1. **後端服務**: `http://localhost:8090`
2. **前端服務**: `http://localhost:19006`

## 🚀 執行測試

### 方式一：使用執行腳本 (推薦)

**Windows:**
```cmd
cd frontend/tests/robot
run_tests.bat
```

**Linux/macOS:**
```bash
cd frontend/tests/robot
./run_tests.sh
```

### 方式二：直接使用 Robot Framework

**執行所有測試:**
```bash
robot --outputdir results features/
```

**執行特定標籤的測試:**
```bash
robot --outputdir results --include smoke features/
robot --outputdir results --include critical features/
robot --outputdir results --include integration features/
```

**執行特定測試檔案:**
```bash
robot --outputdir results features/friend_system.robot
robot --outputdir results features/friend_request_flow.robot
```

## 📊 測試報告

執行完成後，測試報告會生成在 `results/` 目錄：

- **report.html** - 主要測試報告，包含測試結果概覽
- **log.html** - 詳細測試日誌，包含每個步驟的執行細節  
- **output.xml** - XML 格式的原始測試數據
- **截圖檔案** - 測試過程中的截圖，特別是失敗時的截圖

## 🧪 測試案例

### 朋友系統基礎功能 (friend_system.robot)

1. **用戶登入和朋友頁面訪問**
   - 驗證用戶能夠成功登入
   - 驗證能夠訪問朋友頁面
   - 驗證朋友頁面三個頁籤正確顯示

2. **用戶搜尋功能**
   - 驗證能夠搜尋其他用戶
   - 驗證搜尋結果正確顯示
   - 驗證加好友按鈕可用

3. **好友邀請發送**
   - 驗證能夠發送好友邀請
   - 驗證邀請出現在已發送列表

4. **好友邀請處理**
   - 驗證能夠接受好友邀請
   - 驗證能夠拒絕好友邀請
   - 驗證邀請處理後的狀態變更

### 完整好友邀請流程 (friend_request_flow.robot)

1. **完整邀請接受流程**
   - Frank 登入並發送邀請給 Alice
   - Alice 登入並查看邀請
   - Alice 接受邀請
   - 驗證雙方都在對方的朋友列表中

2. **邀請拒絕流程**  
   - Frank 發送邀請給 Alice
   - Alice 拒絕邀請
   - 驗證雙方不是朋友關係
   - 驗證邀請已從待處理列表移除

## 🏷️ 測試標籤

- **smoke** - 冒煙測試，基本功能驗證
- **critical** - 關鍵功能測試
- **integration** - 整合測試，多用戶互動
- **login** - 登入相關測試
- **friends** - 朋友功能測試
- **search** - 搜尋功能測試
- **friend_request** - 好友邀請相關測試
- **error_handling** - 錯誤處理測試

## 🎯 BDD 風格

所有測試案例都使用 BDD (Behavior Driven Development) 風格撰寫：

```robot
場景: 用戶能夠成功登入並訪問朋友頁面
    [Documentation]    
    ...    身為一個 Pingnom 用戶
    ...    當我使用有效的帳號登入
    ...    我應該能夠成功進入應用程式並訪問朋友功能
    [Tags]    smoke    login    friends
    
    Given 我是一個註冊用戶 Frank Li
    When 我使用我的帳號登入
    Then 我應該看到歡迎訊息
    And 我應該能夠訪問朋友頁面
```

## 🔍 調試功能

測試框架提供多種調試輔助：

1. **自動截圖** - 測試失敗時自動截圖
2. **調試截圖** - 關鍵步驟手動截圖
3. **詳細日誌** - 記錄每個操作的詳細信息
4. **瀏覽器可視化** - 測試執行時可以看到瀏覽器操作

## ⚙️ 配置選項

可以通過變數自定義測試執行：

```bash
robot \
    --variable BROWSER:firefox \          # 指定瀏覽器
    --variable HEADLESS:True \             # 無頭模式執行
    --variable APP_URL:http://localhost:3000 \  # 自定義應用 URL
    --outputdir custom_results \          # 自定義輸出目錄
    features/
```

## 🚨 注意事項

1. **測試數據依賴**: 測試使用固定的測試帳號 (Frank Li, Alice Wang)
2. **服務依賴**: 必須先啟動後端和前端服務
3. **瀏覽器兼容性**: 主要在 Chromium 上測試，其他瀏覽器可能需要調整
4. **並發限制**: 某些測試涉及多用戶互動，不適合並發執行
5. **內存資料庫**: 後端使用內存資料庫，重啟後數據會清空

## 🔄 與舊測試的差異

相比於之前的 Playwright 測試：

✅ **優勢:**
- 更清晰的 BDD 語法，非技術人員也能理解
- 更好的測試結構和組織
- 豐富的測試報告和日誌
- 更靈活的關鍵字重用機制
- 更好的錯誤處理和調試功能

🔄 **轉換重點:**
- 所有測試案例都改為場景化描述
- 測試步驟使用中文關鍵字，提高可讀性
- 增強了多瀏覽器會話的處理
- 改善了錯誤處理和重試機制

## 📚 延伸學習

- [Robot Framework 官方文檔](https://robotframework.org/robotframework/)
- [SeleniumLibrary 文檔](https://robotframework.org/SeleniumLibrary/)
- [BDD 最佳實踐](https://cucumber.io/docs/bdd/)
- [Gherkin 語法指南](https://cucumber.io/docs/gherkin/)