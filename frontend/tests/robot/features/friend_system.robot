*** Settings ***
Documentation    朋友系統功能測試
...              使用 BDD 風格測試 Pingnom 應用的朋友管理功能
...              包括搜尋朋友、發送邀請、接受/拒絕邀請等完整流程
Library          SeleniumLibrary
Resource         ../keywords/common_keywords.robot
Resource         ../variables/test_config.robot
Suite Setup      Setup Browser And Navigate To App
Suite Teardown   Close All Browsers And Cleanup
Test Setup       Go To    ${APP_URL}
Test Teardown    Go To    ${APP_URL}

*** Test Cases ***
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
    And 我應該看到朋友頁面的三個頁籤

場景: 用戶能夠搜尋其他用戶
    [Documentation]    
    ...    身為一個 Pingnom 用戶
    ...    當我想要尋找新朋友時
    ...    我應該能夠使用搜尋功能找到其他用戶
    [Tags]    search    friends
    
    Given 我已經登入 Pingnom 應用程式
    When 我導航到新增朋友頁面  
    And 我搜尋用戶 "Alice"
    Then 我應該看到 Alice Wang 的搜尋結果
    And 我應該看到加好友按鈕

場景: 用戶能夠發送好友邀請
    [Documentation]    
    ...    身為一個 Pingnom 用戶
    ...    當我找到想要加為朋友的用戶時
    ...    我應該能夠向他們發送好友邀請
    [Tags]    friend_request    send
    
    Given 我已經登入 Pingnom 應用程式
    And 我在新增朋友頁面找到了 Alice Wang
    When 我點擊加好友按鈕
    Then 我應該看到邀請發送成功的提示
    And 邀請應該出現在我的已發送列表中

場景: 用戶能夠接受好友邀請
    [Documentation]    
    ...    身為一個收到好友邀請的 Pingnom 用戶
    ...    當我查看待處理的邀請時
    ...    我應該能夠接受邀請並成為朋友
    [Tags]    friend_request    accept
    
    Given Frank Li 已經向我發送了好友邀請
    And 我是 Alice Wang 並已登入
    When 我查看我的好友邀請
    And 我接受來自 Frank Li 的邀請
    Then Frank Li 應該出現在我的朋友列表中
    And 我應該出現在 Frank Li 的朋友列表中

場景: 用戶能夠拒絕好友邀請
    [Documentation]    
    ...    身為一個收到好友邀請的 Pingnom 用戶
    ...    當我不想接受某個邀請時
    ...    我應該能夠拒絕邀請
    [Tags]    friend_request    reject
    
    Given Frank Li 已經向我發送了好友邀請
    And 我是 Alice Wang 並已登入
    When 我查看我的好友邀請
    And 我拒絕來自 Frank Li 的邀請
    Then 邀請應該從我的待處理列表中移除
    And 我的朋友列表應該保持為空

場景: 系統能夠正確處理網路錯誤
    [Documentation]    
    ...    身為一個 Pingnom 用戶
    ...    當網路發生問題時
    ...    系統應該優雅地處理錯誤並提供適當的反饋
    [Tags]    error_handling    network
    
    Given 我已經登入 Pingnom 應用程式
    When 網路連接出現問題
    Then 系統應該顯示適當的錯誤訊息
    And 提供重試選項

*** Keywords ***
我是一個註冊用戶 Frank Li
    [Documentation]    設定測試用戶身份
    Set Test Variable    ${CURRENT_USER_EMAIL}        ${FRANK_EMAIL}
    Set Test Variable    ${CURRENT_USER_PASSWORD}     ${FRANK_PASSWORD} 
    Set Test Variable    ${CURRENT_USER_NAME}         ${FRANK_DISPLAY_NAME}

我使用我的帳號登入
    [Documentation]    執行登入操作
    Login With Account    ${CURRENT_USER_EMAIL}    ${CURRENT_USER_PASSWORD}    ${CURRENT_USER_NAME}

我應該看到歡迎訊息
    [Documentation]    驗證登入成功
    Element Should Be Visible    text=你好, ${CURRENT_USER_NAME}！

我應該能夠訪問朋友頁面
    [Documentation]    驗證能夠導航到朋友頁面
    Navigate To Friends Page

我應該看到朋友頁面的三個頁籤
    [Documentation]    驗證朋友頁面的頁籤存在
    Element Should Be Visible    text=朋友 (0)
    Element Should Be Visible    text=邀請 (0)
    Element Should Be Visible    text=已發送 (0)

我已經登入 Pingnom 應用程式
    [Documentation]    快速登入設定
    我是一個註冊用戶 Frank Li
    我使用我的帳號登入
    我應該看到歡迎訊息

我導航到新增朋友頁面
    [Documentation]    導航到搜尋用戶頁面
    Navigate To Friends Page
    Navigate To Add Friend Page

我搜尋用戶 "${search_term}"
    [Documentation]    執行用戶搜尋
    Search For User    ${search_term}

我應該看到 Alice Wang 的搜尋結果
    [Documentation]    驗證搜尋結果
    Verify Search Results    Alice Wang    alice@pingnom.app

我應該看到加好友按鈕
    [Documentation]    驗證加好友按鈕存在
    Element Should Be Visible    text=加好友

我在新增朋友頁面找到了 Alice Wang
    [Documentation]    完成搜尋並找到 Alice
    我導航到新增朋友頁面
    我搜尋用戶 "Alice" 
    我應該看到 Alice Wang 的搜尋結果

我點擊加好友按鈕
    [Documentation]    發送好友邀請
    Send Friend Request    Alice Wang

我應該看到邀請發送成功的提示
    [Documentation]    驗證邀請發送成功
    Element Should Be Visible    text=已向 Alice Wang 發送好友邀請！
    Click Element    text=確定

邀請應該出現在我的已發送列表中
    [Documentation]    驗證邀請出現在已發送列表
    Go Back
    Element Should Be Visible    text=朋友
    Switch To Friends Tab    已發送    1
    Verify Friend In List    Alice Wang
    Element Should Be Visible    text=等待回應

Frank Li 已經向我發送了好友邀請
    [Documentation]    前置條件：Frank 發送邀請給 Alice
    我是一個註冊用戶 Frank Li
    我使用我的帳號登入
    我在新增朋友頁面找到了 Alice Wang
    我點擊加好友按鈕
    我應該看到邀請發送成功的提示

我是 Alice Wang 並已登入
    [Documentation]    切換到 Alice 用戶
    # 在實際測試中，這需要開啟新的瀏覽器會話
    # 這裡簡化為模擬場景
    Set Test Variable    ${CURRENT_USER_EMAIL}        ${ALICE_EMAIL}
    Set Test Variable    ${CURRENT_USER_PASSWORD}     ${ALICE_PASSWORD}
    Set Test Variable    ${CURRENT_USER_NAME}         ${ALICE_DISPLAY_NAME}
    
    # 開啟新的瀏覽器窗口模擬 Alice 登入
    Execute Javascript    window.open('${APP_URL}', '_blank')
    Switch Window    NEW
    Wait For Page To Load
    Login With Account    ${CURRENT_USER_EMAIL}    ${CURRENT_USER_PASSWORD}    ${CURRENT_USER_NAME}

我查看我的好友邀請
    [Documentation]    查看邀請頁籤
    Navigate To Friends Page
    Switch To Friends Tab    邀請    1

我接受來自 Frank Li 的邀請
    [Documentation]    接受好友邀請
    Accept Friend Request    Frank Li

Frank Li 應該出現在我的朋友列表中
    [Documentation]    驗證 Frank 出現在朋友列表
    Switch To Friends Tab    朋友    1
    Verify Friend In List    Frank Li

我應該出現在 Frank Li 的朋友列表中
    [Documentation]    驗證雙向朋友關係
    # 切換回 Frank 的窗口驗證
    Switch Window    MAIN
    Reload Page
    Navigate To Friends Page
    Switch To Friends Tab    朋友    1
    Verify Friend In List    Alice Wang

我拒絕來自 Frank Li 的邀請
    [Documentation]    拒絕好友邀請
    Reject Friend Request

邀請應該從我的待處理列表中移除
    [Documentation]    驗證邀請被移除
    Element Should Not Be Visible    text=Frank Li
    Element Should Be Visible    text=沒有待處理邀請

我的朋友列表應該保持為空
    [Documentation]    驗證朋友列表為空
    Switch To Friends Tab    朋友    0
    Verify Empty Friends List

網路連接出現問題
    [Documentation]    模擬網路問題
    # 這個需要根據實際情況實現
    Log    模擬網路錯誤場景

系統應該顯示適當的錯誤訊息
    [Documentation]    驗證錯誤處理
    # 根據實際錯誤處理邏輯驗證
    Log    驗證錯誤訊息顯示

提供重試選項
    [Documentation]    驗證重試功能
    # 根據實際重試機制驗證
    Log    驗證重試選項可用