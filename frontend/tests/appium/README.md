# 📱 Pingnom Appium Mobile 測試

## 📋 概述

本目錄包含使用 **Appium + Robot Framework** 實作的 React Native Mobile App 測試，支援 iOS 和 Android 平台的真機和模擬器測試。

## 🏗️ 測試架構

```
tests/appium/
├── features/           # BDD Mobile 測試場景檔案
├── keywords/           # Mobile 專用測試關鍵字
├── capabilities/       # 設備配置檔案
├── results/           # 測試報告 (執行時生成)
└── README.md          # 本檔案
```

## 🔧 環境設定

### 依賴需求

1. **Python 3.8+**
2. **Robot Framework** 和 **AppiumLibrary**：
   ```bash
   pip install robotframework robotframework-appiumlibrary
   ```
3. **Appium Server**：
   ```bash
   npm install -g appium
   appium driver install uiautomator2  # Android
   appium driver install xcuitest      # iOS
   ```
4. **移動開發環境**：
   - **Android**: Android Studio, Android SDK, Android Emulator
   - **iOS**: Xcode, iOS Simulator (僅 macOS)

### 設備設定

#### iOS 設備
- **模擬器**: iOS Simulator (Xcode 內建)
- **真機**: 需要 Apple Developer 帳號和設備 UDID
- **系統需求**: macOS 系統

#### Android 設備
- **模擬器**: Android Emulator (Android Studio)
- **真機**: 開啟開發者選項和 USB 調試
- **系統需求**: Windows/macOS/Linux

## 🚀 執行測試

### 前置準備

1. **啟動 Appium Server**：
   ```bash
   appium
   ```

2. **準備測試設備**：
   - **iOS Simulator**: 開啟 iOS Simulator
   - **Android Emulator**: 啟動 Android Emulator
   - **真機**: 連接並確認設備可被識別

### 執行測試命令

```bash
# 進入測試目錄
cd frontend/tests/appium

# iOS 模擬器測試
robot --outputdir results --variable PLATFORM:iOS features/

# Android 模擬器測試
robot --outputdir results --variable PLATFORM:Android features/

# iOS 真機測試
robot --outputdir results --variable PLATFORM:iOS --variable UDID:your-device-udid features/

# Android 真機測試
robot --outputdir results --variable PLATFORM:Android --variable UDID:your-device-udid features/

# 執行特定標籤測試
robot --outputdir results --include mobile --variable PLATFORM:iOS features/
```

## 📊 測試報告

執行完成後，測試報告會生成在 `results/` 目錄：

- **report.html** - 主要測試報告
- **log.html** - 詳細測試日誌  
- **output.xml** - XML 格式的原始測試數據
- **截圖檔案** - 測試過程中的截圖

## 🎯 BDD Mobile 場景範例

```robot
場景: 用戶能夠在 Mobile App 上成功登入
    [Documentation]    
    ...    身為一個 Pingnom Mobile 用戶
    ...    當我在手機上開啟應用程式並嘗試登入
    ...    我應該能夠成功進入主頁面
    [Tags]    mobile    login    smoke
    
    Given Mobile App 已經啟動
    When 我點擊登入按鈕
    And 我輸入有效的登入資訊
    And 我提交登入表單
    Then 我應該看到主頁面
    And 我應該看到底部導航列
```

## 📱 設備配置

### iOS 配置範例
```robot
*** Variables ***
${PLATFORM_NAME}        iOS
${DEVICE_NAME}          iPhone 14 Pro
${PLATFORM_VERSION}     16.0
${APP_PATH}             /path/to/your/app.ipa
${AUTOMATION_NAME}      XCUITest
```

### Android 配置範例
```robot
*** Variables ***
${PLATFORM_NAME}        Android
${DEVICE_NAME}          Pixel 6
${PLATFORM_VERSION}     13.0
${APP_PACKAGE}          com.pingnom.mobile
${APP_ACTIVITY}         .MainActivity
${AUTOMATION_NAME}      UiAutomator2
```

## 🏷️ 測試標籤

- **mobile** - Mobile 專用測試
- **smoke** - 基本功能驗證
- **ios** - iOS 專用測試
- **android** - Android 專用測試
- **gesture** - 手勢操作測試
- **native** - 原生功能測試

## 🔧 常用 Mobile 關鍵字

```robot
*** Keywords ***
啟動 Mobile App
    [Documentation]    啟動 React Native App
    Open Application    ${APPIUM_SERVER}    ${CAPABILITIES}

點擊元素通過文字
    [Arguments]    ${text}
    [Documentation]    通過文字內容點擊元素
    Click Element    xpath=//*[@text="${text}"]

滑動到元素
    [Arguments]    ${locator}
    [Documentation]    滑動直到元素可見
    Wait Until Element Is Visible    ${locator}
    Scroll To Element    ${locator}

執行手勢操作
    [Arguments]    ${gesture_type}
    [Documentation]    執行特定手勢操作
    # 實現各種手勢操作
```

## 🚨 注意事項

### iOS 測試
1. **開發者憑證**: 真機測試需要有效的開發者憑證
2. **App 簽名**: 確保 App 正確簽名
3. **系統限制**: 僅能在 macOS 系統執行

### Android 測試
1. **USB 調試**: 確保設備開啟 USB 調試
2. **應用權限**: 確保測試應用有足夠權限
3. **設備兼容**: 不同 Android 版本可能有差異

### 通用注意事項
1. **網路連接**: 確保設備可以訪問後端 API
2. **應用狀態**: 每次測試前重置應用狀態
3. **設備性能**: 避免在性能不足的設備上執行複雜測試

## 🔄 與 Web 測試的差異

### Mobile 特有功能
- **原生導航**: Tab bar, Navigation bar
- **手勢操作**: 滑動、捏合、長按
- **設備功能**: 攝像頭、GPS、推播通知
- **螢幕尺寸**: 各種螢幕解析度和方向

### 測試策略
- **性能測試**: App 啟動時間、記憶體使用
- **離線功能**: 網路斷線時的行為
- **背景模式**: App 進入背景後的行為
- **設備整合**: 與系統功能的整合測試

## 📚 延伸學習

- [Appium 官方文檔](http://appium.io/docs/en/about-appium/intro/)
- [Robot Framework AppiumLibrary](https://serhatbolsu.github.io/robotframework-appiumlibrary/)
- [React Native 測試指南](https://reactnative.dev/docs/testing-overview)
- [Mobile Testing 最佳實踐](https://appium.io/docs/en/about-appium/intro/)

**需要協助？** 查看 Appium 和 Robot Framework 官方文檔，或聯繫開發團隊。